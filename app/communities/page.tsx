'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Community = {
  id: number
  section: '近期活跃' | '长期开放'
  name: string
  summary: string
  owner: string
  wechat: string
}

const communities: Community[] = [
  {
    id: 1,
    section: '近期活跃',
    name: '青年支持计划进展直播群（家长友好）',
    summary:
      '由几位 00 后发起，围绕青少年支持计划持续更新项目进展，包含心理陪伴、自习支持与职业发展支持系统。欢迎有筹备中项目的伙伴加入交流。',
    owner: '定慧',
    wechat: '15353000580',
  },
  {
    id: 2,
    section: '近期活跃',
    name: '杏情中人2.0（随缘招新啦）',
    summary:
      '围绕性教育、亲密关系与 sexuality 的科普探讨社群，强调包容、平等、开放与反歧视，鼓励大家在安全友好的氛围中自由交流。',
    owner: 'Amara亚洁',
    wechat: 'Y220284Q',
  },
  {
    id: 3,
    section: '近期活跃',
    name: '咆哮猫の基地（16岁以下推荐）',
    summary:
      '偏低龄 homeschooler 互助社群，氛围轻松包容，可聊兴趣、分享在家上学经验、互帮互助，也欢迎发起音乐会、文学社等活动。',
    owner: '雪杉',
    wechat: 'wl61691120070616',
  },
  {
    id: 4,
    section: '近期活跃',
    name: 'Galiton School 咖啡屋（家长友好）',
    summary:
      '面向在家上学群体的学业咨询互助群，聚焦自考、留学、高考等路径，群内有学生与家长可提供经验分享。',
    owner: '开颜（联系定慧拉你）',
    wechat: '15353000580',
  },
  {
    id: 5,
    section: '近期活跃',
    name: 'Sunny 学习室（16岁以下友好）',
    summary:
      '学习打卡与共学社群，支持每日接龙、连麦、早晚打卡、心理支持，并有学习时长统计与周榜。',
    owner: '小雨',
    wechat: 'L18666802701',
  },
  {
    id: 6,
    section: '近期活跃',
    name: '茶画绘',
    summary:
      '画画爱好者交流基地，欢迎从新手到大神平等友好交流，也可以聊画画之外的话题，一起提升与分享。',
    owner: '肥波',
    wechat: '18022424927',
  },
  {
    id: 7,
    section: '长期开放',
    name: '搞钱要紧！💸💸💸',
    summary:
      '财商成长与信息共享社群，聚焦富思维、信息差与行动落地，鼓励彼此支持、共同成长。',
    owner: 'Amara亚洁',
    wechat: 'Y220284Q',
  },
  {
    id: 8,
    section: '长期开放',
    name: '机遇：Gap游学实习资源分享',
    summary:
      '共享游学、实习、义工、夏令营等青年成长项目资源，互助交流 gap 游学经验与攻略。',
    owner: '寇麟（加时注明来意 | 游学群）',
    wechat: 'kl1231208',
  },
  {
    id: 9,
    section: '长期开放',
    name: '法内狂徒聚集地',
    summary:
      '法律常识普及互助群，涵盖人身财产保护、行政处罚应对、劳动法、隐私侵权等议题（不提供正式法律意见）。',
    owner: 'Veronica',
    wechat: 'Ronnie398376',
  },
  {
    id: 10,
    section: '长期开放',
    name: '【成功日记】行动力！',
    summary:
      '成长与行动力社群，以记录、复盘、分享激发正向反馈，帮助形成习惯、积累自信并突破自我。',
    owner: 'Kala',
    wechat: 'awj2309',
  },
  {
    id: 11,
    section: '长期开放',
    name: '神秘学Mystic Hub',
    summary:
      '围绕塔罗、显化、音疗、潜意识疗愈、瑜伽等内容的交流空间，也讨论个人成长与行业应用。',
    owner: '野色',
    wechat: 'D13626159494',
  },
  {
    id: 12,
    section: '长期开放',
    name: '心灵港湾计划',
    summary:
      '面向原生家庭创伤及童年逆境青少年的心理健康互助群，通过网络陪伴与公益服务改善孤独感。',
    owner: '扶麟',
    wechat: 'Skystu_lifulin',
  },
  {
    id: 13,
    section: '长期开放',
    name: '塔菲石（神经多样性友好）',
    summary:
      '关注 ADHD/ASD 等神经多样性议题，整合互助资源，提供日常聊天、身心支持与专题学习交流。',
    owner: '林含光',
    wechat: 'J478920456',
  },
  {
    id: 14,
    section: '长期开放',
    name: '闲置循环小屋',
    summary:
      '闲置物品流通群，可交换、赠送、出售或发布需求，让闲置真正流动起来。',
    owner: '大鹏',
    wechat: 'hkpsjhp',
  },
  {
    id: 15,
    section: '长期开放',
    name: '自由学社Alevel学习窝点',
    summary:
      'A level 自学互助社群，交流学习与申请经验。加群主需自我介绍并说明加群意图与学习情况。',
    owner: '开颜',
    wechat: 'Metaplexis_japonica',
  },
  {
    id: 16,
    section: '长期开放',
    name: '技术交流会',
    summary:
      '以编程、AI、互联网+ 为核心的技术交流学习群，欢迎硬核技术爱好者与项目开发者分享研讨。',
    owner: '阿派（加时注明来意 | 技术交流会）',
    wechat: 'K9403l29iZ_e',
  },
  {
    id: 17,
    section: '长期开放',
    name: '荣格八维九型opssoc推广群',
    summary: '荣格八维、九型及相关话题交流社群。',
    owner: '林含光',
    wechat: 'J478920456',
  },
  {
    id: 18,
    section: '长期开放',
    name: '学社大胆分部',
    summary: '学社大群不便讨论内容的延展交流空间（如炒币等）。',
    owner: 'Lenod',
    wechat: '13908000900',
  },
  {
    id: 19,
    section: '长期开放',
    name: '饭蒙子聚集地',
    summary: '分享吃饭、做饭日常的生活向社群。',
    owner: '阿贞',
    wechat: 'wxid_wvivprotd00n22',
  },
  {
    id: 20,
    section: '长期开放',
    name: '10倍速学习之道（家长友好）',
    summary:
      '聚焦思维能力与学习方法的交流社群，欢迎分享困扰、共解难题，并有成长与知识开源相关分群。',
    owner: '童承彦',
    wechat: 'nvr07542693209',
  },
  {
    id: 21,
    section: '长期开放',
    name: '英语群',
    summary: '英语学习交流与打卡互助群，成员可随意发言相互监督。',
    owner: 'K2CrO4',
    wechat: 'yulinnoname',
  },
  {
    id: 22,
    section: '长期开放',
    name: '星光读写公社',
    summary:
      '以阅读写作为核心的成长社群，通过共读、讨论、即兴写作互相看见，鼓励自由表达与真实思考。',
    owner: '阿喀琉斯之踵',
    wechat: '13532213641',
  },
]

export default function CommunitiesPage() {
  const [activeCardId, setActiveCardId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const sectionOrder: Array<Community['section']> = ['近期活跃', '长期开放']

  const handleCopy = async (community: Community) => {
    await navigator.clipboard.writeText(community.wechat)
    setCopiedId(community.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">社群列表</h1>
          <p className="text-gray-600">点击卡片查看群主和微信号，并可一键复制微信号。</p>
        </div>

        <div className="mb-6">
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>

        {sectionOrder.map((section) => {
          const sectionCommunities = communities.filter((item) => item.section === section) 

          return (
            <section key={section} className="mb-10">
              <h2 className="mb-4 text-2xl font-semibold">{section}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sectionCommunities.map((community) => {
                  const isOpen = activeCardId === community.id

                  return (
                    <Card
                      key={community.id}
                      className="cursor-pointer transition hover:shadow-md"
                      onClick={() => setActiveCardId(isOpen ? null : community.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                        <CardDescription>点击查看入群信息</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700">{community.summary}</p>

                        {isOpen ? (
                          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-sm">
                            <p>
                              <span className="font-medium">群主：</span>
                              {community.owner}
                            </p>
                            <p className="mt-1">
                              <span className="font-medium">微信号：</span>
                              <button
                                type="button"
                                className="rounded px-1 text-blue-700 underline hover:text-blue-900"
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
                              className="mt-3"
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
      </div>
    </div>
  )
}
