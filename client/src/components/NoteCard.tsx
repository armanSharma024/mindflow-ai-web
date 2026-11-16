import React from 'react';
import { Pin, Trash2, CheckCircle2, Sparkles, Tag, Clock } from 'lucide-react';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onTogglePin: (id: number, e: React.MouseEvent) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  onSelect,
  onTogglePin,
  onDelete,
}) => {
  const completedActions = note.action_items.filter((a) => a.completed).length;
  const totalActions = note.action_items.length;

  const colorStyles: Record<string, { border: string; bg: string; badge: string }> = {
    indigo: { border: 'hover:border-indigo-300', bg: 'hover:bg-indigo-50/30', badge: 'bg-indigo-50 text-indigo-700' },
    emerald: { border: 'hover:border-emerald-300', bg: 'hover:bg-emerald-50/30', badge: 'bg-emerald-50 text-emerald-700' },
    amber: { border: 'hover:border-amber-300', bg: 'hover:bg-amber-50/30', badge: 'bg-amber-50 text-amber-700' },
    rose: { border: 'hover:border-rose-300', bg: 'hover:bg-rose-50/30', badge: 'bg-rose-50 text-rose-700' },
    sky: { border: 'hover:border-sky-300', bg: 'hover:bg-sky-50/30', badge: 'bg-sky-50 text-sky-700' },
  };

  const currentTheme = colorStyles[note.color] || colorStyles.indigo;

  return (
    <div
      onClick={() => onSelect(note)}
      className={`group relative p-4 rounded-2xl border transition-all duration-150 cursor-pointer text-left flex flex-col justify-between ${
        isSelected
          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
          : `bg-white border-slate-200/90 shadow-xs hover:shadow-md ${currentTheme.border}`
      }`}
    >
      <div>
        {/* Top meta row */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${currentTheme.badge}`}>
            {note.category}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => onTogglePin(note.id, e)}
              title={note.is_pinned ? 'Unpin note' : 'Pin note'}
              className={`p-1.5 rounded-lg transition-all ${
                note.is_pinned
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-60 group-hover:opacity-100'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-amber-500' : ''}`} />
            </button>
            <button
              onClick={(e) => onDelete(note.id, e)}
              title="Delete note"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1 line-clamp-2">
          {note.title || 'Untitled Note'}
        </h3>

        {/* Content snippet */}
        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
          {note.content || 'Empty note...'}
        </p>

        {/* AI Summary Badge if exists */}
        {note.summary && (
          <div className="mb-3 p-2 rounded-xl bg-violet-50/70 border border-violet-100 text-[11px] text-violet-900 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-tight">
              {note.summary}
            </p>
          </div>
        )}

        {/* Action Items status bar */}
        {totalActions > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Tasks
              </span>
              <span>
                {completedActions}/{totalActions}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(completedActions / totalActions) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer / tags & date */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1 truncate max-w-[150px]">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 2).map((t, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                #{t}
              </span>
            ))
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(note.updated_at || note.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
