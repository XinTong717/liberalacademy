import { HomeHeader } from '@/components/home-header'

import MapWithAuth from '@/components/map-with-auth'

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fbf7ee]">
      <MapWithAuth />
      <HomeHeader />
    </div>
  )
}
