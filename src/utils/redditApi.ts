
import { MediaInfo, RedditPost, RedditResponse } from '@/types';

/**
 * Fetches data from Reddit API
 */
export async function fetchRedditData(
  subreddit: string,
  sort: string,
  timeFilter: string | null = null,
  limit: number = 25,
  afterToken: string | null = null
): Promise<RedditResponse> {
  let url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`;
  if (sort === 'top' && timeFilter) url += `&t=${timeFilter}`;
  if (afterToken) url += `&after=${afterToken}`;

  const response = await fetch(url, { cache: 'no-store' });
  
  if (!response.ok) {
    if (response.status === 404) throw new Error(`Subreddit r/${subreddit} not found.`);
    if (response.status === 403) throw new Error(`Subreddit r/${subreddit} is private/quarantined.`);
    if (response.status === 429) throw new Error(`Too many requests. Please wait.`);
    throw new Error(`Failed to fetch r/${subreddit}: ${response.status}`);
  }

  const jsonData = await response.json();
  if (!jsonData.data || !jsonData.data.children) {
    throw new Error(`Invalid data from r/${subreddit}.`);
  }

  return { 
    posts: jsonData.data.children,
    after: jsonData.data.after 
  };
}

/**
 * Fetches subreddit suggestions for autocomplete
 */
export async function fetchSubredditSuggestions(query: string): Promise<Array<{name: string}>> {
  if (!query || query.length < 2) return [];
  
  try {
    // Mock data for common subreddits to reduce API calls and avoid CORS issues
    const mockSuggestions: Record<string, string[]> = {
      'p': ['pics', 'programming', 'politics', 'philosophy', 'pcmasterrace', 'photography'],
      'ga': ['gaming', 'gardening', 'gameofthrones', 'games'],
      'te': ['technology', 'television', 'techsupport', 'teslamotors'],
      'co': ['cooking', 'comics', 'conservative', 'combinedgifs', 'cordcutters'],
      'fu': ['funny', 'futurology', 'funnyandsad', 'fullmoviesonyoutube'],
      'sc': ['science', 'scifi', 'scottishpeopletwitter', 'scenesfromahat'],
      'mo': ['movies', 'morbidreality', 'modernwarfare', 'monkeyspaw'],
      'me': ['memes', 'memeeconomy', 'me_irl', 'medicine', 'mechanicalkeyboards']
    };
    
    // Check if we have mock data for this query
    const lowerQuery = query.toLowerCase();
    for (const [prefix, subreddits] of Object.entries(mockSuggestions)) {
      if (lowerQuery.startsWith(prefix)) {
        return subreddits
          .filter(name => name.toLowerCase().includes(lowerQuery))
          .map(name => ({ name }));
      }
    }
    
    // If no mock data or not a match, try the API with proper error handling
    const url = `https://www.reddit.com/api/search_reddit_names.json?query=${encodeURIComponent(query)}&exact=false&include_over_18=true`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(url, { 
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return [];
    
    const jsonData = await response.json();
    return (jsonData && Array.isArray(jsonData.names)) 
      ? jsonData.names.map((name: string) => ({ name }))
      : [];
  } catch (error) {
    console.error('Failed to fetch subreddit suggestions:', error);
    return [];
  }
}

/**
 * Extracts media URLs from Reddit posts
 */
export function extractMediaUrls(posts: RedditPost[]): MediaInfo[] {
  const media: MediaInfo[] = [];
  if (!Array.isArray(posts)) return media;
  
  posts.forEach(post => {
    try {
      const pData = post.data;
      if (!pData) return;

      // 1. Handle Reddit Galleries (is_gallery: true)
      if (pData.is_gallery && pData.media_metadata) {
        const galleryImageIds = Object.keys(pData.media_metadata);
        if (galleryImageIds.length > 0) {
          const firstImageId = galleryImageIds[0];
          const meta = pData.media_metadata[firstImageId];
          
          // Try to get the direct image URL (s.u)
          if (meta && meta.s && meta.s.u) { 
            media.push({ 
              type: 'image', 
              url: meta.s.u.replace(/&amp;/g, '&'), 
              originalPost: pData 
            });
            return; // Move to next post after successful extraction
          } 
          // Fallback to processed preview images (p)
          else if (meta && meta.p && meta.p.length > 0) { 
            // Sort previews by width (largest first) and take the URL of the largest
            const largestPreview = meta.p.sort((a, b) => b.x - a.x)[0]; 
            if (largestPreview && largestPreview.u) {
              media.push({ 
                type: 'image', 
                url: largestPreview.u.replace(/&amp;/g, '&'), 
                originalPost: pData 
              });
              return; // Move to next post after successful extraction
            }
          }
        }
      }
      // 2. Handle Reddit-hosted videos
      else if (pData.is_video && pData.media?.reddit_video?.fallback_url) {
        media.push({ 
          type: 'video', 
          url: pData.media.reddit_video.fallback_url.split('?')[0], 
          originalPost: pData 
        });
      } 
      // 3. Handle direct image links (jpg, jpeg, png, gif)
      else if (
        pData.url_overridden_by_dest && 
        /\.(jpg|jpeg|png|gif)$/i.test(pData.url_overridden_by_dest) && 
        (pData.post_hint === 'image' || pData.domain === 'i.redd.it' || pData.domain === 'i.imgur.com')
      ) {
        media.push({ 
          type: 'image', 
          url: pData.url_overridden_by_dest, 
          originalPost: pData 
        });
      } 
      // 4. Handle Imgur .gifv links (convert to .mp4)
      else if (
        pData.url_overridden_by_dest?.endsWith('.gifv') && 
        pData.domain === 'i.imgur.com'
      ) {
        media.push({ 
          type: 'video', 
          url: pData.url_overridden_by_dest.replace(/\.gifv$/i, '.mp4'), 
          originalPost: pData 
        });
      }
    } catch (error) {
      console.error('Error processing post:', error);
      // Continue to the next post if there's an error
    }
  });
  
  return media;
}
