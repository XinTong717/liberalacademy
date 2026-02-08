'use client'

import { useEffect, useState } from 'react'

export default function WxGuide() {
  const [isWeChat, setIsWeChat] = useState(false)

  useEffect(() => {
    // 检测 UserAgent 是否包含 MicroMessenger
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('micromessenger')) {
      setIsWeChat(true)
    }
  }, [])

  if (!isWeChat) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center bg-black/90 p-5 text-white backdrop-blur-sm">
      {/* 指向右上角的箭头 */}
      <div className="flex w-full justify-end pr-4 pt-2">
        <svg
          viewBox="0 0 1024 1024"
          width="64"
          height="64"
          fill="currentColor"
          className="animate-bounce"
        >
          <path d="M669.6 813.6c-4.8 0-9.6-1.6-13.6-4.8-8-6.4-9.6-17.6-3.2-25.6l312-392c4-4.8 9.6-7.2 16-7.2 2.4 0 4.8 0.8 7.2 1.6 2.4 0.8 4.8 2.4 6.4 4.8l88 112c6.4 8 4.8 20-3.2 26.4-8 6.4-20 4.8-26.4-3.2L968 416.8l-284.8 358.4c-4 10.4-8.8 38.4-13.6 38.4z" />
          <path d="M982.4 421.6c-10.4 0-19.2-8.8-19.2-19.2V70.4c0-10.4 8.8-19.2 19.2-19.2s19.2 8.8 19.2 19.2v332c0 10.4-8.8 19.2-19.2 19.2z" />
          <path d="M512 960C264.8 960 64 759.2 64 512S264.8 64 512 64c10.4 0 19.2 8.8 19.2 19.2s-8.8 19.2-19.2 19.2C285.6 102.4 102.4 285.6 102.4 512S285.6 921.6 512 921.6s409.6-183.2 409.6-409.6c0-10.4 8.8-19.2 19.2-19.2s19.2 8.8 19.2 19.2C960 759.2 759.2 960 512 960z" />
        </svg>
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-xl font-bold text-white mb-4">
          微信无法直接访问
        </h2>
        <div className="bg-[#1e1e1e] rounded-xl p-6 border border-gray-700">
            <p className="text-gray-300 text-base leading-relaxed mb-2">
            点击右上角 <span className="text-xl">...</span>
            </p>
            <p className="text-gray-300 text-base leading-relaxed">
            选择 <span className="text-[#6e8fb1] font-bold">在浏览器打开</span>
            </p>
            <p className="text-gray-400 text-sm mt-4">
            (Safari 或 Chrome)
            </p>
        </div>
        <p className="text-xs text-gray-500 mt-8">
            Liberal Academy 自由学社
        </p>
      </div>
    </div>
  )
}