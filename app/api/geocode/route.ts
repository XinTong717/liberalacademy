import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit'

export const runtime = 'nodejs'

/**
 * Validate and sanitize input strings
 */
function validateInput(
  value: unknown,
  fieldName: string,
  maxLength: number = 100,
  minLength: number = 1
): { valid: boolean; error?: string; sanitized?: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` }
  }

  const trimmed = value.trim()

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} is required` }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` }
  }

  // Basic sanitization: remove potentially dangerous characters
  // Allow Chinese characters, letters, numbers, spaces, and common punctuation
  const sanitized = trimmed.replace(/[<>\"'&]/g, '')

  return { valid: true, sanitized }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // 2. Rate limiting (per user ID, fallback to IP)
    const identifier = user.id || getClientIdentifier(req)
    const rateLimitResult = checkRateLimit(
      `geocode:${identifier}`,
      10, // 10 requests
      60 * 1000 // per minute
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
          },
        }
      )
    }

    // 3. Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { address, city } = body

    // 4. Input validation
    const addressValidation = validateInput(address, 'address', 200, 1)
    if (!addressValidation.valid) {
      return NextResponse.json(
        { error: addressValidation.error },
        { status: 400 }
      )
    }

    let cityValidation: { valid: boolean; error?: string; sanitized?: string } = {
      valid: true,
      sanitized: undefined,
    }
    if (city !== undefined && city !== null) {
      cityValidation = validateInput(city, 'city', 50, 1)
      if (!cityValidation.valid) {
        return NextResponse.json(
          { error: cityValidation.error },
          { status: 400 }
        )
      }
    }

    // 5. Server configuration check
    const key = process.env.AMAP_WEB_SERVICE_KEY
    if (!key) {
      console.error('AMAP_WEB_SERVICE_KEY is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // 6. Call AMAP geocoding API
    const url = new URL('https://restapi.amap.com/v3/geocode/geo')
    url.searchParams.set('key', key)
    url.searchParams.set('address', addressValidation.sanitized!)
    if (cityValidation.sanitized) {
      url.searchParams.set('city', cityValidation.sanitized)
    }

    const res = await fetch(url.toString())
    
    if (!res.ok) {
      console.error('AMAP API error:', res.status, res.statusText)
      return NextResponse.json(
        { error: 'Geocoding service unavailable' },
        { status: 502 }
      )
    }

    const data = await res.json()

    if (data.status !== '1' || !data.geocodes?.length) {
      return NextResponse.json({ lat: null, lng: null }) // 没查到
    }

    const location = data.geocodes[0].location // 格式 "lng,lat"
    const [lngStr, latStr] = location.split(',')

    return NextResponse.json(
      {
        lat: parseFloat(latStr),
        lng: parseFloat(lngStr),
      },
      {
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
        },
      }
    )
  } catch (error) {
    console.error('Geocode error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}