'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [city, setCity] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Load existing profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single()

      if (profile?.city) {
        setCity(profile.city)
      }
    }

    loadUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage('请先登录')
        router.push('/login')
        return
      }

      // Upsert profile data
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          city: city,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setMessage(`错误: ${error.message}`)
      } else {
        setMessage('城市信息已保存！')
      }
    } catch (error: any) {
      setMessage(`错误: ${error.message || '发生未知错误'}`)
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
      <div className="min-h-screen flex items-center justify-center">
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>个人资料</CardTitle>
          <CardDescription>
            设置您的城市或位置信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>用户:</strong> {user.email || user.phone || '未设置'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-2">
                所在城市
              </label>
              <Input
                id="city"
                type="text"
                placeholder="例如：北京、上海、广州"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                您的城市信息将显示在地图上
              </p>
            </div>

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
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              退出登录
            </Button>
            <div className="text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
                返回首页
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
