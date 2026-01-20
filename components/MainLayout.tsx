import Sidebar from './Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <div className="no-print-sidebar">
        <Sidebar />
      </div>
      <main className="flex-1 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  )
}

