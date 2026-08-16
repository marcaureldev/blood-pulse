import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { WhyDonate } from '@/components/WhyDonate'
import { WhoCanDonate } from '@/components/WhoCanDonate'
import { EligibilitySimulator } from '@/components/EligibilitySimulator'
import { DonationProcess } from '@/components/DonationProcess'
import { Preparation } from '@/components/Preparation'
import { CentersDirectory } from '@/components/CentersDirectory'
import { BloodReserves } from '@/components/BloodReserves'
import { FAQ } from '@/components/FAQ'
import { FinalCta } from '@/components/FinalCta'
import { Footer } from '@/components/Footer'

function App() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main>
        <Hero />
        <WhyDonate />
        <WhoCanDonate />
        <EligibilitySimulator />
        <DonationProcess />
        <Preparation />
        <CentersDirectory />
        <BloodReserves />
        <FAQ />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

export default App