export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_pinned: boolean;
  color: string;
  summary: string | null;
  action_items: ActionItem[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface AIStatus {
  configured: boolean;
  model: string;
  mode: 'live' | 'demo-simulation';
}

export type ToneOption = 'professional' | 'concise' | 'bullet_points' | 'creative' | 'casual';
