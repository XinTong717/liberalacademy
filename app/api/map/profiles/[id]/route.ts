import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, props: RouteContext) {
  const params = await props.params
  const id = params.id?.trim()

  if (!id) {
    return NextResponse.json({ error: '缺少用户 ID' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '请先登录后查看详情' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('gender, age, bio, wechat, parent_contact')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return NextResponse.json({
      detail: data
        ? {
            gender: data.gender ?? null,
            age: data.age ?? null,
            bio: data.bio ?? null,
            wechat: data.wechat ?? null,
            parentContact: Boolean(data.parent_contact),
          }
        : null,
    })
  } catch (error) {
    console.error('Load map profile detail failed:', error)
    return NextResponse.json({ error: '加载用户详情失败' }, { status: 500 })
  }
}
