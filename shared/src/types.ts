// AUPA AB — shared types
// Mirror of supabase/migrations schema (brief §4.1)

export type ArticleCategory =
  | 'match'
  | 'mercato'
  | 'coulisses'
  | 'espoirs'
  | 'pays_basque'
  | 'autre';

export type UserRole = 'member' | 'contributor' | 'moderator' | 'admin';

export type CommentStatus = 'published' | 'pending' | 'hidden' | 'removed';

export type ReportReason = 'spam' | 'hate' | 'harassment' | 'off_topic' | 'other';

export type ReportStatus = 'pending' | 'reviewed_kept' | 'reviewed_removed';

export type ModerationAction =
  | 'comment_approved'
  | 'comment_removed'
  | 'comment_hidden'
  | 'user_warned'
  | 'user_banned'
  | 'user_unbanned';

export interface Source {
  id: string;
  slug: string;
  name: string;
  domain: string;
  feed_url: string;
  logo_url: string | null;
  is_active: boolean;
  fetch_interval: number;
  last_fetched_at: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  source_id: string;
  source_url: string;
  excerpt: string;
  author: string | null;
  published_at: string;
  fetched_at: string;
  category: ArticleCategory;
  tags: string[];
  reading_time_sec: number | null;
  cover_image_url: string | null;
  view_count: number;
  comment_count: number;
  is_published: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleWithSource extends Article {
  source: Pick<Source, 'name' | 'slug' | 'domain' | 'logo_url'>;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  supporter_since: number | null;
  favorite_player: string | null;
  role: UserRole;
  is_banned: boolean;
  banned_until: string | null;
  ban_reason: string | null;
  email_notifications: {
    on_reply: boolean;
    on_mention: boolean;
    on_like: boolean;
    weekly_digest: boolean;
  };
  comment_count: number;
  badges: string[];
  created_at: string;
  last_seen_at: string | null;
}

export interface Comment {
  id: string;
  article_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  body_rendered: string;
  is_edited: boolean;
  edited_at: string | null;
  status: CommentStatus;
  is_pinned: boolean;
  like_count: number;
  report_count: number;
  ai_toxicity_score: number | null;
  ai_flags: Record<string, number> | null;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<Profile, 'username' | 'display_name' | 'avatar_url' | 'role'>;
  replies?: CommentWithAuthor[];
  liked_by_me?: boolean;
}

export interface CommentReport {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// API response shape — brief §7.7
export interface ApiResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  meta?: {
    cursor?: string;
    has_more?: boolean;
    total?: number;
  };
}

// Moderation IA output — brief §8.3
export interface ModerationResult {
  toxicity: number;
  hate: number;
  harassment: number;
  spam: number;
  profanity: number;
  threat: number;
  reason: string;
}
