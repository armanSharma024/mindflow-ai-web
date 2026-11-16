import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Maximize2, 
  FileText, 
  ListChecks, 
  Wand2, 
  Send,
  Loader2,
  Check,
  ChevronDown
} from 'lucide-react';
import { Note, ActionItem, ToneOption } from '../types';
import { api } from '../services/api';

interface NoteEditorProps {
  note: Note | null;
  onSave: (updated: Partial<Note>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose?: () => void;
  onOpenChatWithNote?: (note: Note) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onSave,
  onDelete,
  onOpenChatWithNote,
}) => {
  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
          <FileText className="w-8 h-8 stroke-1" />
        </div>
        <h3 className="font-bold text-slate-700 text-lg mb-1">No Note Selected</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Select a note from the left to view, edit, and run Generative AI intelligence tools, or create a new one.
        </p>
      </div>
    );
  }

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [category, setCategory] = useState(note.category);
  const [color, setColor] = useState(note.color);
  const [summary, setSummary] = useState(note.summary || '');
  const [actionItems, setActionItems] = useState<ActionItem[]>(note.action_items || []);
  const [newActionText, setNewActionText] = useState('');
  
  // AI loading indicators
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync state when active note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setColor(note.color);
    setSummary(note.summary || '');
    setActionItems(note.action_items || []);
    setSaveStatus(null);
  }, [note.id]);

  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        id: note.id,
        title,
        content,
        category,
        color,
        summary: summary || null,
        action_items: actionItems,
      });
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // AI Summarization
  const handleAiSummarize = async () => {
    if (!content.trim()) return;
    setIsSummarizing(true);
    try {
      const res = await api.ai.summarize(title, content);
      setSummary(res.summary);
      await onSave({ id: note.id, summary: res.summary });
    } catch (err: any) {
      alert(`AI Summarize failed: ${err.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  // AI Action Items
  const handleAiExtractActions = async () => {
    if (!content.trim()) return;
    setIsExtractingActions(true);
    try {
      const res = await api.ai.extractActionItems(content);
      const combined = [...actionItems, ...res.action_items];
      setActionItems(combined);
      await onSave({ id: note.id, action_items: combined });
    } catch (err: any) {
      alert(`AI Extraction failed: ${err.message}`);
    } finally {
      setIsExtractingActions(false);
    }
  };

  // AI Expand
  const handleAiExpand = async () => {
    if (!content.trim() && !title.trim()) return;
    setIsExpanding(true);
    try {
      const res = await api.ai.expand(title, content);
      const newContent = content ? `${content}\n\n---\n\n${res.expanded}` : res.expanded;
      setContent(newContent);
      await onSave({ id: note.id, content: newContent });
    } catch (err: any) {
      alert(`AI Expansion failed: ${err.message}`);
    } finally {
      setIsExpanding(false);
    }
  };

  // AI Tone Rewrite
  const handleAiRewrite = async (tone: ToneOption) => {
    if (!content.trim()) return;
    setIsRewriting(true);
    try {
      const res = await api.ai.rewrite(content, tone);
      setContent(res.rewritten);
      await onSave({ id: note.id, content: res.rewritten });
    } catch (err: any) {
      alert(`AI Rewrite failed: ${err.message}`);
    } finally {
      setIsRewriting(false);
    }
  };

  // Toggle action item
  const handleToggleAction = async (itemId: string) => {
    const updated = actionItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setActionItems(updated);
    await onSave({ id: note.id, action_items: updated });
  };

  // Add custom action item
  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim()) return;
    const newItem: ActionItem = {
      id: String(Date.now()),
      text: newActionText.trim(),
      completed: false,
    };
    const updated = [...actionItems, newItem];
    setActionItems(updated);
    setNewActionText('');
    await onSave({ id: note.id, action_items: updated });
  };

  // Delete action item
  const handleDeleteAction = async (itemId: string) => {
    const updated = actionItems.filter((i) => i.id !== itemId);
    setActionItems(updated);
    await onSave({ id: note.id, action_items: updated });
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top action header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="General">General</option>
            <option value="Work">Work</option>
            <option value="Ideas">Ideas</option>
            <option value="Study">Study</option>
            <option value="Personal">Personal</option>
          </select>

          {/* Color tag */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
            {['indigo', 'emerald', 'amber', 'rose', 'sky'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'opacity-70 hover:opacity-100'
                } ${
                  c === 'indigo'
                    ? 'bg-indigo-500'
                    : c === 'emerald'
                    ? 'bg-emerald-500'
                    : c === 'amber'
                    ? 'bg-amber-500'
                    : c === 'rose'
                    ? 'bg-rose-500'
                    : 'bg-sky-500'
                }`}
              />
            ))}
          </div>

          {onOpenChatWithNote && (
            <button
              onClick={() => onOpenChatWithNote(note)}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Chat with Note
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
          </button>
          <button
            onClick={() => onDelete(note.id)}
            title="Delete this note"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Superpowers Ribbon */}
      <div className="px-4 py-2 bg-gradient-to-r from-indigo-50/70 via-violet-50/50 to-sky-50/40 border-b border-indigo-100/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="font-bold text-indigo-900 flex items-center gap-1 shrink-0">
          <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
          AI Actions:
        </span>

        {/* Summarize */}
        <button
          onClick={handleAiSummarize}
          disabled={isSummarizing || !content.trim()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-indigo-700 font-medium border border-indigo-200/80 hover:bg-indigo-50/80 transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-500" />}
          Summarize
        </button>

        {/* Extract Tasks */}
        <button
          onClick={handleAiExtractActions}
          disabled={isExtractingActions || !content.trim()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-emerald-700 font-medium border border-emerald-200/80 hover:bg-emerald-50/80 transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isExtractingActions ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckSquare className="w-3 h-3 text-emerald-500" />}
          Extract Tasks
        </button>

        {/* Expand & Brainstorm */}
        <button
          onClick={handleAiExpand}
          disabled={isExpanding || (!content.trim() && !title.trim())}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-violet-700 font-medium border border-violet-200/80 hover:bg-violet-50/80 transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isExpanding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3 text-violet-500" />}
          Expand Idea
        </button>

        {/* Tone Rewriter */}
        <div className="relative inline-flex items-center shrink-0">
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAiRewrite(e.target.value as ToneOption);
                e.target.value = '';
              }
            }}
            disabled={isRewriting || !content.trim()}
            defaultValue=""
            className="text-xs px-2.5 py-1 rounded-lg bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition-all focus:outline-none cursor-pointer disabled:opacity-50"
          >
            <option value="" disabled>Rewrite Tone...</option>
            <option value="professional">Professional</option>
            <option value="concise">Concise & Sharp</option>
            <option value="bullet_points">Bullet Points</option>
            <option value="creative">Creative & Engaging</option>
            <option value="casual">Friendly & Casual</option>
          </select>
          {isRewriting && (
            <Loader2 className="w-3 h-3 animate-spin text-indigo-600 ml-1 absolute right-2 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title..."
          className="w-full text-2xl font-extrabold text-slate-900 border-none focus:outline-none placeholder:text-slate-300"
        />

        {/* AI Summary Box */}
        {summary && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/90 to-indigo-50/60 border border-violet-100 text-xs text-violet-950 relative group">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1.5 text-violet-800">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                AI Executive Summary
              </span>
              <button
                onClick={() => setSummary('')}
                className="text-violet-400 hover:text-violet-700 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Dismiss
              </button>
            </div>
            <div className="whitespace-pre-line leading-relaxed text-slate-700">
              {summary}
            </div>
          </div>
        )}

        {/* Content Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your thoughts, research, meeting minutes, or project specs here..."
          className="w-full min-h-[220px] text-sm text-slate-700 leading-relaxed border-none resize-none focus:outline-none placeholder:text-slate-400"
        />

        {/* Action Items / Todos Section */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              Action Items ({actionItems.filter((i) => i.completed).length}/{actionItems.length})
            </h4>
          </div>

          {/* Checklist items */}
          <div className="space-y-1.5 mb-3">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 group transition-all text-xs"
              >
                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleAction(item.id)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <span
                    className={`leading-tight ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
                <button
                  onClick={() => handleDeleteAction(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom action input */}
          <form onSubmit={handleAddAction} className="flex items-center gap-2">
            <input
              type="text"
              value={newActionText}
              onChange={(e) => setNewActionText(e.target.value)}
              placeholder="Add an action step..."
              className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!newActionText.trim()}
              className="p-1.5 text-white bg-slate-800 hover:bg-slate-900 rounded-xl disabled:opacity-40 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
