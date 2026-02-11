'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { defaultCountry, locationOptions } from '@/lib/location-options'
import { countryCoordinates } from '@/lib/country-coordinates'

const USERNAME_RULE = /^[a-zA-Z0-9._-]{3,30}$/
const PASSWORD_MIN_LENGTH = 6

const getLocalizedAuthError = (message: string) => {
  if (message === 'Invalid login credentials') {
    return '用户名或密码错误，请检查后重试。'
  }

  return message
}

const fetchCoordinates = async (
  country: string,
  province: string,
  city: string
): Promise<{ coordinates: { lat: number; lng: number } | null; reason?: string }> => {
  if (country && country !== '中国' && countryCoordinates[country]) {
    const [lng, lat] = countryCoordinates[country]
    const randomOffset = () => (Math.random() - 0.5) * 0.1
    return { coordinates: { lat: lat + randomOffset(), lng: lng + randomOffset() } }
  }

  const effectiveCity = city === '其他' ? '' : city
  const effectiveProvince = province === '其他' ? '' : province
  const address = [effectiveProvince, effectiveCity].filter(Boolean).join('')
  if (!address) return { coordinates: null, reason: 'empty_address' }

  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address,
        city: effectiveCity || effectiveProvince || '全国',
      }),
    })

    if (!response.ok) {
      return { coordinates: null, reason: `http_${response.status}` }
    }

    const data = await response.json()
    if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
      return { coordinates: { lat: data.lat, lng: data.lng } }
    }

    return { coordinates: null, reason: 'no_result' }
  } catch (error) {
    console.error('Geocoding failed', error)
    return { coordinates: null, reason: 'network_error' }
  }
}

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState(defaultCountry)
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [parentContact, setParentContact] = useState(false)
  const [educatorContact, setEducatorContact] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const provinces = useMemo(() => {
    return Object.keys(locationOptions[country as keyof typeof locationOptions] ?? {})
  }, [country])

  const cities = useMemo(() => {
    const selectedCountry = locationOptions[country as keyof typeof locationOptions]
    if (!selectedCountry || !province) {
      return []
    }
    return selectedCountry[province as keyof typeof selectedCountry] ?? []
  }, [country, province])

  useEffect(() => {
    if (!provinces.length) {
      setProvince('')
      setCity('')
      return
    }
    if (!provinces.includes(province)) {
      const nextProvince = provinces[0]
      setProvince(nextProvince)
      const selectedCountry = locationOptions[country as keyof typeof locationOptions]
      const nextCities =
        nextProvince && selectedCountry && selectedCountry[nextProvince as keyof typeof selectedCountry]
          ? selectedCountry[nextProvince as keyof typeof selectedCountry]
          : []
      setCity(Array.isArray(nextCities) && nextCities.length ? nextCities[0] : '')
    }
  }, [country, province, provinces])

  useEffect(() => {
    if (!cities.length) {
      setCity('')
      return
    }
    if (!cities.includes(city as never)) {
      setCity(cities.length > 0 ? String(cities[0]) : '')
    }
  }, [cities, city])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      if (!USERNAME_RULE.test(username)) {
        setMessage('用户名需为 3-30 位，仅支持英文字母、数字、点(.)、下划线(_)和短横线(-)。')
        return
      }

      if (password.length < PASSWORD_MIN_LENGTH) {
        setMessage(`密码至少需要 ${PASSWORD_MIN_LENGTH} 位。`)
        return
      }

      if (mode === 'login') {
        const email = `${username}@users.liberalacademy.site`
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage(`错误: ${getLocalizedAuthError(error.message)}`)
          return
        }

        const signedInUserId = signInData.user?.id
        if (signedInUserId) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('nickname, gender, age, bio')
            .eq('id', signedInUserId)
            .maybeSingle()

          if (profileError) {
            setMessage(`错误: ${profileError.message}`)
            return
          }

          const isBlank = (value?: string | null) => !value || value.trim() === ''
          const needsProfileCompletion =
            !profile ||
            (isBlank(profile.nickname) && isBlank(profile.gender) && !profile.age && isBlank(profile.bio))

          setMessage(`欢迎回来，${username}！登录成功。`)
          router.push(needsProfileCompletion ? '/profile' : '/')
          return
        }

        setMessage(`欢迎回来，${username}！登录成功。`)
        router.push('/')
        return
      }

      if (password !== confirmPassword) {
        setMessage('两次输入的密码不一致，请检查。')
        return
      }

      const { data: existingUser, error: existingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle()

      if (existingError) {
        setMessage(`错误: ${existingError.message}`)
        return
      }

      if (existingUser) {
        setMessage('该用户名已被注册，请换一个。')
        return
      }

      const email = `${username}@users.liberalacademy.site`
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
            country,
            province,
            city,
          },
        },
      })

      if (signUpError) {
        setMessage(`错误: ${signUpError.message}`)
        return
      }

      const user = signUpData.user
      if (!user) {
        setMessage('注册失败，请稍后再试。')
        return
      }

      // Ensure we have a session before calling geocode API (which requires authentication)
      let sessionUserId = signUpData.session?.user?.id
      if (!sessionUserId) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setMessage(`注册成功，但自动保存个人信息失败，请登录后前往"完善个人信息"保存地址。(${signInError.message})`)
          setMode('login')
          setPassword('')
          setConfirmPassword('')
          return
        }

        sessionUserId = signInData.user?.id
      }

      if (!sessionUserId) {
        setMessage('注册成功，但未获取到登录会话，请登录后前往"完善个人信息"完成保存。')
        setMode('login')
        setPassword('')
        setConfirmPassword('')
        return
      }

      // Now that we have a session, we can call geocode API (which requires authentication)
      let lat: number | null = null
      let lng: number | null = null

      const geocodeResult = await fetchCoordinates(country, province, city)
      if (geocodeResult.coordinates) {
        lat = geocodeResult.coordinates.lat
        lng = geocodeResult.coordinates.lng
      }

      const profilePayload: {
        id: string
        username: string
        display_name: string
        country: string
        province: string
        city: string
        parent_contact: boolean
        educator_contact: boolean
        lat?: number
        lng?: number
      } = {
        id: user.id,
        username,
        display_name: username,
        country,
        province,
        city,
        parent_contact: parentContact,
        educator_contact: educatorContact,
      }

      if (lat !== null && lng !== null) {
        profilePayload.lat = lat
        profilePayload.lng = lng
      }

      const { error: insertError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })

      if (insertError) {
        setMessage(`错误: ${insertError.message}`)
        return
      }

      setMessage(geocodeResult.coordinates ? '注册成功！现在可以使用用户名和密码登录。' : '注册成功！地址坐标暂时未解析，登录后可在“完善个人信息”页重新保存地址。')
      setMode('login')
      setPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发生未知错误'
      setMessage(`错误: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-[#ead8bc] bg-[#fffdf9] text-[#334e68] shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#3f638c]">登录</CardTitle>
        <CardDescription className="text-[#5f7591]">
          使用用户名和密码登录，或注册新账号
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-[#f2ecdf] p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setMessage('')
            }}
            className={`rounded-md px-3 py-2 transition ${
              mode === 'login' ? 'bg-white shadow text-[#314c67]' : 'text-[#6c7f96]'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register')
              setMessage('')
            }}
            className={`rounded-md px-3 py-2 transition ${
              mode === 'register' ? 'bg-white shadow text-[#314c67]' : 'text-[#6c7f96]'
            }`}
          >
            注册
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2">
              用户名（注册后不可更改。登录后可在个人信息页面添加对外展示中文昵称。）
            </label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9._\-]{3,30}"
              title="用户名需为 3-30 位，仅支持英文字母、数字、点(.)、下划线(_)和短横线(-)。"
              required
            />
            {mode === 'register' && (
              <p className="mt-2 text-xs text-[#6f8299]">
                用户名请使用 3-30 位英文字母、数字、点(.)、下划线(_)或短横线(-)。
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              密码
            </label>
            <Input
              id="password"
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={PASSWORD_MIN_LENGTH}
              title={`密码至少 ${PASSWORD_MIN_LENGTH} 位。`}
              required
            />
            {mode === 'register' && (
              <p className="mt-2 text-xs text-[#6f8299]">
                密码至少 {PASSWORD_MIN_LENGTH} 位，建议包含大小写字母、数字和符号以提升安全性。
              </p>
            )}
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  所在地
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <label htmlFor="country" className="sr-only">
                    国家/地区
                  </label>
                  <select
                    id="country"
                    name="country"
                    autoComplete="country-name"
                    className="h-10 rounded-md border border-[#d8c6ab] bg-[#fffefb] px-3 text-sm text-[#2f4b66]"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  >
                    {Object.keys(locationOptions).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <label htmlFor="province" className="sr-only">
                    省/州
                  </label>
                  <select
                    id="province"
                    name="province"
                    autoComplete="address-level1"
                    className="h-10 rounded-md border border-[#d8c6ab] bg-[#fffefb] px-3 text-sm text-[#2f4b66]"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  >
                    {provinces.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <label htmlFor="city" className="sr-only">
                    城市
                  </label>
                  <select
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    className="h-10 rounded-md border border-[#d8c6ab] bg-[#fffefb] px-3 text-sm text-[#2f4b66]"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  >
                    {cities.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-[#6f8299]">
                  注册信息将保存到后台数据库中。
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-[#4f6883]">
                  <input
                    id="parentContact"
                    type="checkbox"
                    checked={parentContact}
                    onChange={(e) => setParentContact(e.target.checked)}
                  />
                  <label htmlFor="parentContact">注册联系人是家长</label>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#4f6883]">
                  <input
                    id="educatorContact"
                    type="checkbox"
                    checked={educatorContact}
                    onChange={(e) => setEducatorContact(e.target.checked)}
                  />
                  <label htmlFor="educatorContact">注册联系人是教育支持者</label>
                </div>
              </div>
            </>
          )}

          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.includes('错误') 
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <Button type="submit" className="w-full  bg-[#6e8fb1] text-white hover:bg-[#5d7fa2]" disabled={isLoading}>
            {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/" className="text-[#6f8299] hover:text-[#3f638c]">
            返回首页
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
