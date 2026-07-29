export type NewsType = 'workshop' | 'hackathon' | 'guest_lecture' | 'placement_session' | 'general';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: NewsType;
  image_url: string;
  event_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  email: string;
  is_faculty_coordinator: boolean;
  batch_year: string;
  is_current: boolean;
  order: number;
}

export interface PlacementClubMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  email: string;
  batch_year: string;
  is_current: boolean;
  order: number;
}

export interface FeedbackForm {
  id: string;
  news_item_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface FeedbackResponse {
  id: string;
  feedback_form_id: string;
  user_id: string;
  rating: number;
  comment: string;
  submitted_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  is_published: boolean;
}

export interface AboutContent {
  id: string;
  vision: string;
  mission: string;
  objectives: string[];
  structure: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  inquiry_type: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'test_reminder' | 'feedback_reminder' | 'result' | 'general';
  link: string;
  is_read: boolean;
  created_at: string;
}
