export interface Album {
  id: string;
  name: string;
  slug: string;
  cover_url: string | null;
  event_date: string | null;
  event_end_date?: string | null;
  admin_password?: string;
  created_at: string;
  photos_count?: number;
}

export interface Photo {
  id: string;
  album_id: string;
  url: string;
  filename: string | null;
  uploaded_at: string;
  caption?: string | null;
  likes_count?: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
