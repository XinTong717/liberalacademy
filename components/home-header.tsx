import Image from 'next/image'
import Link from 'next/link'
import { HomeAuthButtons } from './home-auth-buttons'

export function HomeHeader() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#fbf7ee]/80 via-[#fdfbf5]/30 to-transparent" />
      <div className="absolute inset-x-4 top-4 z-10 flex flex-col gap-2 sm:inset-x-6 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        {/* Title overlay */}
        <div className="flex items-center gap-2 rounded-2xl border border-[#efdcc4] bg-white/90 px-3 py-2 shadow-lg backdrop-blur sm:gap-4 sm:px-4 sm:py-3">
          <Image
            src="/brand/liberal-academy-logo.png"
            alt="自由学社标志"
            width={56}
            height={56}
            className="h-10 w-10 rounded-full border border-[#f0e3cf] bg-white sm:h-14 sm:w-14"
            priority
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-[#46688f] sm:text-2xl">自由学社</h1>
            <p className="text-xs font-medium text-[#5f83ad] sm:text-sm">自休学社区地图</p>
          </div>
        </div>

        {/* Navigation overlay */}
        <div className="flex flex-wrap gap-2 sm:justify-end sm:gap-3">
          <HomeAuthButtons />
          <Link
            href="/communities"
            className="rounded-full bg-[#e8f3f6]/95 px-4 py-2 text-xs font-semibold text-[#3f7d84] shadow-md ring-1 ring-[#b9dfd7] transition-colors hover:bg-[#f0fafb] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            社群
          </Link>
        </div>
      </div>
    </>
  )
}
