import { Sidebar } from './sidebar'
import { Header } from './header'
import { Toaster } from './toaster'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8 h-full">
              <div className="animate-fade-in">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      <Toaster />
    </div>
  )
}