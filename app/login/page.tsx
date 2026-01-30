'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [usePhone, setUsePhone] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      if (usePhone && phone) {
        // SMS login (Magic Link via phone)
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
          options: {
            channel: 'sms',
          },
        })

        if (error) {
          setMessage(`错误: ${error.message}`)
        } else {
          setMessage('验证码已发送到您的手机，请查收！')
        }
      } else if (!usePhone && email) {
        // Email Magic Link
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        })

        if (error) {
          setMessage(`错误: ${error.message}`)
        } else {
          setMessage('登录链接已发送到您的邮箱，请查收！')
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
            使用手机号或邮箱登录自由学社
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={usePhone ? 'default' : 'outline'}
              onClick={() => setUsePhone(true)}
              className="flex-1"
            >
              手机号
            </Button>
            <Button
              variant={!usePhone ? 'default' : 'outline'}
              onClick={() => setUsePhone(false)}
              className="flex-1"
            >
              邮箱
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {usePhone ? (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  手机号
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  邮箱
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
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
              {isLoading ? '发送中...' : '发送验证码/链接'}
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
