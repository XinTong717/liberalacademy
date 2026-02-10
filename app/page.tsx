import dynamic from 'next/dynamic'
import { HomeHeader } from '@/components/home-header'

const MapWithAuth = dynamic(() => import('../components/map-with-auth'), {
  ssr: false,
})

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fbf7ee]">
      <MapWithAuth />
      <HomeHeader />
    </div>
  )
}
