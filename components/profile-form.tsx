'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { locationOptions } from '@/lib/location-options'
import { usePostHog } from 'posthog-js/react'
import { countryCoordinates } from '@/lib/country-coordinates'

type Gender = '男' | '女' | '其他'

const isOtherLocation = (value: string) => value.includes('其他')
const normalizeRegionName = (value: string) => value.split('_')[0] ?? value

export function ProfileForm() {
  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [wechat, setWechat] = useState('')
  const [parentContact, setParentContact] = useState(false)
  const [educatorContact, setEducatorContact] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const posthog = usePostHog()

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
        .select('username, country, province, city, nickname, gender, age, bio, wechat, parent_contact, educator_contact')
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
      setWechat(profile?.wechat ?? '')
      setParentContact(Boolean(profile?.parent_contact))
      setEducatorContact(Boolean(profile?.educator_contact))
    }

    loadUser()
  }, [router])

  const calculateCoordinates = async (
    addressStr: string,
    cityLimit: string
  ): Promise<{ lat: number; lng: number } | null> => {
    if (country && countryCoordinates[country] && (country !== '中国' || !addressStr)) {
      const [lng, lat] = countryCoordinates[country]
      const randomOffset = () => (Math.random() - 0.5) * 0.1
      return { lat: lat + randomOffset(), lng: lng + randomOffset() }
    }

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addressStr,
          city: cityLimit,
        }),
      })
      if (!response.ok) {
        return null
      }

      const data = await response.json()
      if (typeof data?.lat === 'number' && typeof data?.lng === 'number') {
        return { lat: data.lat, lng: data.lng }
      }

      return null
    } catch (error) {
      console.error('Geocoding failed', error)
      return null
    }
  }

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

      // 1. 清洗数据：如果选了"其他"，就把它视为空字符串
      // 这样地址就会自动回退到上一级（比如选了"其他"市，就只查省的坐标）
      const effectiveCity = city === '其他' ? '' : city
      const effectiveProvince = province === '其他' ? '' : province

      // 2. 构造更"干净"的地址字符串
      // 原来是: [province, city].filter(Boolean).join('') -> "广东省其他" (错误)
      // 现在是: "广东省" (正确，高德能识别)
      const addressStr = [effectiveProvince, effectiveCity].filter(Boolean).join('')

      // 3. 限制查询范围也同步处理
      const cityLimit = effectiveCity || effectiveProvince || '全国'

      let lat: number | null = null
      let lng: number | null = null
      let hasCoordinateUpdate = false

      if (addressStr || (country && country !== '中国')) {
        const coordinates = await calculateCoordinates(addressStr, cityLimit)
        if (coordinates) {
          lat = coordinates.lat
          lng = coordinates.lng
          hasCoordinateUpdate = true
        }
      }

      const profilePayload: {
        id: string
        country: string
        province: string
        city: string
        nickname: string | null
        display_name: string | null
        gender: Gender | null
        age: number | null
        bio: string | null
        wechat: string | null
        parent_contact: boolean
        educator_contact: boolean
        updated_at: string
        lat?: number
        lng?: number
      } = {
        id: currentUser.id,
        country,
        province,
        city,
        nickname: nickname.trim() || null,
        display_name: nickname.trim() || null,
        gender: gender || null,
        age: parsedAge,
        bio: bio.trim() || null,
        wechat: wechat.trim() || null,
        parent_contact: parentContact,
        educator_contact: educatorContact,
        updated_at: new Date().toISOString(),
      }

      if (hasCoordinateUpdate && lat !== null && lng !== null) {
        profilePayload.lat = lat
        profilePayload.lng = lng
      }

      const { error: saveError } = await supabase.from('profiles').upsert(profilePayload)

      if (saveError) {
        setMessage(`错误: ${saveError.message}`)
      } else {
        setMessage(hasCoordinateUpdate ? '个人信息已保存！' : '个人信息已保存（坐标未更新成功，建议返回首页后重试保存地址）。')
        posthog?.capture('update_profile', {
          changed_city: city,
          changed_gender: gender || null,
        })
        router.push('/')
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
    posthog?.reset()
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
    <Card className="w-full max-w-xl border-[#ead8bc] bg-[#fffdf9] text-[#334e68] shadow-lg">
      <CardHeader>
        <CardTitle className="text-[#3f638c]">完善个人信息</CardTitle>
        <CardDescription className="text-[#5f7591]">填写以下信息，更快找到聊得来的伙伴~</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[#ecdcc2] bg-[#f8f3e8] p-3">
          <p className="text-sm text-[#5f7591]">
            <strong>用户名:</strong> {username || '未设置'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-[#3f638c]">
              昵称
            </label>
            <Input
              id="nickname"
              type="text"
              placeholder="请输入你希望向他人展示的名字"
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

          <div>
            <label htmlFor="wechat" className="mb-2 block text-sm font-medium text-[#3f638c]">
              微信号（可补充添加时需附的备注）
            </label>
            <Input
              id="wechat"
              type="text"
              placeholder="例：wxid_123（加我时请备注来自自由学社）"
              value={wechat}
              onChange={(e) => setWechat(e.target.value)}
            />
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
  )
}
