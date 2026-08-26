import React from 'react';
import Modal from './Modal';
import Badge from './Badge';
import Button from './Button';
import { FileText, Download, ExternalLink, Clock, AlertCircle } from 'lucide-react';

export const NoteReaderModal = ({ note, isOpen, onClose }) => {
  if (!note) return null;

  const pdfUrl = note.pdfUrl || note.resourceUrl || '';

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = note.fileName || `${note.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenExternal = () => {
    if (!pdfUrl) return;
    if (pdfUrl.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      }
    } else {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-600" />
          <span className="truncate">{note.title}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Header Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              PDF Document
            </span>
            {note.fileSize && (
              <span className="font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                {note.fileSize}
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              {note.topic || 'Topic'}
            </span>
            {note.difficulty && (
              <Badge variant={note.difficulty === 'Advanced' ? 'danger' : note.difficulty === 'Intermediate' ? 'warning' : 'success'}>
                {note.difficulty}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={ExternalLink}
              onClick={handleOpenExternal}
            >
              Open in Tab
            </Button>
          </div>
        </div>

        {/* Note Description if present */}
        {note.description && (
          <p className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100 leading-relaxed">
            {note.description}
          </p>
        )}

        {/* Embedded PDF Viewer */}
        <div className="w-full h-[65vh] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner flex flex-col">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0`}
              title={note.title}
              className="w-full h-full border-0 rounded-2xl"
            />
          ) : (
            <div className="m-auto text-center p-6 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">PDF file preview is not available.</p>
              <Button size="sm" variant="outline" onClick={handleOpenExternal}>
                Try Opening File
              </Button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            PDF study notes for {note.topic || 'Aptitude'} (Max 5MB)
          </span>
          <span>MITRA Employability Training</span>
        </div>
      </div>
    </Modal>
  );
};

export default NoteReaderModal;
