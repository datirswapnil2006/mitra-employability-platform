import React, { useState, useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Quote,
  Image as ImageIcon,
  Calculator,
  Eye,
  Edit3,
  HelpCircle
} from 'lucide-react';

export const RichNoteEditor = ({
  value = '',
  onChange,
  placeholder = 'Write training notes, concepts, formulas, and explanations here...'
}) => {
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const textareaRef = useRef(null);

  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousValue = textarea.value || '';
    const selectedText = previousValue.substring(start, end) || 'text';

    const newValue =
      previousValue.substring(0, start) +
      before +
      selectedText +
      after +
      previousValue.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const insertMath = (formulaSnippet) => {
    insertText(formulaSnippet, '');
  };

  // Simple and safe formatter for markdown/rich text preview
  const renderFormattedNote = (text) => {
    if (!text) return <p className="text-slate-400 italic">Nothing to preview yet.</p>;

    const lines = text.split('\n');
    const elements = [];
    let inList = false;
    let listType = null;
    let listItems = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        if (listType === 'ol') {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-3 text-slate-800 text-sm pl-2">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1.5 my-3 text-slate-800 text-sm pl-2">
              {listItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
              ))}
            </ul>
          );
        }
        listItems = [];
        inList = false;
        listType = null;
      }
    };

    const parseInline = (str) => {
      const parts = [];
      let lastIdx = 0;
      const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$|!\[([^\]]*)\]\(([^)]+)\))/g;
      let match;

      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIdx) {
          parts.push(str.substring(lastIdx, match.index));
        }
        const m = match[0];
        if (m.startsWith('**') && m.endsWith('**')) {
          parts.push(<strong key={match.index} className="font-bold text-slate-900">{m.slice(2, -2)}</strong>);
        } else if (m.startsWith('*') && m.endsWith('*')) {
          parts.push(<em key={match.index} className="italic text-slate-800">{m.slice(1, -1)}</em>);
        } else if (m.startsWith('`') && m.endsWith('`')) {
          parts.push(
            <code key={match.index} className="px-1.5 py-0.5 bg-slate-100 text-rose-600 rounded text-xs font-mono border border-slate-200">
              {m.slice(1, -1)}
            </code>
          );
        } else if (m.startsWith('$') && m.endsWith('$')) {
          parts.push(
            <span key={match.index} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 font-mono font-semibold rounded text-xs border border-emerald-200">
              {m.slice(1, -1)}
            </span>
          );
        } else if (m.startsWith('![')) {
          const alt = match[2];
          const src = match[3];
          parts.push(
            <img key={match.index} src={src} alt={alt || 'Note Image'} className="max-w-full rounded-xl my-2 border border-slate-200 shadow-xs" />
          );
        }
        lastIdx = match.index + m.length;
      }

      if (lastIdx < str.length) {
        parts.push(str.substring(lastIdx));
      }
      return parts.length > 0 ? parts : str;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={i} className="text-xl font-black text-slate-900 mt-5 mb-2 pb-1 border-b border-slate-200">
            {parseInline(line.substring(2))}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">
            {parseInline(line.substring(3))}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={i} className="text-base font-bold text-slate-800 mt-3 mb-1.5">
            {parseInline(line.substring(4))}
          </h3>
        );
      } else if (line.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={i} className="p-3 my-2 border-l-4 border-emerald-500 bg-emerald-50/50 rounded-r-xl text-xs text-slate-700 italic">
            {parseInline(line.substring(2))}
          </blockquote>
        );
      } else if (/^[-*]\s+/.test(line)) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(line.replace(/^[-*]\s+/, ''));
      } else if (/^\d+\.\s+/.test(line)) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(line.replace(/^\d+\.\s+/, ''));
      } else if (line.trim() === '') {
        flushList();
        elements.push(<div key={i} className="h-2" />);
      } else {
        flushList();
        elements.push(
          <p key={i} className="text-sm text-slate-700 leading-relaxed my-1">
            {parseInline(line)}
          </p>
        );
      }
    }
    flushList();
    return elements;
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
      {/* Editor Header Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        {/* Formatting Actions */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => insertText('# ')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition text-xs font-bold"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('## ')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition text-xs font-bold"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('### ')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition text-xs font-bold"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => insertText('**', '**')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={() => insertText('- ')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('1. ')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('> ')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
            title="Quote / Important Note"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('`', '`')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
            title="Code / Keyword"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          {/* Quick Math Notations */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => insertMath('$Percentage = \\frac{Value}{Total} \\times 100$%')}
              className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 rounded-lg transition flex items-center gap-1"
              title="Insert Formula Box"
            >
              <Calculator className="w-3 h-3" /> Formula
            </button>
            <button
              type="button"
              onClick={() => insertText('![Image Caption](https://example.com/image.png)')}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Write / Preview Tab Switch */}
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
              activeTab === 'write'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
      </div>

      {/* Editor Content Body */}
      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={12}
          className="w-full p-4 text-xs sm:text-sm font-mono text-slate-800 placeholder-slate-400 bg-white focus:outline-none resize-y leading-relaxed"
        />
      ) : (
        <div className="p-5 min-h-[300px] max-h-[500px] overflow-y-auto bg-slate-50/50">
          {renderFormattedNote(value)}
        </div>
      )}

      {/* Bottom helper tip */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          Tip: Wrap formulas with <code className="text-emerald-700 font-bold font-mono">$...$</code>, headings with <code className="font-bold">#</code>, bullets with <code className="font-bold">-</code>.
        </span>
        <span className="font-mono">{value ? value.length : 0} characters</span>
      </div>
    </div>
  );
};

export default RichNoteEditor;
