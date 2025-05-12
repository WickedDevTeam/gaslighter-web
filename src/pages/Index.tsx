
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
  const [isSourceMediaReady, setIsSourceMediaReady] = useState(false);

  // Data states
  const [targetAfter, setTargetAfter] = useState<string | null>(null);
  const [noMoreTargetPosts, setNoMoreTargetPosts] = useState(false);
  const [currentTargetSubredditName, setCurrentTargetSubredditName] = useState('');
  const [currentSourceSubredditsNames, setCurrentSourceSubredditsNames] = useState<string[]>([]);
  const [allSourceMediaUrls, setAllSourceMediaUrls] = useState<MediaInfo[]>([]);
  const [queuedTargetPosts, setQueuedTargetPosts] = useState<any[]>([]); // Store posts waiting for media
  const [displayedPosts, setDisplayedPosts] = useState<PostData[]>([]);

  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('error');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(-1);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const displayMessage = useCallback((text: string, type: 'error' | 'info' = 'error') => {
    setMessage(text);
    setMessageType(type);
    console.log(`[Message displayed] ${type}: ${text}`);
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
    console.log('[Refetching source media]');
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
        console.log(`[Source media updated] Total: ${newUrls.length}`);
        return newUrls;
      });
      setIsSourceMediaReady(true);
    } finally {
      setIsRefetchingSources(false);
    }
  }, [currentSourceSubredditsNames, isRefetchingSources, isLoadingInitialSources]);
  
  // Modified to process posts from queue when source media is available
  const appendPostsToFeed = useCallback((targetPosts: any[]) => {
    console.log(`[Appending posts] Target posts: ${targetPosts.length}, Source media: ${allSourceMediaUrls.length}`);
    let postsAddedCount = 0;
    const newPosts: PostData[] = [];
    
    // Don't try to append posts if we don't have source media
    if (allSourceMediaUrls.length === 0) {
      console.log('[Warning] No source media available for replacement - skipping post addition');
      return 0;
    }
    
    targetPosts.forEach(post => {
      const pData = post.data;
      const isTrulyMediaPost = pData.post_hint === 'image' || pData.post_hint === 'hosted:video' || pData.post_hint === 'rich:video' || pData.is_video || pData.is_gallery || pData.preview && pData.preview.images && pData.preview.images.length > 0 && pData.domain !== 'self.' + pData.subreddit.toLowerCase() && !pData.url.includes('/comments/');
      
      if (isTrulyMediaPost) {
        // Only try to pick a random media if we have source media available
        const randomMedia = allSourceMediaUrls.length > 0 
          ? allSourceMediaUrls[Math.floor(Math.random() * allSourceMediaUrls.length)] 
          : null;
        
        if (randomMedia) {
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
      }
    });
    
    if (postsAddedCount === 0) {
      console.log('[Warning] No posts with media found to display');
    }
    
    setDisplayedPosts(prev => [...prev, ...newPosts]);
    return postsAddedCount;
  }, [allSourceMediaUrls]);
  
  // Process queued posts when source media becomes available
  useEffect(() => {
    if (isSourceMediaReady && queuedTargetPosts.length > 0 && allSourceMediaUrls.length > 0) {
      console.log(`[Processing queued posts] Count: ${queuedTargetPosts.length}`);
      const postsAdded = appendPostsToFeed(queuedTargetPosts);
      setQueuedTargetPosts([]); // Clear the queue
      
      if (postsAdded === 0) {
        // If we still couldn't add any posts even with media available
        displayMessage(`No media posts found in r/${currentTargetSubredditName}.`, 'error');
      } else {
        // Clear any error messages if posts were successfully added
        clearMessage();
      }
    }
  }, [isSourceMediaReady, queuedTargetPosts, allSourceMediaUrls, appendPostsToFeed, currentTargetSubredditName, displayMessage, clearMessage]);

  // Modified to ensure source media loading first
  const fetchInitialData = useCallback(async () => {
    console.log('[fetchInitialData] Starting data fetch');
    clearMessage();
    setDisplayedPosts([]);
    setCurrentModalIndex(-1);
    setIsLoadingPosts(true);
    setTargetAfter(null);
    setNoMoreTargetPosts(false);
    setAllSourceMediaUrls([]);
    setIsSourceMediaReady(false);
    setQueuedTargetPosts([]);
    
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
      // STEP 1: Fetch source media FIRST - wait for this to complete before proceeding
      console.log(`[fetchInitialData] Fetching media from ${sourceSubs.length} source subreddits`);
      const srcPromises = sourceSubs.map(name => fetchRedditData(name, 'hot', null, 75)
        .then(d => {
          console.log(`[fetchInitialData] Received ${d.posts?.length || 0} posts from r/${name}`);
          return extractMediaUrls(d.posts);
        })
        .catch(err => {
          console.error(`[fetchInitialData] Error fetching r/${name}:`, err);
          return [];
        }));
      
      const srcResults = await Promise.all(srcPromises);
      const allMedia: MediaInfo[] = [];
      srcResults.forEach(urls => allMedia.push(...urls));
      
      // Remove duplicates
      const uniqueMedia = Array.from(new Map(allMedia.map(item => [item.url, item])).values());
      console.log(`[fetchInitialData] Source media collected: ${uniqueMedia.length} unique items`);
      
      // Check if we have source media before proceeding
      if (uniqueMedia.length === 0) {
        displayMessage("No media found in source subreddits. Try different sources.", 'error');
        setIsLoadingPosts(false);
        setIsLoadingInitialSources(false);
        return;
      }
      
      // Media is available - set it and mark as ready
      setAllSourceMediaUrls(uniqueMedia);
      setIsSourceMediaReady(true);

      // STEP 2: Now fetch target posts
      console.log(`[fetchInitialData] Fetching target posts from r/${targetSub}`);
      const targetData = await fetchRedditData(targetSub, sortMode, topTimeFilter, 25, null);
      
      if (!targetData.posts || targetData.posts.length === 0) {
        displayMessage(`No posts found in r/${targetSub} for selected filters.`, 'error');
      } else {
        console.log(`[fetchInitialData] Received ${targetData.posts.length} target posts`);
        
        // Store the after token regardless
        setTargetAfter(targetData.after);
        
        // Now that we have source media, directly append the posts to the feed
        const postsAdded = appendPostsToFeed(targetData.posts);
        
        if (postsAdded === 0) {
          if (targetData.posts.length > 0) {
            displayMessage(`Found posts in r/${targetSub}, but none had replaceable media.`, 'error');
          } else {
            displayMessage(`No media posts found in r/${targetSub}.`, 'error');
          }
        } else {
          // If posts were added successfully, clear any error messages
          clearMessage();
        }
        
        if (!targetData.after) {
          setNoMoreTargetPosts(true);
        }
      }
    } catch (error: any) {
      console.error('[fetchInitialData] Error:', error);
      displayMessage(`Operation failed: ${error.message}`, 'error');
    } finally {
      setIsLoadingInitialSources(false);
      setIsLoadingPosts(false);
      console.log('[fetchInitialData] Fetch operation completed');
    }
  }, [targetSubreddit, sourceSubreddits, sortMode, topTimeFilter, appendPostsToFeed, clearMessage, displayMessage]);
  
  const loadMoreTargetPosts = useCallback(async () => {
    if (isLoadingMore || noMoreTargetPosts || !currentTargetSubredditName || !targetAfter || !isSourceMediaReady) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchRedditData(currentTargetSubredditName, sortMode, topTimeFilter, 15, targetAfter);
      if (data.posts?.length > 0) {
        // Only try to append posts if we have source media available
        if (allSourceMediaUrls.length > 0) {
          const postsAdded = appendPostsToFeed(data.posts);
          if (postsAdded === 0) {
            // If we couldn't add any posts, queue them for when media is available
            setQueuedTargetPosts(prev => [...prev, ...data.posts]);
          }
        } else {
          // Queue posts for when media becomes available
          setQueuedTargetPosts(prev => [...prev, ...data.posts]);
        }
        
        setTargetAfter(data.after);
        if (!data.after) {
          setNoMoreTargetPosts(true);
        }
      } else {
        setNoMoreTargetPosts(true);
      }
    } catch (error: any) {
      displayMessage(`Error loading more: ${error.message}`, 'error');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, noMoreTargetPosts, currentTargetSubredditName, targetAfter, sortMode, topTimeFilter, appendPostsToFeed, displayMessage, isSourceMediaReady, allSourceMediaUrls]);

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
        return 'sm:grid-cols-1 lg:grid-cols-2 gap-4';
      case 'extra-large':
        return 'grid-cols-1 max-w-3xl mx-auto gap-6';
      default:
        return 'sm:grid-cols-1 lg:grid-cols-2 gap-4';
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
