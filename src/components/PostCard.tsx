import React from 'react';
import { PostData, ViewMode } from '@/types';
import MediaErrorPlaceholder from './MediaErrorPlaceholder';
import { cn } from '@/lib/utils';
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
  const {
    targetPostData,
    replacementMedia
  } = postData;
  const title = targetPostData.title ? String(targetPostData.title).replace(/</g, "&lt;").replace(/>/g, "&gt;") : "Untitled";
  const handlePostClick = (e: React.MouseEvent) => {
    // Don't trigger modal when clicking external links
    if ((e.target as HTMLElement).closest('a[target="_blank"]')) return;

    // Don't trigger modal when clicking video controls
    if ((e.target as HTMLElement).closest('video')) {
      const videoElem = (e.target as HTMLElement).closest('video');
      const rect = videoElem?.getBoundingClientRect();
      if (rect) {
        const videoControlsHeight = 40; // Increased for better touch area
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
      return <div className="w-full h-full bg-[#111111] flex flex-col items-center justify-center text-gray-400 p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm opacity-80">No media available</span>
        </div>;
    }
    if (replacementMedia.type === 'image') {
      return <>
          <img src={replacementMedia.url} alt="Gaslit Media" loading="lazy" onError={e => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const placeholder = target.parentElement?.querySelector('.media-error-placeholder') as HTMLElement;
          if (placeholder) placeholder.style.display = 'flex';
        }} />
          <MediaErrorPlaceholder subreddit={replacementMedia.originalPost?.subreddit} />
        </>;
    } else if (replacementMedia.type === 'video') {
      return <>
          <video src={replacementMedia.url} controls muted loop playsInline preload="metadata" onError={e => {
          const target = e.target as HTMLVideoElement;
          target.style.display = 'none';
          const placeholder = target.parentElement?.querySelector('.media-error-placeholder') as HTMLElement;
          if (placeholder) placeholder.style.display = 'flex';
        }} />
          <MediaErrorPlaceholder subreddit={replacementMedia.originalPost?.subreddit} />
        </>;
    }
    return null;
  };
  if (viewMode === 'list') {
    return <div className="card-content flex flex-col h-full" onClick={handlePostClick}>
        <div className="list-view-media-container relative">
          {renderMedia()}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 pointer-events-none" />
          </div>
        </div>
        <div className="p-4 flex flex-col flex-grow bg-gradient-to-b from-[#1A1A1A] to-[#222222]">
          <h3 className="text-white text-xl font-bold leading-tight mb-2 line-clamp-2" title={title} dangerouslySetInnerHTML={{
          __html: title
        }} />
          <p className={cn("mb-3 flex items-center gap-1 text-sm", "text-gray-300")}>
            <span className="font-semibold">u/{targetPostData.author}</span> 
            <span className="inline-block mx-1">•</span> 
            <span className="text-blue-400">r/{targetPostData.subreddit}</span> 
            <span className="inline-block mx-1">•</span> 
            <span>{targetPostData.score} pts</span>
          </p>
          
        </div>
      </div>;
  } else {
    return <div className="gallery-item" onClick={handlePostClick}>
        <div className="media-container relative">
          {renderMedia()}
          <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm p-3">
            <h3 className="text-white text-lg font-bold leading-tight line-clamp-2 text-center" title={title} dangerouslySetInnerHTML={{
            __html: title
          }} />
          </div>
        </div>
      </div>;
  }
};
export default PostCard;