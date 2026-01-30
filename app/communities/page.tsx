'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Hardcoded WeChat interest groups data
const communities = [
  {
    id: 1,
    name: '北京在家教育群',
    description: '北京地区的在家教育家长交流群',
    city: '北京',
    memberCount: 156,
    qrCode: 'wechat://group1',
  },
  {
    id: 2,
    name: '上海自由学习社区',
    description: '上海及周边地区在家教育支持群',
    city: '上海',
    memberCount: 203,
    qrCode: 'wechat://group2',
  },
  {
    id: 3,
    name: '广州在家教育互助',
    description: '广州地区在家教育资源共享群',
    city: '广州',
    memberCount: 128,
    qrCode: 'wechat://group3',
  },
  {
    id: 4,
    name: '深圳创新教育',
    description: '深圳地区创新教育理念交流群',
    city: '深圳',
    memberCount: 189,
    qrCode: 'wechat://group4',
  },
  {
    id: 5,
    name: '杭州自然教育',
    description: '杭州地区自然教育实践分享群',
    city: '杭州',
    memberCount: 142,
    qrCode: 'wechat://group5',
  },
  {
    id: 6,
    name: '成都在家教育',
    description: '成都及西南地区在家教育支持群',
    city: '成都',
    memberCount: 167,
    qrCode: 'wechat://group6',
  },
]

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">社群列表</h1>
          <p className="text-gray-600">
            加入您所在城市的在家教育微信群
          </p>
        </div>

        <div className="mb-4">
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {communities.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{community.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {community.city}
                    </CardDescription>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {community.memberCount} 人
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {community.description}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // In a real app, this would open WeChat QR code or redirect
                    alert(`扫描二维码加入 ${community.name}\n\n在实际应用中，这里会显示微信群二维码`)
                  }}
                >
                  加入群聊
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>提示:</strong> 点击"加入群聊"按钮后，在实际应用中会显示微信群的二维码。
            您可以通过扫描二维码加入相应的微信群。
          </p>
        </div>
      </div>
    </div>
  )
}
