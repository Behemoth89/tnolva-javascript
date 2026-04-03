import { Navbar } from '../../../components/Navbar';

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <div className="flex">
        <aside className="w-64 bg-zinc-900 min-h-[calc(100vh-64px)] border-r border-zinc-800">
          {/* Reserved for Phase 4 sidebar */}
        </aside>
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-zinc-100 mb-4">Dashboard</h1>
          <p className="text-zinc-400">Task management coming in Phase 3.</p>
        </main>
      </div>
    </div>
  );
}
