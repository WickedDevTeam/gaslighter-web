
// Type definitions for our application

export interface RedditPost {
  data: {
    title: string;
    author: string;
    subreddit: string;
    permalink: string;
    score: number;
    post_hint?: string;
    is_video?: boolean;
    is_gallery?: boolean;
    url?: string;
    url_overridden_by_dest?: string;
    domain?: string;
    media?: {
      reddit_video?: {
        fallback_url?: string;
      }
    };
    media_metadata?: Record<string, {
      s?: {
        u?: string;
      };
      p?: Array<{
        x: number;
        u: string;
      }>;
    }>;
    preview?: {
      images?: Array<any>;
    };
  };
}

export interface MediaInfo {
  type: "image" | "video";
  url: string;
  originalPost?: any;
}

export interface RedditResponse {
  posts: RedditPost[];
  after: string | null;
}

export interface PostData {
  targetPostData: {
    title: string;
    author: string;
    subreddit: string;
    permalink: string;
    score: number;
  };
  replacementMedia: MediaInfo | null;
}

export type ViewMode = "list" | "gallery";
export type SortMode = "hot" | "new" | "top";
export type TopTimeFilter = "day" | "week" | "month" | "year" | "all";
