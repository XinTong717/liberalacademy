'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export type Community = {
  id: number
  section: '🌟 近期活跃' | '🌾 长期开放'
  name: string
  summary: string
  owner: string
  wechat: string
}

type CommunitiesListProps = {
  communities: Community[]
  sectionOrder: Array<Community['section']>
}

export function CommunitiesList({ communities, sectionOrder }: CommunitiesListProps) {
  const [activeCardId, setActiveCardId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const handleCopy = async (community: Community) => {
    await navigator.clipboard.writeText(community.wechat)
    setCopiedId(community.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <>
      {sectionOrder.map((section) => {
        const sectionCommunities = communities.filter((item) => item.section === section)

        return (
          <section key={section} className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#3f638c]">{section}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sectionCommunities.map((community) => {
                const isOpen = activeCardId === community.id

                return (
                  <Card
                    key={community.id}
                    className="cursor-pointer border-[#ead8bc] bg-[#fffdf9] transition hover:-translate-y-0.5 hover:shadow-lg"
                    onClick={() => setActiveCardId(isOpen ? null : community.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg text-[#3f638c]">{community.name}</CardTitle>
                      <CardDescription className="text-[#6f8299]">点击查看入群信息</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-6 text-[#4f6883]">{community.summary}</p>

                      {isOpen ? (
                        <div className="mt-4 rounded-md border border-[#c9d9ea] bg-[#eef5fb] p-3 text-sm text-[#36597a]">
                          <p>
                            <span className="font-medium">群主：</span>
                            {community.owner}
                          </p>
                          <p className="mt-1">
                            <span className="font-medium">微信号：</span>
                            <button
                              type="button"
                              className="rounded px-1 text-[#3f638c] underline hover:text-[#2f4b66]"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleCopy(community)
                              }}
                            >
                              {community.wechat}
                            </button>
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 bg-[#6e8fb1] text-white hover:bg-[#5d7fa2]"
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleCopy(community)
                            }}
                          >
                            {copiedId === community.id ? '已复制' : '复制微信号'}
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}
    </>
  )
}
