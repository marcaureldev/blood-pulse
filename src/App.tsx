import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { WhyDonate } from '@/components/WhyDonate'
import { WhoCanDonate } from '@/components/WhoCanDonate'
import { DonationProcess } from '@/components/DonationProcess'
import { Preparation } from '@/components/Preparation'

function App() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main>
        <Hero />
        <WhyDonate />
        <WhoCanDonate />
        <DonationProcess />
        <Preparation />
      </main>
    </div>
  )
}

export default App