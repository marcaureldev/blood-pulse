import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { WhyDonate } from '@/components/WhyDonate'

function App() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main>
        <Hero />
        <WhyDonate />
      </main>
    </div>
  )
}

export default App