'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+86')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
 
  const normalizeE164 = (dialCode: string, raw: string) => {
    const normalizedDialCode = dialCode.replace(/\s+/g, '')
    const cleaned = raw.replace(/[^0-9]/g, '')
    if (!normalizedDialCode.startsWith('+') || !cleaned) {
      return ''
    }
    return `${normalizedDialCode}${cleaned}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      if (phone) {
        const normalizedPhone = normalizeE164(countryCode, phone)
        if (!normalizedPhone) {
          setMessage('请输入有效的国际手机号，例如 +1 4150000000')
          return
        }
        // SMS login (Magic Link via phone)
        const { error } = await supabase.auth.signInWithOtp({
          phone: normalizedPhone,
          options: {
            channel: 'sms',
          },
        })

        if (error) {
          setMessage(`错误: ${error.message}`)
        } else {
          setMessage('验证码已发送到您的手机，请查收！')
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
            使用手机号登录自由学社
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                手机号
              </label>
              <div className="flex gap-2">
                <select
                  id="countryCode"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="+1">+1 美国/加拿大</option>
                  <option value="+44">+44 英国</option>
                  <option value="+49">+49 德国</option>
                  <option value="+61">+61 澳大利亚</option>
                  <option value="+65">+65 新加坡</option>
                  <option value="+81">+81 日本</option>
                  <option value="+82">+82 韩国</option>
                  <option value="+86">+86 中国大陆</option>
                  <option value="+852">+852 中国香港</option>
                  <option value="+886">+886 中国台湾</option>
                </select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                支持国际号码格式，系统将自动拼接国家区号发送短信验证码。
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
