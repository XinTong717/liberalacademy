import Map from '@/components/map'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#fbf7ee]">
      <Map />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fbf7ee]/80 via-[#fdfbf5]/30 to-transparent" />
      {/* Navigation overlay */}
      <div className="absolute left-4 right-4 top-24 z-10 flex flex-wrap justify-end gap-3 sm:left-auto sm:right-6 sm:top-6">
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-full bg-white/90 text-[#6e8fb1] shadow-md ring-1 ring-[#e7d4b5] hover:bg-white transition-colors text-sm font-semibold"
        >
          登录
        </Link>
        <Link
          href="/communities"
          className="px-5 py-2.5 rounded-full bg-[#e8f3f6]/90 text-[#5b9aa0] shadow-md ring-1 ring-[#b9dfd7] hover:bg-[#f0fafb] transition-colors text-sm font-semibold"
        >
          社群
        </Link>
      </div>
      {/* Title overlay */}
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center gap-4 rounded-2xl border border-[#efdcc4] bg-white/85 px-4 py-3 shadow-lg backdrop-blur sm:left-6 sm:right-auto sm:top-6">
        <Image
          src="/brand/liberal-academy-logo.png"
          alt="自由学社标志"
          width={56}
          height={56}
          className="rounded-full border border-[#f0e3cf] bg-white"
          priority
        />
        <div>
          <h1 className="text-2xl font-bold text-[#5e7fa6]">自由学社</h1>
          <p className="text-sm text-[#7a9bb8]">自休学社区地图</p>
        </div>
      </div>
    </div>
  )
}
