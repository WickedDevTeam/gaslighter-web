
import React from 'react';

interface MediaErrorPlaceholderProps {
  subreddit?: string;
}

const MediaErrorPlaceholder: React.FC<MediaErrorPlaceholderProps> = ({ subreddit }) => {
  return (
    <div 
      className="media-error-placeholder w-full flex flex-col items-center justify-center text-gray-400 p-3"
      style={{ display: 'none', height: '100%' }}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-8 w-8 text-gray-500 mb-1" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      <span className="text-xs">Media unavailable.</span>
      <span className="text-xs mt-0.5">Original: r/{subreddit || 'unknown'}</span>
    </div>
  );
};

export default MediaErrorPlaceholder;
