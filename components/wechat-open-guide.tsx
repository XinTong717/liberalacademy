'use client'

import { useEffect, useMemo, useState } from 'react'

function isWeChat() {
  return /micromessenger/i.test(navigator.userAgent) // 常用判断方式 :contentReference[oaicite:3]{index=3}
}

export default function WxGuide() {
  const [show, setShow] = useState(false)
  const [copied, setCopied] = useState(false)

  const url = useMemo(() => (typeof window === 'undefined' ? '' : window.location.href), [])

  useEffect(() => {
    // 1. 只要是浏览器环境
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      // 2. 只要检测到是微信 (MicroMessenger)
      const isWeChat = /micromessenger/i.test(navigator.userAgent)
      
      // 3. 【关键修改】去掉 URL 参数检查，去掉 sessionStorage 检查
      // 只要是微信，就无条件强制显示！确保测试能过。
      if (isWeChat) {
        setShow(true)
      }
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('wx_guide_dismissed', '1')
    setShow(false)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url) // 需要用户手势触发 :contentReference[oaicite:4]{index=4}
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('复制下面链接到浏览器打开：', url)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 text-white backdrop-blur-sm">
      {/* 右上角箭头：适配刘海安全区 :contentReference[oaicite:5]{index=5} */}
      <div className="flex w-full justify-end pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] pr-4 pt-3">
        <div className="text-right select-none">
          <div className="text-4xl animate-bounce">↗</div>
          <div className="text-xs opacity-90">点右上角 ···</div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-md px-5">
        <div className="rounded-2xl bg-white/10 border border-white/15 p-5 shadow-xl">
          {/* 你可以替换成你首页同款 logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              自
            </div>
            <div>
              <div className="text-lg font-semibold">自由学社</div>
              <div className="text-xs text-white/70">自休学社区地图</div>
            </div>
          </div>

          <div className="mt-4 text-sm leading-6 text-white/90">
            微信内打开可能会出现加载异常。<br />
            请点右上角 <span className="font-semibold">···</span> →
            <span className="font-semibold"> 在浏览器打开</span>（Safari/Chrome）。
          </div>

          <button
            onClick={copyLink}
            className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            {copied ? '已复制 ✅' : '一键复制链接（最省事）'}
          </button>

          <button
            onClick={dismiss}
            className="mt-3 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/90"
          >
            我知道了（本次不再提示）
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-white/50">
          Liberal Academy · 自由学社
        </div>
      </div>
    </div>
  )
}
