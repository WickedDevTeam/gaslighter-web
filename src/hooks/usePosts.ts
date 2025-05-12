import { useState, useCallback } from 'react';
import { PostData, SortMode, TopTimeFilter } from '@/types';
import { 
  fetchMultipleSubreddits, 
  extractMediaUrls, 
  shuffleArray 
} from '@/utils/redditApi';
import { useToast } from '@/hooks/use-toast';

export function usePosts() {
  const { toast } = useToast();
  
  // Loading states
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingInitialSources, setIsLoadingInitialSources] = useState(false);
  const [isRefetchingSources, setIsRefetchingSources] = useState(false);
  const [isSourceMediaReady, setIsSourceMediaReady] = useState(false);
  const [isProcessingData, setIsProcessingData] = useState(false);

  // Data states
  const [targetAfter, setTargetAfter] = useState<string | null>(null);
  const [noMoreTargetPosts, setNoMoreTargetPosts] = useState(false);
  const [currentTargetSubredditName, setCurrentTargetSubredditName] = useState('');
  const [currentSourceSubredditsNames, setCurrentSourceSubredditsNames] = useState<string[]>([]);
  const [allSourceMediaUrls, setAllSourceMediaUrls] = useState<Array<any>>([]);
  const [queuedTargetPosts, setQueuedTargetPosts] = useState<any[]>([]); // Store posts waiting for media
  const [displayedPosts, setDisplayedPosts] = useState<PostData[]>([]);

  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'info'>('error');

  const displayMessage = useCallback((text: string, type: 'error' | 'info' = 'error') => {
    setMessage(text);
    setMessageType(type);
    console.log(`[Message displayed] ${type}: ${text}`);
    
    // Also show toast for errors
    if (type === 'error') {
      toast({
        variant: "destructive",
        title: "Error",
        description: text,
      });
    }
  }, [toast]);
  
  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

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

  const fetchInitialData = useCallback(async (targetSubreddit: string, sourceSubreddits: string, sortMode: SortMode, topTimeFilter: TopTimeFilter) => {
    console.log('[fetchInitialData] Starting data fetch');
    setIsProcessingData(true);
    clearMessage();
    setDisplayedPosts([]);
    setTargetAfter(null);
    setNoMoreTargetPosts(false);
    setAllSourceMediaUrls([]);
    setIsSourceMediaReady(false);
    setQueuedTargetPosts([]);
    
    const targetSubsRaw = targetSubreddit.trim();
    const sourceSubsRaw = sourceSubreddits.trim();
    
    if (!targetSubsRaw || !sourceSubsRaw) {
      displayMessage("Please enter both target and source subreddits.", 'error');
      setIsLoadingPosts(false);
      setIsProcessingData(false);
      return;
    }
    
    // Split target subreddits by comma
    const targetSubs = targetSubsRaw.split(',').map(s => s.trim().replace(/^r\//i, '').replace(/\/$/, '')).filter(s => s);
    const sourceSubs = sourceSubsRaw.split(',').map(s => s.trim().replace(/^r\//i, '').replace(/\/$/, '')).filter(s => s);
    
    if (sourceSubs.length === 0) {
      displayMessage("Please enter valid, comma-separated source subreddits.", 'error');
      setIsLoadingPosts(false);
      setIsProcessingData(false);
      return;
    }
    
    if (targetSubs.length === 0) {
      displayMessage("Please enter valid, comma-separated target subreddits.", 'error');
      setIsLoadingPosts(false);
      setIsProcessingData(false);
      return;
    }
    
    setCurrentTargetSubredditName(targetSubs.join(', '));
    setCurrentSourceSubredditsNames(sourceSubs);
    
    try {
      // We won't show any intermediate messages to avoid incorrect error states
      setIsLoadingInitialSources(true);
      
      // STEP 1: Fetch source media FIRST - wait for this to complete before proceeding
      console.log(`[fetchInitialData] Fetching media from ${sourceSubs.length} source subreddits`);
      
      // Create a local variable to store media before setting state
      let collectedMedia: any[] = [];
      let hasSuccessfulFetch = false;
      
      const fetchPromises = sourceSubs.map(async (name) => {
        try {
          // For each subreddit, try multiple sort modes if one fails
          const sortOptions = ['hot', 'new', 'top'];
          let mediaFromSub: any[] = [];
          
          for (const sortOption of sortOptions) {
            if (mediaFromSub.length > 0) break; // Stop if we already have media
            
            try {
              console.log(`Trying to fetch r/${name} with ${sortOption}`);
              const timeFilter = sortOption === 'top' ? 'month' : null;
              const data = await fetchRedditData(name, sortOption, timeFilter, 75);
              if (data.posts && data.posts.length > 0) {
                const extractedMedia = extractMediaUrls(data.posts);
                if (extractedMedia.length > 0) {
                  mediaFromSub = extractedMedia;
                  hasSuccessfulFetch = true;
                  console.log(`[fetchInitialData] Fetched ${extractedMedia.length} media items from r/${name} using ${sortOption}`);
                  break;
                } else {
                  console.log(`No media found in r/${name} using ${sortOption}`);
                }
              } else {
                console.log(`No posts found in r/${name} using ${sortOption}`);
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
      
      // Shuffle the source media for better randomization
      collectedMedia = shuffleArray(collectedMedia);
      
      // Remove duplicates
      collectedMedia = Array.from(new Map(collectedMedia.map(item => [item.url, item])).values());
      console.log(`[fetchInitialData] Source media collected: ${collectedMedia.length} unique items`);
      
      // Check if we have source media before proceeding
      if (collectedMedia.length === 0) {
        if (hasSuccessfulFetch) {
          displayMessage("No media content found in the source subreddits. Try different sources.", 'error');
        } else {
          displayMessage("Failed to load source subreddits. Check your internet connection or try different subreddits.", 'error');
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
      console.log(`[fetchInitialData] Fetching target posts from r/${targetSubs.join(', ')}`);
      
      // Try multiple sort modes for target if needed
      const targetSortOptions = [sortMode, 'hot', 'new', 'top'];
      let targetData;
      let usedSortMode = sortMode;
      
      for (const targetSortOption of targetSortOptions) {
        try {
          const timeFilter = targetSortOption === 'top' ? topTimeFilter : null;
          // Use the new multiple subreddits fetch function
          const data = await fetchMultipleSubreddits(targetSubs, targetSortOption, timeFilter, 25, null);
          if (data.posts && data.posts.length > 0) {
            targetData = data;
            usedSortMode = targetSortOption as SortMode;
            break;
          }
        } catch (err) {
          console.log(`Error with ${targetSortOption} for r/${targetSubs.join(', ')}:`, err);
          // Try next sort option
        }
      }

      if (!targetData || !targetData.posts || targetData.posts.length === 0) {
        displayMessage(`No posts found in r/${targetSubs.join(', ')}.`, 'error');
        setIsLoadingPosts(false);
        setIsLoadingInitialSources(false);
        setIsProcessingData(false);
        return;
      }
      
      console.log(`[fetchInitialData] Received ${targetData.posts.length} target posts`);
      
      // If we used a different sort than requested, inform the user
      if (usedSortMode !== sortMode) {
        toast({
          title: `Using "${usedSortMode}" sorting`,
          description: `"${sortMode}" returned no posts for r/${targetSubs.join(', ')}`,
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
          displayMessage(`Found posts in r/${targetSubs.join(', ')}, but none had replaceable media.`, 'error');
        } else {
          displayMessage(`No media posts found in r/${targetSubs.join(', ')}.`, 'error');
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
  }, [clearMessage, displayMessage, toast]);

  const loadMoreTargetPosts = useCallback(async (sortMode: SortMode, topTimeFilter: TopTimeFilter) => {
    if (isLoadingMore || noMoreTargetPosts || !currentTargetSubredditName || !targetAfter || !isSourceMediaReady) return;
    
    setIsLoadingMore(true);
    try {
      // Split target subreddits by comma for loading more
      const targetSubs = currentTargetSubredditName.split(', ').filter(Boolean);
      
      // Use fetchMultipleSubreddits for consistency
      const data = await fetchMultipleSubreddits(targetSubs, sortMode, topTimeFilter, 15, targetAfter);
      
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
  }, [
    isLoadingMore, 
    noMoreTargetPosts, 
    currentTargetSubredditName, 
    targetAfter, 
    appendPostsToFeed, 
    displayMessage, 
    isSourceMediaReady, 
    allSourceMediaUrls
  ]);

  return {
    // Data
    displayedPosts,
    message,
    messageType,
    queuedTargetPosts,
    targetAfter,
    noMoreTargetPosts,
    currentTargetSubredditName,
    // Loading states
    isLoadingPosts,
    isLoadingMore,
    isProcessingData,
    isSourceMediaReady,
    // Methods
    fetchInitialData,
    loadMoreTargetPosts,
    displayMessage,
    clearMessage,
    setQueuedTargetPosts,
    setDisplayedPosts
  };
}

// Helper function to maintain compatibility with the original code
async function fetchRedditData(subreddit: string, sort: string, timeFilter: string | null = null, limit: number = 25) {
  // Import here to avoid circular dependencies
  const { fetchRedditData } = await import('@/utils/redditApi');
  return fetchRedditData(subreddit, sort, timeFilter, limit);
}
