import React, { useState } from 'react';
import { Lock, Send, ShieldAlert, User } from 'lucide-react';

export default function InternalNotes({ notes = [], onAddNote, currentAgent }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddNote(content.trim());
      setContent('');
    } catch (err) {
      console.error('Failed to post internal note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header Banner - Addresses INC-0304 */}
      <div className="flex items-center justify-between pb-3 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              Private Internal Notes
              <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-800">
                Staff Only
              </span>
            </h3>
            <p className="text-xs text-amber-700">
              Only visible to Arvo support agents. Never displayed or transmitted to the customer.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
          {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
        </span>
      </div>

      {/* Warning Notice */}
      <div className="flex items-start gap-2 bg-amber-100/70 p-2.5 rounded-lg text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <span>
          <strong>INC-0304 Safeguard:</strong> This channel is strictly isolated. Private notes are excluded from customer-facing API responses and client portals.
        </span>
      </div>

      {/* Notes Stream */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <div className="text-center py-6 text-xs text-amber-700 italic bg-amber-50 rounded-lg border border-dashed border-amber-200">
            No internal notes for this ticket yet. Notes added here will stay private to the team.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-amber-200/80 rounded-lg p-3 shadow-xs space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>{note.agent?.name || 'Support Agent'}</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    {note.agent?.role || 'AGENT'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(note.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                {note.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-amber-200">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Leave a private note for the team (Author: ${currentAgent?.name || 'Agent'})...`}
            rows={3}
            className="w-full text-xs bg-white border border-amber-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-amber-400/80 text-slate-800 resize-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-amber-700 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-600" />
            Saved to Arvo staff-only audit trail
          </span>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Posting...' : 'Post Internal Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
