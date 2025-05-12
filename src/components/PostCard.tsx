
import React from 'react';
import { PostData, ViewMode } from '@/types';
import MediaErrorPlaceholder from './MediaErrorPlaceholder';

interface PostCardProps {
  postData: PostData;
  viewMode: ViewMode;
  index: number;
  onPostClick: (index: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  postData, 
  viewMode, 
  index, 
  onPostClick 
}) => {
  const { targetPostData, replacementMedia } = postData;
  const title = targetPostData.title 
    ? String(targetPostData.title).replace(/</g, "&lt;").replace(/>/g, "&gt;") 
    : "Untitled";

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't trigger modal when clicking external links
    if ((e.target as HTMLElement).closest('a[target="_blank"]')) return;
    
    // Don't trigger modal when clicking video controls
    if ((e.target as HTMLElement).closest('video')) {
      const videoElem = (e.target as HTMLElement).closest('video');
      const rect = videoElem?.getBoundingClientRect();
      if (rect) {
        const videoControlsHeight = 30;
        if (e.clientY > rect.bottom - videoControlsHeight) {
          return;
        }
      }
    }
    
    if (replacementMedia) {
      onPostClick(index);
    }
  };

  const renderMedia = () => {
    if (!replacementMedia || !replacementMedia.url) {
      return (
        <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-gray-400 p-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 mb-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <span className="text-xs">No replacement media</span>
        </div>
      );
    }

    if (replacementMedia.type === 'image') {
      return (
        <>
          <img 
            src={replacementMedia.url} 
            alt="Gaslit Media" 
            loading="lazy" 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.parentElement?.querySelector('.media-error-placeholder') as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
          <MediaErrorPlaceholder subreddit={replacementMedia.originalPost?.subreddit} />
        </>
      );
    } else if (replacementMedia.type === 'video') {
      return (
        <>
          <video 
            src={replacementMedia.url} 
            controls 
            muted 
            loop 
            playsInline 
            preload="metadata"
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              const placeholder = target.parentElement?.querySelector('.media-error-placeholder') as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
          <MediaErrorPlaceholder subreddit={replacementMedia.originalPost?.subreddit} />
        </>
      );
    }
    
    return null;
  };

  if (viewMode === 'list') {
    return (
      <div className="card-content flex flex-col" onClick={handlePostClick}>
        <div className="list-view-media-container">
          {renderMedia()}
        </div>
        <div className="p-3 flex flex-col flex-grow">
          <h3 
            className="card-title-text text-base mb-1.5 leading-tight" 
            title={title}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="card-secondary-text mb-2">
            <span>u/{targetPostData.author}</span> in r/{targetPostData.subreddit} &bull; {targetPostData.score} pts
          </p>
          <div className="mt-auto pt-1.5">
            <a 
              href={`https://www.reddit.com${targetPostData.permalink}`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="card-link-text card-link-hover hover:underline"
            >
              Comments &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="gallery-item" onClick={handlePostClick}>
        <div className="media-container">
          {renderMedia()}
        </div>
        <div 
          className="gallery-item-title" 
          title={title}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
    );
  }
};

export default PostCard;
