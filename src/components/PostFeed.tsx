
import React, { useRef } from 'react';
import PostCard from '@/components/PostCard';
import Spinner from '@/components/Spinner';
import { PostData, ViewMode } from '@/types';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface PostFeedProps {
  displayedPosts: PostData[];
  viewMode: ViewMode;
  isLoadingMore: boolean;
  openModal: (index: number) => void;
}

const PostFeed: React.FC<PostFeedProps> = ({
  displayedPosts,
  viewMode,
  isLoadingMore,
  openModal
}) => {
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
      <div className={cn('grid grid-cols-1', getGridClasses())}>
        {displayedPosts.map((post, index) => (
          <PostCard 
            key={`post-${index}`} 
            postData={post} 
            viewMode={viewMode} 
            index={index} 
            onPostClick={openModal} 
          />
        ))}
      </div>
      
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
