import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Footer from './Footer'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#EDE8DF' }}>
      <Header />
      <div className="flex-1 pb-20 lg:pb-0 lg:pl-60">
        <main className="max-w-lg lg:max-w-4xl mx-auto px-4 lg:px-10 py-5 lg:py-8">
          {children}
        </main>
      </div>
      <Footer />
      <Sidebar />
      <BottomNav />
    </div>
  )
}
