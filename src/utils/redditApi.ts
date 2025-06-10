
import { MediaInfo, RedditPost, RedditResponse } from '@/types';

/**
 * Fetches data from Reddit API with CORS workaround and retry mechanism
 */
export async function fetchRedditData(
  subreddit: string,
  sort: string,
  timeFilter: string | null = null,
  limit: number = 25,
  afterToken: string | null = null
): Promise<RedditResponse> {
  const maxRetries = 2;
  let retries = 0;
  let lastError: Error | null = null;

  while (retries <= maxRetries) {
    try {
      // Use a CORS proxy service for Reddit API access
      let baseUrl = `https://api.allorigins.win/get?url=`;
      let redditUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`;
      
      if (sort === 'top' && timeFilter) {
        redditUrl += `&t=${timeFilter}`;
      }
      if (afterToken) {
        redditUrl += `&after=${afterToken}`;
      }
      
      // Add timestamp to prevent caching
      redditUrl += `&_=${Date.now()}`;
      
      const fullUrl = baseUrl + encodeURIComponent(redditUrl);
      
      console.log(`[Reddit API] Fetching r/${subreddit} (attempt ${retries + 1})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(fullUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) throw new Error(`Subreddit r/${subreddit} not found.`);
        if (response.status === 403) throw new Error(`Subreddit r/${subreddit} is private/quarantined.`);
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (retries + 1)));
          throw new Error(`Rate limited. Retrying...`);
        }
        throw new Error(`Failed to fetch r/${subreddit}: ${response.status}`);
      }

      const proxyData = await response.json();
      
      // Parse the contents from the CORS proxy
      let jsonData;
      try {
        jsonData = JSON.parse(proxyData.contents);
      } catch (parseError) {
        throw new Error(`Invalid response format from r/${subreddit}`);
      }
      
      if (!jsonData.data || !jsonData.data.children) {
        throw new Error(`No data available from r/${subreddit}.`);
      }

      console.log(`[Reddit API] Successfully fetched ${jsonData.data.children.length} posts from r/${subreddit}`);

      return { 
        posts: jsonData.data.children,
        after: jsonData.data.after 
      };
    } catch (error: any) {
      lastError = error;
      
      // If it's an AbortError (timeout), log and retry
      if (error.name === 'AbortError') {
        console.log(`[Reddit API] Request timeout for r/${subreddit}, retry ${retries + 1}/${maxRetries}`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // If it's a rate limit error, retry with exponential backoff
      if (error.message.includes('Rate limited')) {
        retries++;
        continue;
      }
      
      // If it's a network error, retry
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      
      // For other errors, throw immediately
      console.error(`[Reddit API] Error fetching r/${subreddit}:`, error);
      throw error;
    }
  }
  
  // If we've exhausted retries, throw the last error
  throw lastError || new Error(`Failed to fetch r/${subreddit} after ${maxRetries} retries.`);
}

/**
 * Fetches subreddit suggestions for autocomplete
 */
export async function fetchSubredditSuggestions(query: string): Promise<Array<{name: string}>> {
  if (!query || query.length < 2) return [];
  
  try {
    // Expanded mock data for better coverage
    const mockSuggestions: Record<string, string[]> = {
      'p': ['pics', 'programming', 'politics', 'philosophy', 'pcmasterrace', 'photography', 'personalfinance', 'pokemon'],
      'ga': ['gaming', 'gardening', 'gameofthrones', 'games', 'gadgets'],
      'te': ['technology', 'television', 'techsupport', 'teslamotors', 'teenagers'],
      'co': ['cooking', 'comics', 'conservative', 'combinedgifs', 'cordcutters', 'cats'],
      'fu': ['funny', 'futurology', 'funnyandsad', 'fullmoviesonyoutube'],
      'sc': ['science', 'scifi', 'scottishpeopletwitter', 'scenesfromahat'],
      'mo': ['movies', 'morbidreality', 'modernwarfare', 'monkeyspaw', 'memes'],
      'me': ['memes', 'memeeconomy', 'me_irl', 'medicine', 'mechanicalkeyboards'],
      'a': ['askreddit', 'art', 'aww', 'anime', 'australia'],
      'w': ['worldnews', 'wtf', 'wallpapers', 'wholesomememes'],
      'n': ['news', 'natureisfuckinglit', 'nba'],
      'd': ['dankmemes', 'diy', 'dogs'],
      'r': ['reddit', 'relationshipadvice', 'roastme'],
      'i': ['interestingasfuck', 'iamverysmart', 'itookapicture'],
      'l': ['lifeprotips', 'leagueoflegends', 'legaladvice'],
      'o': ['oddlysatisfying', 'oldschoolcool', 'outoftheloop'],
      'e': ['earthporn', 'explainlikeimfive', 'entertainment'],
      'b': ['blackpeopletwitter', 'books', 'bestof', 'birdsarentreal'],
      'h': ['historyporn', 'humansbeingbros', 'holdmybeer'],
      's': ['showerthoughts', 'space', 'soccer', 'starterpacks'],
      'v': ['videos', 'vinyl', 'vegan'],
      'u': ['upliftingnews', 'unpopularopinion', 'users'],
      'f': ['food', 'facepalm', 'fireemblem', 'fitness'],
      'j': ['jokes', 'justiceserved', 'jailbreak'],
      'k': ['karmaroulette', 'kerbalspaceprogram'],
      'q': ['quityourbullshit', 'quotes'],
      'x': ['xbox', 'xboxone'],
      'y': ['youtube', 'youseeingthisshit'],
      'z': ['zoomies', 'zelda']
    };
    
    // Check if we have mock data for this query
    const lowerQuery = query.toLowerCase();
    for (const [prefix, subreddits] of Object.entries(mockSuggestions)) {
      if (lowerQuery.startsWith(prefix)) {
        return subreddits
          .filter(name => name.toLowerCase().includes(lowerQuery))
          .slice(0, 10) // Limit to 10 suggestions
          .map(name => ({ name }));
      }
    }
    
    // Return popular defaults if no specific match
    const popularDefaults = ['pics', 'funny', 'aww', 'memes', 'gaming', 'videos', 'art', 'earthporn'];
    return popularDefaults
      .filter(name => name.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map(name => ({ name }));
    
  } catch (error) {
    console.error('Failed to fetch subreddit suggestions:', error);
    return [];
  }
}

/**
 * Enhanced media extraction from Reddit posts
 */
export function extractMediaUrls(posts: RedditPost[]): MediaInfo[] {
  const media: MediaInfo[] = [];
  if (!Array.isArray(posts)) return media;
  
  console.log(`[Media Extraction] Processing ${posts.length} posts`);
  
  posts.forEach((post, index) => {
    try {
      const pData = post.data;
      if (!pData) return;

      let mediaFound = false;

      // 1. Handle Reddit Galleries (is_gallery: true)
      if (pData.is_gallery && pData.media_metadata) {
        const galleryImageIds = Object.keys(pData.media_metadata);
        if (galleryImageIds.length > 0) {
          const firstImageId = galleryImageIds[0];
          const meta = pData.media_metadata[firstImageId];
          
          if (meta && meta.s && meta.s.u) { 
            media.push({ 
              type: 'image', 
              url: meta.s.u.replace(/&amp;/g, '&'), 
              originalPost: pData 
            });
            mediaFound = true;
          } 
          else if (meta && meta.p && meta.p.length > 0) { 
            const largestPreview = meta.p.sort((a, b) => b.x - a.x)[0]; 
            if (largestPreview && largestPreview.u) {
              media.push({ 
                type: 'image', 
                url: largestPreview.u.replace(/&amp;/g, '&'), 
                originalPost: pData 
              });
              mediaFound = true;
            }
          }
        }
      }
      
      // 2. Handle Reddit-hosted videos
      if (!mediaFound && pData.is_video && pData.media?.reddit_video?.fallback_url) {
        media.push({ 
          type: 'video', 
          url: pData.media.reddit_video.fallback_url.split('?')[0], 
          originalPost: pData 
        });
        mediaFound = true;
      } 
      
      // 3. Handle direct image links (more permissive)
      if (!mediaFound && pData.url_overridden_by_dest) {
        const url = pData.url_overridden_by_dest;
        
        // Check for image extensions or known image domains
        if (
          /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || 
          url.includes('i.redd.it') || 
          url.includes('i.imgur.com') ||
          pData.post_hint === 'image'
        ) {
          media.push({ 
            type: 'image', 
            url: url, 
            originalPost: pData 
          });
          mediaFound = true;
        }
        // Handle .gifv links (convert to .mp4)
        else if (url.endsWith('.gifv')) {
          media.push({ 
            type: 'video', 
            url: url.replace(/\.gifv$/i, '.mp4'), 
            originalPost: pData 
          });
          mediaFound = true;
        }
      }

      // 4. Fallback: Check preview images for any post with preview data
      if (!mediaFound && pData.preview && pData.preview.images && pData.preview.images.length > 0) {
        const preview = pData.preview.images[0];
        if (preview.source && preview.source.url) {
          media.push({ 
            type: 'image', 
            url: preview.source.url.replace(/&amp;/g, '&'), 
            originalPost: pData 
          });
          mediaFound = true;
        }
      }
      
      if (mediaFound) {
        console.log(`[Media Extraction] Found media in post ${index + 1}: ${pData.title?.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error(`[Media Extraction] Error processing post ${index}:`, error);
    }
  });
  
  console.log(`[Media Extraction] Extracted ${media.length} media items from ${posts.length} posts`);
  return media;
}
