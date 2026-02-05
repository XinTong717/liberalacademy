'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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


export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState('中国')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
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
      // Ensure we safely access nextCities using fallback empty array if undefined
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

      if (mode === 'login') {
        const email = `${username}@users.liberalacademy.site`
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage(`错误: ${error.message}`)
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

      const profilePayload = {
        id: user.id,
        username,
        display_name: username,
        country,
        province,
        city,
      }
      console.info('Upserting profile with location data', profilePayload)
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert(profilePayload)

      if (insertError) {
        setMessage(`错误: ${insertError.message}`)
        return
      }

      setMessage('注册成功！现在可以使用用户名和密码登录。')
      setMode('login')
      setPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      setMessage(`错误: ${error.message || '发生未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>
            使用用户名和密码登录，或注册新账号
          </CardDescription>
        </CardHeader>
        <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setMessage('')
              }}
              className={`rounded-md px-3 py-2 transition ${
                mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
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
                mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              注册
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                用户名
              </label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
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
                required
              />
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
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    >
                      {cities.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    注册信息将保存到后台数据库中。
                  </p>
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              返回首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
