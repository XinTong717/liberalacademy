'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      if (email) {
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
        })

        if (error) {
          setMessage(`错误: ${error.message}`)
        } else {
          setMessage('验证码已发送到您的邮箱，请查收！')
        }
      }
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
            使用邮箱验证码登录自由学社
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                手机号
              </label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                我们将向您的邮箱发送验证码用于登录或注册。
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
              {isLoading ? '发送中...' : '发送邮箱验证码'}
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
