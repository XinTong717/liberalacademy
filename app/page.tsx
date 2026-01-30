import Map from '@/components/map'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative w-full h-screen">
      <Map />
      {/* Navigation overlay */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Link
          href="/login"
          className="px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          登录
        </Link>
        <Link
          href="/communities"
          className="px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          社群
        </Link>
      </div>
      {/* Title overlay */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">
          自由学社
        </h1>
        <p className="text-sm text-white/90 drop-shadow-md">
          在家教育社区地图
        </p>
      </div>
    </div>
  )
}
