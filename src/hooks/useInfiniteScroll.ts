
import { useEffect } from 'react';
import { SortMode, TopTimeFilter } from '@/types';

interface UseInfiniteScrollProps {
  isAutoscrollEnabled: boolean;
  loadMorePosts: (sortMode: SortMode, topTimeFilter: TopTimeFilter) => Promise<void>;
  sortMode: SortMode;
  topTimeFilter: TopTimeFilter;
}

export function useInfiniteScroll({
  isAutoscrollEnabled,
  loadMorePosts,
  sortMode,
  topTimeFilter
}: UseInfiniteScrollProps) {
  
  useEffect(() => {
    // Only setup auto-loading when autoscroll is not enabled
    // When autoscrolling is on, we'll load more content automatically as we reach the bottom
    if (!isAutoscrollEnabled) {
      const handleScroll = () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const threshold = documentHeight * 0.8; // Load more when 80% scrolled
        
        if (scrollPosition >= threshold) {
          loadMorePosts(sortMode, topTimeFilter);
        }
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
    
    // When autoscrolling is on, check if we need to load more content when near the bottom
    if (isAutoscrollEnabled) {
      const checkScrollPosition = () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const threshold = documentHeight * 0.8; // Load more when 80% scrolled
        
        if (scrollPosition >= threshold) {
          loadMorePosts(sortMode, topTimeFilter);
        }
      };
      
      const intervalId = setInterval(checkScrollPosition, 1000);
      return () => clearInterval(intervalId);
    }
  }, [loadMorePosts, isAutoscrollEnabled, sortMode, topTimeFilter]);
}
