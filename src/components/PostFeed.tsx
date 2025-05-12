
import React, { useRef } from 'react';
import PostCard from '@/components/PostCard';
import Spinner from '@/components/Spinner';
import { PostData, ViewMode } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { WifiOff } from 'lucide-react';

interface PostFeedProps {
  displayedPosts: PostData[];
  viewMode: ViewMode;
  isLoadingMore: boolean;
  openModal: (index: number) => void;
  message?: string;
}

const PostFeed: React.FC<PostFeedProps> = ({
  displayedPosts,
  viewMode,
  isLoadingMore,
  openModal,
  message
}) => {
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const isNetworkError = message?.includes('Failed to fetch') || 
                         message?.includes('Network error') || 
                         message?.includes('Too many requests');

  // Get the appropriate grid class for the current view mode
  const getGridClasses = () => {
    switch(viewMode) {
      case 'compact':
        return isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';
      case 'large':
        return isMobile ? 'grid-cols-1 gap-3' : 'sm:grid-cols-1 lg:grid-cols-2 gap-4';
      case 'extra-large':
        return 'grid-cols-1 max-w-3xl mx-auto gap-6';
      default:
        return isMobile ? 'grid-cols-1 gap-3' : 'sm:grid-cols-1 lg:grid-cols-2 gap-4';
    }
  };

  return (
    <main className="feed-main-content flex-grow" ref={feedContainerRef}>
      {displayedPosts.length === 0 && !isLoadingMore ? (
        <div className="text-center py-8 text-gray-500">
          <div className="mx-auto mb-4">
            {isNetworkError ? (
              <WifiOff className="h-16 w-16 mx-auto opacity-50" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <p className="text-lg font-medium">
            {isNetworkError ? 'Network Connection Issue' : 'No posts to display'}
          </p>
          <p className="text-sm mt-1">
            {isNetworkError 
              ? 'Unable to connect to Reddit. Try again later.' 
              : 'Enter subreddits and click "Load Posts"'}
          </p>
        </div>
      ) : (
        <div className={cn('grid grid-cols-1', getGridClasses())}>
          {displayedPosts.map((post, index) => (
            <PostCard 
              key={`post-${post.targetPostData.permalink || index}`} 
              postData={post} 
              viewMode={viewMode} 
              index={index} 
              onPostClick={openModal} 
            />
          ))}
        </div>
      )}
      
      {isLoadingMore && (
        <div className="text-center py-4">
          <div className="mx-auto">
            <Spinner size="small" />
          </div>
        </div>
      )}
    </main>
  );
};

export default PostFeed;
