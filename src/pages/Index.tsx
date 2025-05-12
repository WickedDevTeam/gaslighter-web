
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SubredditInput from '@/components/SubredditInput';
import MessageArea from '@/components/MessageArea';
import PostCard from '@/components/PostCard';
import MediaModal from '@/components/MediaModal';
import Spinner from '@/components/Spinner';
import FilterControls from '@/components/FilterControls';
import { fetchRedditData, extractMediaUrls } from '@/utils/redditApi';
import { PostData, ViewMode, SortMode, TopTimeFilter, MediaInfo } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';

const Index = () => {
  const { settings, isLoaded } = useSettings();
  
  // Main inputs state - initialize from settings when loaded
  const [targetSubreddit, setTargetSubreddit] = useState('');
  const [sourceSubreddits, setSourceSubreddits] = useState('pics');
  const [viewMode, setViewMode] = useState<ViewMode>('large');
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [topTimeFilter, setTopTimeFilter] = useState<TopTimeFilter>('day');

  // Apply stored settings on load
  useEffect(() => {
    if (isLoaded) {
      setTargetSubreddit(settings.targetSubreddit);
      setSourceSubreddits(settings.sourceSubreddits);
      setViewMode(settings.viewMode);
      setSortMode(settings.sortMode);
      setTopTimeFilter(settings.topTimeFilter);
    }
  }, [isLoaded, settings]);

  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingInitialSources, setIsLoadingInitialSources] = useState(false);
  const [isRefetchingSources, setIsRefetchingSources] = useState(false);

  // Data states
  const [targetAfter, setTargetAfter] = useState<string | null>(null);
  const [noMoreTargetPosts, setNoMoreTargetPosts] = useState(false);
  const [currentTargetSubredditName, setCurrentTargetSubredditName] = useState('');
  const [currentSourceSubredditsNames, setCurrentSourceSubredditsNames] = useState<string[]>([]);
  const [allSourceMediaUrls, setAllSourceMediaUrls] = useState<MediaInfo[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<PostData[]>([]);

  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('info');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(-1);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const displayMessage = useCallback((text: string, type: 'error' | 'info' = 'error') => {
    setMessage(text);
    setMessageType(type);
  }, []);
  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);
  const openModal = useCallback((index: number) => {
    if (index >= 0 && index < displayedPosts.length) {
      setCurrentModalIndex(index);
      setModalOpen(true);
    }
  }, [displayedPosts]);
  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);
  const navigateModal = useCallback((newIndex: number) => {
    setCurrentModalIndex(newIndex);
  }, []);
  const refetchSourceMedia = useCallback(async () => {
    if (isRefetchingSources || isLoadingInitialSources || currentSourceSubredditsNames.length === 0) return;
    setIsRefetchingSources(true);
    try {
      const promises = currentSourceSubredditsNames.map(name => fetchRedditData(name, 'hot', null, 50).then(d => extractMediaUrls(d.posts)).catch(() => []));
      const results = await Promise.all(promises);
      setAllSourceMediaUrls(prevUrls => {
        const newUrls = [...prevUrls];
        results.forEach(urls => {
          urls.forEach(media => {
            if (!newUrls.some(ex => ex.url === media.url)) {
              newUrls.push(media);
            }
          });
        });
        return newUrls;
      });
    } finally {
      setIsRefetchingSources(false);
    }
  }, [currentSourceSubredditsNames, isRefetchingSources, isLoadingInitialSources]);
  const appendPostsToFeed = useCallback((targetPosts: any[]) => {
    let postsAddedCount = 0;
    const newPosts: PostData[] = [];
    targetPosts.forEach(post => {
      const pData = post.data;
      const isTrulyMediaPost = pData.post_hint === 'image' || pData.post_hint === 'hosted:video' || pData.post_hint === 'rich:video' || pData.is_video || pData.is_gallery || pData.preview && pData.preview.images && pData.preview.images.length > 0 && pData.domain !== 'self.' + pData.subreddit.toLowerCase() && !pData.url.includes('/comments/');
      if (isTrulyMediaPost) {
        if (allSourceMediaUrls.length < 10 && currentSourceSubredditsNames.length > 0 && !isRefetchingSources && !isLoadingInitialSources) {
          refetchSourceMedia();
        }
        const randomMedia = allSourceMediaUrls.length > 0 ? allSourceMediaUrls[Math.floor(Math.random() * allSourceMediaUrls.length)] : null;
        const postData: PostData = {
          targetPostData: {
            title: pData.title,
            author: pData.author,
            subreddit: pData.subreddit,
            permalink: pData.permalink,
            score: pData.score
          },
          replacementMedia: randomMedia
        };
        newPosts.push(postData);
        postsAddedCount++;
      }
    });
    setDisplayedPosts(prev => [...prev, ...newPosts]);
    return postsAddedCount;
  }, [allSourceMediaUrls, currentSourceSubredditsNames, isLoadingInitialSources, isRefetchingSources, refetchSourceMedia]);
  const fetchInitialData = useCallback(async () => {
    clearMessage();
    setDisplayedPosts([]);
    setCurrentModalIndex(-1);
    setIsLoadingPosts(true);
    setTargetAfter(null);
    setNoMoreTargetPosts(false);
    setAllSourceMediaUrls([]);
    const targetSub = targetSubreddit.trim().replace(/^r\//i, '');
    const sourceSubsRaw = sourceSubreddits.trim();
    if (!targetSub || !sourceSubsRaw) {
      displayMessage("Please enter both target and source subreddits.", 'error');
      setIsLoadingPosts(false);
      return;
    }
    const sourceSubs = sourceSubsRaw.split(',').map(s => s.trim().replace(/^r\//i, '').replace(/\/$/, '')).filter(s => s);
    if (sourceSubs.length === 0) {
      displayMessage("Please enter valid, comma-separated source subreddits.", 'error');
      setIsLoadingPosts(false);
      return;
    }
    setCurrentTargetSubredditName(targetSub);
    setCurrentSourceSubredditsNames(sourceSubs);
    setIsLoadingInitialSources(true);
    try {
      // Fetch source media
      const srcPromises = sourceSubs.map(name => fetchRedditData(name, 'hot', null, 75).then(d => extractMediaUrls(d.posts)).catch(err => {
        displayMessage(`Warning: Source r/${name} issue.`, 'info');
        return [];
      }));
      const srcResults = await Promise.all(srcPromises);
      const allMedia: MediaInfo[] = [];
      srcResults.forEach(urls => allMedia.push(...urls));

      // Remove duplicates
      const uniqueMedia = Array.from(new Map(allMedia.map(item => [item.url, item])).values());
      setAllSourceMediaUrls(uniqueMedia);
      if (uniqueMedia.length === 0) {
        displayMessage("No media in sources. Posts will lack replacements.", 'info');
      }

      // Fetch target posts
      const targetData = await fetchRedditData(targetSub, sortMode, topTimeFilter, 25, null);
      if (!targetData.posts || targetData.posts.length === 0) {
        displayMessage(`No posts in r/${targetSub} for selected filters.`, 'error');
      } else {
        const postsAdded = appendPostsToFeed(targetData.posts);
        setTargetAfter(targetData.after);
        if (postsAdded > 0 && uniqueMedia.length > 0) {
          displayMessage(`Gaslit initial posts! Scroll for more.`, 'info');
        } else if (postsAdded === 0 && targetData.posts.length > 0) {
          displayMessage(`Found posts in r/${targetSub}, but none had replaceable media.`, 'info');
        }
        if (!targetData.after && postsAdded > 0) {
          setNoMoreTargetPosts(true);
          displayMessage(`Loaded all available media posts from r/${targetSub}.`, 'info');
        } else if (!targetData.after && postsAdded === 0) {
          setNoMoreTargetPosts(true);
        }
      }
    } catch (error: any) {
      displayMessage(`Operation failed: ${error.message}`, 'error');
    } finally {
      setIsLoadingInitialSources(false);
      setIsLoadingPosts(false);
    }
  }, [targetSubreddit, sourceSubreddits, sortMode, topTimeFilter, appendPostsToFeed, clearMessage, displayMessage]);
  const loadMoreTargetPosts = useCallback(async () => {
    if (isLoadingMore || noMoreTargetPosts || !currentTargetSubredditName || !targetAfter) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchRedditData(currentTargetSubredditName, sortMode, topTimeFilter, 15, targetAfter);
      if (data.posts?.length > 0) {
        const postsAdded = appendPostsToFeed(data.posts);
        setTargetAfter(data.after);
        if (!data.after && postsAdded > 0) {
          setNoMoreTargetPosts(true);
          displayMessage(`End of r/${currentTargetSubredditName}!`, 'info');
        } else if (!data.after && postsAdded === 0) {
          setNoMoreTargetPosts(true);
        } else if (postsAdded > 0) {
          clearMessage();
        }
      } else {
        setNoMoreTargetPosts(true);
        displayMessage(`No more posts in r/${currentTargetSubredditName}.`, 'info');
      }
    } catch (error: any) {
      displayMessage(`Error loading more: ${error.message}`, 'error');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, noMoreTargetPosts, currentTargetSubredditName, targetAfter, sortMode, topTimeFilter, appendPostsToFeed, displayMessage, clearMessage]);

  // Set up scroll listener for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) {
        loadMoreTargetPosts();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreTargetPosts]);

  // Get the appropriate grid class for the current view mode
  const getGridClasses = () => {
    switch(viewMode) {
      case 'compact':
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';
      case 'large':
        return 'sm:grid-cols-1 lg:grid-cols-2 gap-4'; // Changed from 3 columns to 2
      case 'extra-large':
        return 'grid-cols-1 max-w-3xl mx-auto gap-6';
      default:
        return 'sm:grid-cols-1 lg:grid-cols-2 gap-4'; // Changed default to match large
    }
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
            isLoadingPosts={isLoadingPosts}
            onTargetChange={setTargetSubreddit}
            onSourceChange={setSourceSubreddits}
            onViewModeChange={setViewMode}
            onSortModeChange={setSortMode}
            onTopTimeFilterChange={setTopTimeFilter}
            onSubmit={fetchInitialData}
          />
          
          <MessageArea message={message} type={messageType} />
        </section>

        <main className="feed-main-content flex-grow" ref={feedContainerRef}>
          {isLoadingPosts && (
            <div className="text-center py-6">
              <div className="mx-auto mb-2">
                <Spinner />
              </div>
              <p className="text-sm text-gray-400">Mixing realities...</p>
            </div>
          )}
          
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
      </div>

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
