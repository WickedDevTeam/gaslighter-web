
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SubredditInput from '@/components/SubredditInput';
import MessageArea from '@/components/MessageArea';
import PostCard from '@/components/PostCard';
import MediaModal from '@/components/MediaModal';
import Spinner from '@/components/Spinner';
import FilterControls from '@/components/FilterControls';
import AutoscrollControls from '@/components/AutoscrollControls';
import { fetchRedditData, extractMediaUrls } from '@/utils/redditApi';
import { PostData, ViewMode, SortMode, TopTimeFilter, MediaInfo } from '@/types';
import { useSettings } from '@/hooks/useSettings';
import { useAutoscroll } from '@/hooks/useAutoscroll';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const { settings, isLoaded } = useSettings();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
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

  // Processing state to track if we're in the middle of preparing data
  const [isProcessingData, setIsProcessingData] = useState(false);

  // Setup autoscroll
  const { isPaused } = useAutoscroll({
    isEnabled: isAutoscrollEnabled,
    speed: autoscrollSpeed,
    scrollContainer: feedContainerRef.current
  });

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
      console.log('[Warning] No source media available for replacement - queuing posts');
      return 0;
    }
    
    targetPosts.forEach(post => {
      const pData = post.data;
      if (!pData) return;
      
      // More lenient media post detection
      const isTrulyMediaPost = 
        pData.post_hint === 'image' || 
        pData.post_hint === 'hosted:video' || 
        pData.post_hint === 'rich:video' || 
        pData.is_video || 
        pData.is_gallery || 
        (pData.preview && pData.preview.images && pData.preview.images.length > 0) ||
        (pData.url_overridden_by_dest && /\.(jpg|jpeg|png|gif)$/i.test(pData.url_overridden_by_dest)) ||
        (pData.url_overridden_by_dest && pData.url_overridden_by_dest.includes('imgur.com'));
        
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
    } else {
      setDisplayedPosts(prev => [...prev, ...newPosts]);
    }
    
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

  // Fixed to ensure media is always loaded completely before attempting to display any posts
  const fetchInitialData = useCallback(async () => {
    console.log('[fetchInitialData] Starting data fetch');
    setIsProcessingData(true);
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
      setIsProcessingData(false);
      return;
    }
    
    const sourceSubs = sourceSubsRaw.split(',').map(s => s.trim().replace(/^r\//i, '').replace(/\/$/, '')).filter(s => s);
    
    if (sourceSubs.length === 0) {
      displayMessage("Please enter valid, comma-separated source subreddits.", 'error');
      setIsLoadingPosts(false);
      setIsProcessingData(false);
      return;
    }
    
    setCurrentTargetSubredditName(targetSub);
    setCurrentSourceSubredditsNames(sourceSubs);
    
    try {
      // We won't show any intermediate messages to avoid incorrect error states
      setIsLoadingInitialSources(true);
      
      // STEP 1: Fetch source media FIRST - wait for this to complete before proceeding
      console.log(`[fetchInitialData] Fetching media from ${sourceSubs.length} source subreddits`);
      
      // Create a local variable to store media before setting state
      let collectedMedia: MediaInfo[] = [];
      let hasSuccessfulFetch = false;
      
      const fetchPromises = sourceSubs.map(async (name) => {
        try {
          // For each subreddit, try multiple sort modes if one fails
          const sortOptions = ['hot', 'new', 'top'];
          let mediaFromSub: MediaInfo[] = [];
          
          for (const sortOption of sortOptions) {
            if (mediaFromSub.length > 0) break; // Stop if we already have media
            
            try {
              const timeFilter = sortOption === 'top' ? 'month' : null;
              const data = await fetchRedditData(name, sortOption, timeFilter, 75);
              if (data.posts && data.posts.length > 0) {
                const extractedMedia = extractMediaUrls(data.posts);
                if (extractedMedia.length > 0) {
                  mediaFromSub = extractedMedia;
                  hasSuccessfulFetch = true;
                  console.log(`[fetchInitialData] Fetched ${extractedMedia.length} media items from r/${name} using ${sortOption}`);
                  break;
                }
              }
            } catch (sortError) {
              console.log(`Error fetching r/${name} with ${sortOption}:`, sortError);
              // Continue to next sort option
            }
          }
          
          return mediaFromSub;
        } catch (subError) {
          console.error(`[fetchInitialData] Failed to fetch from r/${name}:`, subError);
          return [];
        }
      });
      
      const results = await Promise.all(fetchPromises);
      results.forEach(mediaItems => {
        collectedMedia.push(...mediaItems);
      });
      
      // Remove duplicates
      collectedMedia = Array.from(new Map(collectedMedia.map(item => [item.url, item])).values());
      console.log(`[fetchInitialData] Source media collected: ${collectedMedia.length} unique items`);
      
      // Check if we have source media before proceeding
      if (collectedMedia.length === 0) {
        if (hasSuccessfulFetch) {
          displayMessage("No media content found in the source subreddits. Try different sources.", 'error');
        } else {
          displayMessage("Failed to load source subreddits. Check your internet connection and try again.", 'error');
        }
        setIsLoadingPosts(false);
        setIsLoadingInitialSources(false);
        setIsProcessingData(false);
        return;
      }
      
      // Media is available - set it and mark as ready
      // IMPORTANT: Update state with the collected media BEFORE fetching target posts
      setAllSourceMediaUrls(collectedMedia);
      setIsSourceMediaReady(true);

      // STEP 2: Now fetch target posts
      console.log(`[fetchInitialData] Fetching target posts from r/${targetSub}`);
      
      // Try multiple sort modes for target if needed
      const targetSortOptions = [sortMode, 'hot', 'new', 'top'];
      let targetData;
      let usedSortMode = sortMode;
      
      for (const targetSortOption of targetSortOptions) {
        try {
          const timeFilter = targetSortOption === 'top' ? topTimeFilter : null;
          const data = await fetchRedditData(targetSub, targetSortOption, timeFilter, 25, null);
          if (data.posts && data.posts.length > 0) {
            targetData = data;
            usedSortMode = targetSortOption as SortMode;
            break;
          }
        } catch (err) {
          console.log(`Error with ${targetSortOption} for r/${targetSub}:`, err);
          // Try next sort option
        }
      }

      if (!targetData || !targetData.posts || targetData.posts.length === 0) {
        displayMessage(`No posts found in r/${targetSub} for selected filters.`, 'error');
        setIsLoadingPosts(false);
        setIsLoadingInitialSources(false);
        setIsProcessingData(false);
        return;
      }
      
      console.log(`[fetchInitialData] Received ${targetData.posts.length} target posts`);
      
      // If we used a different sort than requested, inform the user
      if (usedSortMode !== sortMode) {
        setSortMode(usedSortMode);
        toast({
          title: `Using "${usedSortMode}" sorting`,
          description: `"${sortMode}" returned no posts for r/${targetSub}`,
          duration: 3000
        });
      }
      
      // Store the after token regardless
      setTargetAfter(targetData.after);
      
      // Now that we have source media, directly append the posts to the feed
      const targetPosts = targetData.posts;
      let postsAdded = 0;
      let newDisplayPosts: PostData[] = [];
      
      targetPosts.forEach(post => {
        const pData = post.data;
        if (!pData) return;
        
        // More lenient media post detection
        const isTrulyMediaPost = 
          pData.post_hint === 'image' || 
          pData.post_hint === 'hosted:video' || 
          pData.post_hint === 'rich:video' || 
          pData.is_video || 
          pData.is_gallery || 
          (pData.preview && pData.preview.images && pData.preview.images.length > 0) ||
          (pData.url_overridden_by_dest && /\.(jpg|jpeg|png|gif)$/i.test(pData.url_overridden_by_dest)) ||
          (pData.url_overridden_by_dest && pData.url_overridden_by_dest.includes('imgur.com'));
        
        if (isTrulyMediaPost) {
          // Use the local media array which we know is populated
          const randomMedia = collectedMedia.length > 0 
            ? collectedMedia[Math.floor(Math.random() * collectedMedia.length)] 
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
            
            newDisplayPosts.push(postData);
            postsAdded++;
          }
        }
      });
      
      if (postsAdded === 0) {
        if (targetData.posts.length > 0) {
          displayMessage(`Found posts in r/${targetSub}, but none had replaceable media.`, 'error');
        } else {
          displayMessage(`No media posts found in r/${targetSub}.`, 'error');
        }
      } else {
        // If posts were added successfully, update the display posts and clear any error messages
        setDisplayedPosts(newDisplayPosts);
        clearMessage();
      }
      
      if (!targetData.after) {
        setNoMoreTargetPosts(true);
      }
    } catch (error: any) {
      console.error('[fetchInitialData] Error:', error);
      displayMessage(`Operation failed: ${error.message}`, 'error');
    } finally {
      setIsLoadingInitialSources(false);
      setIsLoadingPosts(false);
      setIsProcessingData(false);
      console.log('[fetchInitialData] Fetch operation completed');
    }
  }, [targetSubreddit, sourceSubreddits, sortMode, topTimeFilter, clearMessage, displayMessage, toast]);
  
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
    // Only setup auto-loading when autoscroll is not enabled
    // When autoscrolling is on, we'll load more content automatically as we reach the bottom
    if (!isAutoscrollEnabled) {
      const handleScroll = () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const threshold = documentHeight * 0.8; // Load more when 80% scrolled
        
        if (scrollPosition >= threshold) {
          loadMoreTargetPosts();
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
          loadMoreTargetPosts();
        }
      };
      
      const intervalId = setInterval(checkScrollPosition, 1000);
      return () => clearInterval(intervalId);
    }
  }, [loadMoreTargetPosts, isAutoscrollEnabled]);

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
            onSubmit={fetchInitialData}
          />
          
          <MessageArea message={message} type={messageType} />
        </section>

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
