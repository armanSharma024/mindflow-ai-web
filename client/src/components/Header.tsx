import React from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  Key, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react';
import { User, AIStatus } from '../types';

interface HeaderProps {
  user: User | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNewNote: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  aiStatus: AIStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  searchQuery,
  setSearchQuery,
  onNewNote,
  onOpenSettings,
  onLogout,
  aiStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                MindFlow<span className="text-indigo-600 font-bold">.ai</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium hidden md:block">
              AI-Powered Full-Stack Knowledge Studio
            </p>
          </div>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-md relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search notes, tags, or AI summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* New Note Button */}
          <button
            onClick={onNewNote}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
          </button>

          {/* Settings / API Key */}
          <button
            onClick={onOpenSettings}
            title="AI Settings & Gemini Key"
            className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer relative"
          >
            <Key className="w-4 h-4 text-amber-600" />
            {aiStatus?.configured && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-600 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search input */}
      <div className="px-4 pb-2 sm:hidden">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
          />
        </div>
      </div>
    </header>
  );
};
