import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { v4 as uuidv4 } from 'uuid';

interface Note {
  id: string;
  quote: string;
  comment: string;
  top: number;
}

interface PassageViewerProps {
  content: string;
}

// 1. Memoized Content Component to prevent re-renders wiping out DOM selections/modifications
const PassageContent = React.memo(({ content }: { content: string }) => {
    return (
        <div className="text-gray-300 font-serif leading-8 text-[1.1rem] space-y-6 select-text whitespace-pre-wrap text-justify prose-p:mb-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}, (prev, next) => prev.content === next.content);

PassageContent.displayName = 'PassageContent';

export const PassageViewer: React.FC<PassageViewerProps> = ({ content }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddNoteBtn, setShowAddNoteBtn] = useState(false);
  const [btnPosition, setBtnPosition] = useState({ top: 0, left: 0 });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // We utilize the native 'selectionchange' event for better reliability
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setShowAddNoteBtn(false);
        return;
      }

      // Check if selection interacts with our content
      if (contentRef.current && !contentRef.current.contains(selection.anchorNode)) {
        return; 
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = contentRef.current?.getBoundingClientRect();

      // Ensure we have a valid DOM rect
      if (rect.width > 0 && rect.height > 0 && containerRect) {
         // Calculate position relative to viewport first, then adjust
         // Actually, using 'fixed' position for the button is often safer to avoid parent overflow clipping
         // But absolute relative to container is fine if container is relative.
         
         const clientTop = rect.top;
         const clientLeft = rect.left + (rect.width / 2);

         const relativeTop = clientTop - containerRect.top + contentRef.current!.scrollTop - 45; // 45px above
         const relativeLeft = clientLeft - containerRect.left - 40; // Center button (approx width 80px)

         setBtnPosition({ top: relativeTop, left: relativeLeft });
         setShowAddNoteBtn(true);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    // Also listen to scroll to update position or hide
    const handleScroll = () => {
       if (showAddNoteBtn) setShowAddNoteBtn(false);
    };
    contentRef.current?.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      contentRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, [showAddNoteBtn]);


  // Add Highlight & Note
  const addHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range) return;

    try {
        // 1. Create a span to wrap the text
        const span = document.createElement("span");
        span.className = "bg-yellow-500/30 border-b-2 border-yellow-500 cursor-pointer hover:bg-yellow-500/50 transition-colors";
        const noteId = uuidv4();
        span.dataset.noteId = noteId;
        
        // 2. Extract content and append to span
        // surroundContents is stricter; extractContents is safer for partial overlap but might split tags
        // For simplicity in this controlled MD environment, surroundContents is preferred if possible.
        // Fallback: extract if surround fails? No, extract removes from DOM. 
        
        // We will try surroundContents. If it fails (cross-block), we use a recursive wrapper or alert.
        range.surroundContents(span);
        
        // 3. Clear Selection UI
        selection.removeAllRanges();
        setShowAddNoteBtn(false);

        // 4. Calculate sidebar position
        const containerRect = contentRef.current!.getBoundingClientRect();
        const spanRect = span.getBoundingClientRect();
        const relativeTop = spanRect.top - containerRect.top + contentRef.current!.scrollTop;

        // 5. Add to state
        const newNote: Note = {
            id: noteId,
            quote: span.innerText,
            comment: "",
            top: relativeTop
        };

        setNotes(prev => [...prev, newNote]);
        setActiveNoteId(noteId); // Focus new note

    } catch (e) {
        console.warn("Highlight failed:", e);
        // Fallback for cross-block selection (simplified)
        alert("Please select text within a single paragraph.");
        setShowAddNoteBtn(false);
    }
  };

  const updateNote = (id: string, text: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, comment: text } : n));
  };

  const deleteNote = (id: string) => {
    // Remove highlight from DOM
    const span = contentRef.current?.querySelector(`span[data-note-id="${id}"]`);
    if (span) {
        // Unwrap logic: insert children before span, remove span
        const parent = span.parentNode;
        while (span.firstChild) {
            parent?.insertBefore(span.firstChild, span);
        }
        parent?.removeChild(span);
        parent?.normalize(); // Merge text nodes
    }
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  return (
    <div className="relative flex h-full">
      {/* 1. Main Content Area */}
      <div 
        ref={contentRef}
        className="flex-1 pr-6 relative overflow-y-auto custom-scrollbar"
        id="passage-container"
      >
        <PassageContent content={content} />

        {/* Floating Add Button */}
        {showAddNoteBtn && (
            <div 
                 style={{ top: btnPosition.top, left: btnPosition.left }}
                 className="absolute z-[9999]"
            >
                <button 
                    onMouseDown={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation();
                        addHighlight(); 
                    }}
                    className="bg-gray-900 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-2xl border border-white/20 hover:scale-105 hover:bg-black transition-all flex items-center gap-2 animate-in fade-in zoom-in duration-200 cursor-pointer"
                >
                    <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-black">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </span>
                    Add Note
                </button>
            </div>
        )}
      </div>

      {/* 2. Sidebar */}
      <div className="w-[300px] flex-shrink-0 border-l border-white/5 bg-[#0c0c0e] relative hidden xl:block overflow-y-auto custom-scrollbar">
         <div className="p-4 space-y-4 min-h-full pb-20">
             {notes.length === 0 && (
                <div className="text-center text-gray-500 mt-20 text-sm italic select-none">
                    <p className="mb-2">No notes yet.</p>
                    <p className="text-xs opacity-60">Highlight text to add a note.</p>
                </div>
             )}
             {notes.map((note) => (
                 <div 
                    key={note.id}
                    className={`bg-[#1c1c1f] border rounded-xl p-3 shadow-lg transition-all
                        ${activeNoteId === note.id ? 'border-yellow-500/50 shadow-yellow-500/10' : 'border-white/10 hover:border-white/20'}
                    `}
                    onClick={() => setActiveNoteId(note.id)}
                 >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Note</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-gray-600 hover:text-red-400 p-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="mb-3 pl-2 border-l-2 border-yellow-500/30 text-[11px] text-gray-400 italic bg-black/20 py-1 rounded-r line-clamp-3">
                        "{note.quote}"
                    </div>

                    <textarea 
                        value={note.comment}
                        onChange={(e) => updateNote(note.id, e.target.value)}
                        placeholder="Start typing..."
                        className="w-full bg-black/30 border border-white/5 rounded-lg p-2 text-sm text-gray-200 focus:outline-none focus:border-yellow-500/50 resize-none h-24 placeholder-gray-600"
                        autoFocus={activeNoteId === note.id}
                    />
                 </div>
             ))}
         </div>
      </div>
    </div>
  );
};
