import React from 'react';
import { Calendar as CalendarIcon, ShoppingCart, LogOut } from 'lucide-react';
import { mockDb } from '../services/mockDb';

interface LayoutProps {
  activeTab: 'calendar' | 'shopping';
  setActiveTab: (tab: 'calendar' | 'shopping') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, onLogout, children }) => {
  const handleLogout = async () => {
    await mockDb.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto shadow-2xl relative">
        <header className="bg-white px-4 py-3 border-b flex justify-between items-center sticky top-0 z-10">
            <h1 className="text-lg font-bold text-indigo-600 flex items-center gap-2">
                🥑 PlanifIA
            </h1>
            <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600">
                <LogOut size={20} />
            </button>
        </header>

        <main className="min-h-[calc(100vh-130px)]">
            {children}
        </main>

        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around py-3 pb-safe z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
                onClick={() => setActiveTab('calendar')}
                className={`flex flex-col items-center gap-1 w-1/2 ${activeTab === 'calendar' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <CalendarIcon size={24} strokeWidth={activeTab === 'calendar' ? 2.5 : 2} />
                <span className="text-xs font-medium">Calendario</span>
            </button>
            <button 
                onClick={() => setActiveTab('shopping')}
                className={`flex flex-col items-center gap-1 w-1/2 ${activeTab === 'shopping' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <div className="relative">
                    <ShoppingCart size={24} strokeWidth={activeTab === 'shopping' ? 2.5 : 2} />
                </div>
                <span className="text-xs font-medium">Compra</span>
            </button>
        </nav>
    </div>
  );
};

export default Layout;