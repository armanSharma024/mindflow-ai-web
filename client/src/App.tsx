import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Filter, 
  Tag, 
  Clock, 
  Pin, 
  Layers, 
  Plus, 
  BookOpen, 
  TrendingUp, 
  Loader2 
} from 'lucide-react';
import { Note, User, AIStatus } from './types';
import { api, getAuthToken, removeAuthToken } from './services/api';
import { Header } from './components/Header';
import { NoteCard } from './components/NoteCard';
import { NoteEditor } from './components/NoteEditor';
import { AiAssistant } from './components/AiAssistant';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals & Panels
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Stats & Status
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Check initial authentication
  useEffect(() => {
    const initApp = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthOpen(true);
        setInitialLoading(false);
        return;
      }

      try {
        const { user } = await api.auth.me();
        setUser(user);
        await loadNotes();
      } catch (err) {
        removeAuthToken();
        setIsAuthOpen(true);
      } finally {
        setInitialLoading(false);
      }
    };

    initApp();
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    try {
      const status = await api.ai.getStatus();
      setAiStatus(status);
    } catch (err) {
      console.warn('Failed to fetch AI status:', err);
    }
  };

  const loadNotes = async (category = selectedCategory, search = searchQuery) => {
    setIsLoadingNotes(true);
    try {
      const { notes } = await api.notes.getAll({
        category: category !== 'All' ? category : undefined,
        search: search.trim() ? search.trim() : undefined,
      });
      setNotes(notes);

      // Select first note if active note is missing or deleted
      if (notes.length > 0) {
        if (!activeNote || !notes.some((n) => n.id === activeNote.id)) {
          setActiveNote(notes[0]);
        } else {
          const fresh = notes.find((n) => n.id === activeNote.id);
          if (fresh) setActiveNote(fresh);
        }
      } else {
        setActiveNote(null);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Re-fetch notes when search or category filter updates
  useEffect(() => {
    if (user) {
      const debounceTimer = setTimeout(() => {
        loadNotes(selectedCategory, searchQuery);
      }, 200);
      return () => clearTimeout(debounceTimer);
    }
  }, [selectedCategory, searchQuery, user]);

  const handleAuthSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsAuthOpen(false);
    await loadNotes();
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setNotes([]);
    setActiveNote(null);
    setIsAuthOpen(true);
  };

  const handleCreateNewNote = async () => {
    try {
      const { note } = await api.notes.create({
        title: 'Untitled Thought',
        content: '',
        category: selectedCategory !== 'All' ? selectedCategory : 'General',
        color: 'indigo',
        is_pinned: false,
        tags: [],
        action_items: [],
      });
      setNotes((prev) => [note, ...prev]);
      setActiveNote(note);
    } catch (err: any) {
      alert(`Failed to create note: ${err.message}`);
    }
  };

  const handleSaveNote = async (updatedFields: Partial<Note>) => {
    if (!activeNote) return;
    try {
      const { note } = await api.notes.update(activeNote.id, updatedFields);
      setActiveNote(note);
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)));
    } catch (err: any) {
      console.error('Failed to update note:', err);
      throw err;
    }
  };

  const handleDeleteNote = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.notes.delete(id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (activeNote?.id === id) {
        setActiveNote(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      alert(`Failed to delete note: ${err.message}`);
    }
  };

  const handleTogglePin = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { is_pinned } = await api.notes.togglePin(id);
      setNotes((prev) =>
        prev
          .map((n) => (n.id === id ? { ...n, is_pinned } : n))
          .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
      );
      if (activeNote?.id === id) {
        setActiveNote((prev) => (prev ? { ...prev, is_pinned } : null));
      }
    } catch (err: any) {
      alert(`Failed to pin note: ${err.message}`);
    }
  };

  const categories = ['All', 'Work', 'Ideas', 'Study', 'Personal', 'General'];

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
            Loading MindFlow AI...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-800">
      {/* Top Application Header */}
      <Header
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onNewNote={handleCreateNewNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        aiStatus={aiStatus}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Categories Pill Navigation */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>
              <strong>{notes.length}</strong> {notes.length === 1 ? 'note' : 'notes'}
            </span>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 font-semibold border border-violet-100 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Chat Assistant</span>
            </button>
          </div>
        </div>

        {/* Dual Pane Layout: Notes Grid + Note Editor */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left Column: Note Cards (4 cols on large screens) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3">
            {isLoadingNotes ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span className="text-xs">Loading your notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 stroke-1" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">No notes found</h4>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                  {searchQuery
                    ? `No notes match "${searchQuery}". Try clearing your search.`
                    : 'Create your first note to capture ideas and let Gemini analyze them.'}
                </p>
                <button
                  onClick={handleCreateNewNote}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Create Note
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isSelected={activeNote?.id === note.id}
                    onSelect={(n) => setActiveNote(n)}
                    onTogglePin={handleTogglePin}
                    onDelete={(id, e) => handleDeleteNote(id, e)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Active Note Editor (7 or 8 cols on large screens) */}
          <div className="lg:col-span-7 xl:col-span-8 h-[650px] lg:h-[780px]">
            <NoteEditor
              note={activeNote}
              onSave={handleSaveNote}
              onDelete={(id) => handleDeleteNote(id)}
              onOpenChatWithNote={() => setIsChatOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Floating AI Chat button on mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden z-30">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg flex items-center justify-center"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* Modals & Panels */}
      <AiAssistant
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeNote={activeNote}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onSuccess={handleAuthSuccess}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiStatus={aiStatus}
        onKeyUpdated={checkAiStatus}
      />
    </div>
  );
};

export default App;
