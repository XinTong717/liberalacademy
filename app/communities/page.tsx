import Link from 'next/link'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Button } from '@/components/ui/button'
import { CommunitiesList, type Community } from '@/components/communities-list'
import { CreateCommunityForm } from '@/components/create-community-form'

// Read communities data from JSON file at build time
const communitiesFilePath = join(process.cwd(), 'data', 'communities.json')
const communitiesData = JSON.parse(readFileSync(communitiesFilePath, 'utf-8'))
const communities: Community[] = communitiesData as Community[]

const sectionOrder: Array<Community['section']> = ['🌟 近期活跃', '🌾 长期开放']

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen bg-[#f8f4ec] px-4 py-12">
      <div className="mx-auto max-w-6xl text-[#334e68]">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-[#3f638c]">🧑‍🧑‍🧒‍🧒 社群列表</h1>
          <p className="text-[#5f7591]">点击卡片查看群主和微信号，并可一键复制微信号。</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link href="/">
            <Button variant="outline" className="border-[#d8c6ab] bg-[#fffdf9] text-[#4f6883] hover:bg-[#f6efe4]">
              返回首页
            </Button>
          </Link>
          <CreateCommunityForm />
        </div>

        <CommunitiesList communities={communities} sectionOrder={sectionOrder} />
      </div>
    </div>
  )
}
