'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type Gender = '男' | '女' | '其他'

const locationOptions = {
  中国: {
    北京: ['北京'],
    上海: ['上海'],
    广东: ['广州', '深圳'],
    四川: ['成都', '绵阳'],
    浙江: ['杭州', '宁波'],
  },
  美国: {
    加利福尼亚: ['旧金山', '洛杉矶'],
    纽约: ['纽约'],
    华盛顿: ['西雅图'],
  },
  日本: {
    东京都: ['东京'],
    大阪府: ['大阪'],
  },
  新加坡: {
    中央区: ['新加坡'],
  },
}

export default function ProfilePage() {
  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<User | null>(null)
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

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      setUser(currentUser)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, country, province, city, nickname, gender, age, bio')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error) {
        setMessage(`错误: ${error.message}`)
        return
      }

      setUsername(profile?.username ?? currentUser.email?.split('@')[0] ?? '')
      setCountry(profile?.country ?? '')
      setProvince(profile?.province ?? '')
      setCity(profile?.city ?? '')
      setNickname(profile?.nickname ?? '')
      setGender((profile?.gender as Gender | null) ?? '')
      setAge(profile?.age ? String(profile.age) : '')
      setBio(profile?.bio ?? '')
    }

    loadUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    const parsedAge = age ? Number(age) : null
    if (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120)) {
      setMessage('错误: 年龄需要是 1 到 120 的整数。')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        setMessage('请先登录')
        router.push('/login')
        return
      }

      const profilePayload = {
        id: currentUser.id,
        country,
        province,
        city,
        nickname: nickname.trim() || null,
        gender: gender || null,
        age: parsedAge,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error: saveError } = await supabase.from('profiles').upsert(profilePayload)

      if (saveError) {
        setMessage(`错误: ${saveError.message}`)
      } else {
        setMessage('个人信息已保存！')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '发生未知错误'
      setMessage(`错误: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f4ec]">
        <p className="text-[#5f7591]">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f4ec] px-4 py-12">
      <Card className="w-full max-w-xl border-[#ead8bc] bg-[#fffdf9] text-[#334e68] shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#3f638c]">完善个人信息</CardTitle>
          <CardDescription className="text-[#5f7591]">补充昵称、性别、年龄、自我介绍，并可更新地图展示使用的地址</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#ecdcc2] bg-[#f8f3e8] p-3">
            <p className="text-sm text-[#5f7591]">
              <strong>用户名:</strong> {username || '未设置'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="country" className="mb-2 block text-sm font-medium text-[#3f638c]">
                  国家
                </label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#d8c6ab] bg-[#fffefb] px-3 text-sm text-[#2f4b66] outline-none focus:border-[#7ea0bf] focus:ring-2 focus:ring-[#dce9f4]"
                  required
                >
                  {Object.keys(locationOptions).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
              <label htmlFor="province" className="mb-2 block text-sm font-medium text-[#3f638c]">
                  省/州
                </label>
                <select
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#d8c6ab] bg-[#fffefb] px-3 text-sm text-[#2f4b66] outline-none focus:border-[#7ea0bf] focus:ring-2 focus:ring-[#dce9f4]"
                  required
                >
                  {provinces.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
              <label htmlFor="city" className="mb-2 block text-sm font-medium text-[#3f638c]">
                  城市
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#d8c6ab] bg-[#fffefb] px-3 text-sm text-[#2f4b66] outline-none focus:border-[#7ea0bf] focus:ring-2 focus:ring-[#dce9f4]"
                  required
                >
                  {cities.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
            <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-[#3f638c]">
                昵称
              </label>
              <Input
                id="nickname"
                type="text"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div>
              <p className="mb-2 block text-sm font-medium text-[#3f638c]">性别</p>
              <div className="flex gap-4">
                {(['男', '女', '其他'] as Gender[]).map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-[#4f6883]">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={gender === option}
                      onChange={() => setGender(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="age" className="mb-2 block text-sm font-medium text-[#3f638c]">
                年龄
              </label>
              <Input
                id="age"
                type="number"
                min={1}
                max={120}
                placeholder="请输入年龄"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="bio" className="mb-2 block text-sm font-medium text-[#3f638c]">
                自我介绍
              </label>
              <textarea
                id="bio"
                rows={4}
                placeholder="介绍一下你自己...可以是自休学状态、性格爱好等，任何你觉得会帮助你找到合适的同伴的信息~"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-md border border-[#d8c6ab] bg-[#fffefb] px-3 py-2 text-sm text-[#2f4b66] outline-none focus:border-[#7ea0bf] focus:ring-2 focus:ring-[#dce9f4]"
              />
            </div>

            {message && (
              <div
              className={`rounded-md p-3 text-sm ${
                message.includes('错误') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}
            >
                {message}
              </div>
            )}

            <Button type="submit" className="w-full bg-[#6e8fb1] text-white hover:bg-[#5d7fa2]" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <Button variant="outline" onClick={handleLogout} className="w-full border-[#d8c6ab] text-[#4f6883] hover:bg-[#f6efe4]">
              退出登录
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-[#6f8299] hover:text-[#3f638c]">
                返回首页
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
