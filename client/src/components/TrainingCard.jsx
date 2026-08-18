import React from 'react';
import Badge from './Badge';
import Button from './Button';
import { Play, CheckCircle, ExternalLink, FileText, Code } from 'lucide-react';

export const TrainingCard = ({
  content,
  isCompleted = false,
  onWatch,
  onMarkComplete,
  loading = false
}) => {
  const { title, description, thumbnailUrl, technology, difficulty, resourceType, required } = content;

  const defaultThumb = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';

  const getTypeIcon = () => {
    switch (resourceType) {
      case 'video': return Play;
      case 'pdf': return FileText;
      case 'code': return Code;
      default: return ExternalLink;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full group border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
      {/* Thumbnail Header */}
      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
        <img
          src={thumbnailUrl || defaultThumb}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.src = defaultThumb; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="primary">{technology || 'General'}</Badge>
          <Badge variant={difficulty === 'Advanced' ? 'danger' : difficulty === 'Intermediate' ? 'warning' : 'success'}>
            {difficulty || 'Beginner'}
          </Badge>
        </div>

        {isCompleted && (
          <div className="absolute top-3 right-3 bg-emerald-600 text-white p-1.5 rounded-full shadow-md">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {title}
          </h4>
          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {description || 'Learn core concepts and practical implementation.'}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            size="sm"
            variant="outline"
            icon={TypeIcon}
            onClick={() => onWatch(content.resourceUrl)}
          >
            {resourceType === 'video' ? 'Watch Lecture' : 'Open Resource'}
          </Button>

          {!isCompleted ? (
            <Button
              size="sm"
              variant="success"
              loading={loading}
              onClick={() => onMarkComplete(content._id)}
            >
              Mark Complete
            </Button>
          ) : (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              ✓ Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingCard;
