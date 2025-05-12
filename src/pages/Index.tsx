
import React, { useState, useEffect } from 'react';
import SubredditInput from '@/components/SubredditInput';
import MessageArea from '@/components/MessageArea';
import MediaModal from '@/components/MediaModal';
import FilterControls from '@/components/FilterControls';
import AutoscrollControls from '@/components/AutoscrollControls';
import PostFeed from '@/components/PostFeed';
import { ViewMode, SortMode, TopTimeFilter } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { useAutoscroll } from '@/hooks/useAutoscroll';
import { usePosts } from '@/hooks/usePosts';
import { useModal } from '@/hooks/useModal';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const Index = () => {
  const { settings, isLoaded } = useSettings();
  
  // Main inputs state - initialize from settings when loaded
  const [targetSubreddit, setTargetSubreddit] = useState('');
  const [sourceSubreddits, setSourceSubreddits] = useState('pics');
  const [viewMode, setViewMode] = useState<ViewMode>('large');
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [topTimeFilter, setTopTimeFilter] = useState<TopTimeFilter>('day');
  const [isAutoscrollEnabled, setIsAutoscrollEnabled] = useState(false);
  const [autoscrollSpeed, setAutoscrollSpeed] = useState(3);

  // Apply stored settings on load
  useEffect(() => {
    if (isLoaded) {
      setTargetSubreddit(settings.targetSubreddit);
      setSourceSubreddits(settings.sourceSubreddits);
      setViewMode(settings.viewMode);
      setSortMode(settings.sortMode);
      setTopTimeFilter(settings.topTimeFilter);
      setIsAutoscrollEnabled(settings.isAutoscrollEnabled);
      setAutoscrollSpeed(settings.autoscrollSpeed);
    }
  }, [isLoaded, settings]);

  // Hooks
  const { 
    displayedPosts, 
    message, 
    messageType,
    isLoadingPosts, 
    isLoadingMore,
    isProcessingData,
    fetchInitialData, 
    loadMoreTargetPosts,
    clearMessage,
    setQueuedTargetPosts,
    setDisplayedPosts,
    isSourceMediaReady,
    queuedTargetPosts
  } = usePosts();

  const {
    modalOpen,
    currentModalIndex,
    openModal,
    closeModal,
    navigateModal
  } = useModal();

  const { isPaused } = useAutoscroll({
    isEnabled: isAutoscrollEnabled,
    speed: autoscrollSpeed,
    scrollContainer: document.querySelector('.feed-main-content')
  });

  // Process queued posts when source media becomes available
  useEffect(() => {
    if (isSourceMediaReady && queuedTargetPosts.length > 0) {
      console.log(`[Processing queued posts] Count: ${queuedTargetPosts.length}`);
      setQueuedTargetPosts([]);
      clearMessage();
    }
  }, [isSourceMediaReady, queuedTargetPosts, setQueuedTargetPosts, clearMessage]);

  // Set up infinite scroll
  useInfiniteScroll({
    isAutoscrollEnabled,
    loadMorePosts: loadMoreTargetPosts,
    sortMode,
    topTimeFilter
  });

  const handleSubmit = () => {
    fetchInitialData(targetSubreddit, sourceSubreddits, sortMode, topTimeFilter);
  };

  const handleAutoscrollToggle = (enabled: boolean) => {
    setIsAutoscrollEnabled(enabled);
  };

  const handleSpeedChange = (speed: number) => {
    setAutoscrollSpeed(speed);
  };

  return (
    <div className="app-bg app-text">
      <div className="main-container container mx-auto min-h-screen flex flex-col">
        <header className="page-header text-center">
          <h1 className="font-bold">Gaslighter</h1>
        </header>

        <section className="controls-section control-panel-bg shadow-md sticky top-2 z-50 rounded-lg">
          <FilterControls
            targetSubreddit={targetSubreddit}
            sourceSubreddits={sourceSubreddits}
            viewMode={viewMode}
            sortMode={sortMode}
            topTimeFilter={topTimeFilter}
            isAutoscrollEnabled={isAutoscrollEnabled}
            autoscrollSpeed={autoscrollSpeed}
            isLoadingPosts={isLoadingPosts || isProcessingData}
            onTargetChange={setTargetSubreddit}
            onSourceChange={setSourceSubreddits}
            onViewModeChange={setViewMode}
            onSortModeChange={setSortMode}
            onTopTimeFilterChange={setTopTimeFilter}
            onAutoscrollToggle={handleAutoscrollToggle}
            onSpeedChange={handleSpeedChange}
            onSubmit={handleSubmit}
          />
          
          <MessageArea message={message} type={messageType} />
        </section>

        <PostFeed
          displayedPosts={displayedPosts}
          viewMode={viewMode}
          isLoadingMore={isLoadingMore}
          openModal={openModal}
        />
      </div>
      
      {/* Add the autoscroll controls */}
      <AutoscrollControls
        isEnabled={isAutoscrollEnabled}
        speed={autoscrollSpeed}
        isPaused={isPaused}
        onToggle={handleAutoscrollToggle}
        onSpeedChange={handleSpeedChange}
      />

      <MediaModal 
        isOpen={modalOpen} 
        onClose={closeModal} 
        posts={displayedPosts} 
        currentIndex={currentModalIndex} 
        onNavigate={navigateModal} 
      />
    </div>
  );
};

export default Index;
