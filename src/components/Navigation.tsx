import React from 'react';
import type { ViewMode } from '../types';
import { getFullVersionString, APP_AUTHOR } from '../utils/version';
import { 
  LayoutDashboard, 
  FilePlus, 
  FolderArchive, 
  Settings as SettingsIcon,
  Receipt,
  FileText
} from 'lucide-react';

interface NavigationProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  receiptCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  receiptCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ViewMode,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'new-receipt' as ViewMode,
      label: 'Nuova Ritenuta',
      icon: FilePlus,
      highlight: true,
    },
    {
      id: 'archive' as ViewMode,
      label: 'Archivio',
      icon: FolderArchive,
      badge: receiptCount > 0 ? receiptCount : undefined,
    },
    {
      id: 'settings' as ViewMode,
      label: 'Impostazioni',
      icon: SettingsIcon,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen sticky top-0 h-screen select-none z-20">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
            <Receipt size={24} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight">WebRitenuta</h1>
            <p className="text-xs text-slate-500 font-medium">Gestione Ritenute d'Acconto</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (currentView === 'edit-receipt' && item.id === 'new-receipt') || (currentView === 'preview' && item.id === 'new-receipt');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <FileText size={15} className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Versione {getFullVersionString()}</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
              FC
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Autore</p>
              <p className="text-xs font-bold text-slate-800 truncate leading-tight mt-0.5">{APP_AUTHOR}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Receipt size={20} className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-base">WebRitenuta</span>
        </div>
        <button
          onClick={() => onNavigate('new-receipt')}
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
        >
          <FilePlus size={16} className="w-4 h-4" />
          <span>Nuova</span>
        </button>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (currentView === 'edit-receipt' && item.id === 'new-receipt') || (currentView === 'preview' && item.id === 'new-receipt');
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={20} className={`w-5 h-5 mb-1 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
