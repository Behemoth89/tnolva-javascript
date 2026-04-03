import { useState } from 'react';
import { Navbar } from '../../../components/Navbar';
import { CategoryManager } from '../components/CategoryManager';
import { PriorityManager } from '../components/PriorityManager';

type Tab = 'categories' | 'priorities';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6">Settings</h1>

        {/* Tab navigation */}
        <div className="flex gap-4 mb-6 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('priorities')}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === 'priorities'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Priorities
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'categories' ? <CategoryManager /> : <PriorityManager />}
      </main>
    </div>
  );
}
