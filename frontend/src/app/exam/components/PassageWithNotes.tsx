"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Note {
  id: string;
  text: string;
  comment: string;
  color: string;
}

interface PassageWithNotesProps {
  title: string;
  topic?: string;
  passageType?: string;
  content: string;
}

// Màu sắc cho các note khác nhau
const NOTE_COLORS = [
  { bg: 'bg-yellow-400/30', border: 'border-yellow-500', hover: 'hover:bg-yellow-400/50', popup: 'bg-yellow-500' },
  { bg: 'bg-blue-400/30', border: 'border-blue-500', hover: 'hover:bg-blue-400/50', popup: 'bg-blue-500' },
  { bg: 'bg-green-400/30', border: 'border-green-500', hover: 'hover:bg-green-400/50', popup: 'bg-green-500' },
  { bg: 'bg-pink-400/30', border: 'border-pink-500', hover: 'hover:bg-pink-400/50', popup: 'bg-pink-500' },
  { bg: 'bg-purple-400/30', border: 'border-purple-500', hover: 'hover:bg-purple-400/50', popup: 'bg-purple-500' },
  { bg: 'bg-orange-400/30', border: 'border-orange-500', hover: 'hover:bg-orange-400/50', popup: 'bg-orange-500' },
  { bg: 'bg-cyan-400/30', border: 'border-cyan-500', hover: 'hover:bg-cyan-400/50', popup: 'bg-cyan-500' },
  { bg: 'bg-red-400/30', border: 'border-red-500', hover: 'hover:bg-red-400/50', popup: 'bg-red-500' },
];

export const PassageWithNotes: React.FC<PassageWithNotesProps> = ({ 
  title, 
  topic, 
  passageType, 
  content 
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const colorIndexRef = useRef(0);
  const notesRef = useRef<Note[]>([]); // Ref để luôn có giá trị mới nhất

  // Sync notes với notesRef
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Click outside để đóng popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        // Kiểm tra xem có click vào highlighted text không
        const target = e.target as HTMLElement;
        if (!target.hasAttribute('data-note-id')) {
          setActiveNote(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') {
      setShowTooltip(false);
      return;
    }

    const range = selection.getRangeAt(0);
    if (!containerRef.current?.contains(range.commonAncestorContainer)) {
      return;
    }

    const rect = range.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setShowTooltip(true);
  };

  const addNote = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const selectedText = selection.toString().trim();
    const noteId = Date.now().toString();
    
    // Chọn màu tiếp theo
    const color = NOTE_COLORS[colorIndexRef.current % NOTE_COLORS.length];
    colorIndexRef.current += 1;

    const newNote: Note = {
      id: noteId,
      text: selectedText,
      comment: '',
      color: JSON.stringify(color)
    };

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    // Thêm display: inline để không xuống hàng
    span.style.display = 'inline';
    span.className = `${color.bg} border-b-2 ${color.border} ${color.hover} cursor-pointer transition-all`;
    span.setAttribute('data-note-id', noteId);
    
    try {
      // Sử dụng phương pháp an toàn hơn cho cross-element selection
      // Extract nội dung từ range
      const contents = range.extractContents();
      
      // Append vào span
      span.appendChild(contents);
      
      // Insert span vào vị trí range
      range.insertNode(span);
      
      // Normalize để merge text nodes
      span.parentNode?.normalize();
      
      setNotes(prev => [...prev, newNote]);

      // Add click handler - sử dụng notesRef để luôn lấy data mới nhất
      span.onclick = (e) => {
        e.stopPropagation();
        const clickedNoteId = span.getAttribute('data-note-id');
        if (!clickedNoteId) return;
        
        const rect = span.getBoundingClientRect();
        setPopupPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        
        // Tìm note từ notesRef - luôn có giá trị mới nhất
        const currentNote = notesRef.current.find(n => n.id === clickedNoteId);
        setActiveNote(currentNote || newNote);
      };

    } catch (e) {
      console.error('Cannot highlight:', e);
      alert('Không thể highlight text này. Vui lòng thử lại với đoạn text khác.');
      return;
    }

    selection.removeAllRanges();
    setShowTooltip(false);
  };

  const updateNoteComment = (id: string, comment: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, comment } : n));
    if (activeNote?.id === id) {
      setActiveNote({ ...activeNote, comment });
    }
  };

  const deleteNote = (id: string) => {
    const span = containerRef.current?.querySelector(`[data-note-id="${id}"]`);
    if (span) {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent?.insertBefore(span.firstChild, span);
      }
      parent?.removeChild(span);
    }

    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) {
      setActiveNote(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar" ref={containerRef} onMouseUp={handleTextSelect}>
      <div className="max-w-4xl mx-auto p-12">
        <div className="prose prose-invert prose-lg max-w-none prose-p:text-justify prose-headings:text-center">
          <div className="flex items-center justify-between mb-8">
            {topic && (
              <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 tracking-widest uppercase border border-white/5">
                {topic}
              </span>
            )}
            
            <span className="font-serif italic text-gray-500 text-sm">
              Passage {passageType || "1"}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8 leading-tight text-center">
            {title}
          </h1>

          <div className="text-gray-300 font-serif leading-8 text-[1.1rem] space-y-6 select-text whitespace-pre-wrap text-justify">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Tooltip Add Note */}
      {showTooltip && (
        <div 
          className="fixed z-[9999] -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <button
            onClick={addNote}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-4 py-2 rounded-lg font-bold text-sm shadow-xl flex items-center gap-2 transition-all animate-in fade-in zoom-in duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Add Note
          </button>
        </div>
      )}

      {/* Popup khi click vào highlighted text */}
      {activeNote && (
        <div 
          ref={popupRef}
          className="fixed z-[9999] -translate-x-1/2 -translate-y-full"
          style={{ left: popupPos.x, top: popupPos.y }}
        >
          <div className={`${JSON.parse(activeNote.color).popup} text-white rounded-xl shadow-2xl p-3 w-72 animate-in fade-in zoom-in duration-200`}>
            {/* Arrow */}
            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 ${JSON.parse(activeNote.color).popup} rotate-45`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider">Note</span>
                </div>
                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/20 rounded"
                  title="Delete note"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <textarea
                value={activeNote.comment}
                onChange={(e) => updateNoteComment(activeNote.id, e.target.value)}
                placeholder="Type your note here..."
                className="w-full bg-black/30 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-white/40 resize-none"
                rows={4}
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
