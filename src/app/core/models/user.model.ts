export type UserRole = 'Student' | 'Committee' | 'Placement Club' | 'Faculty' | 'Admin';

export const ALL_ROLES: UserRole[] = ['Student', 'Committee', 'Placement Club', 'Faculty', 'Admin'];

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  prn: string;
  class: string;
  division: string;
  batch: string;
  photo_url: string;
  bio: string;
  skills: string[];
  resume_url: string;
  github_url: string;
  linkedin_url: string;
  leetcode_url: string;
  codechef_url: string;
  hackerrank_url: string;
  portfolio_url: string;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  user_id: string;
  role: UserRole;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  technologies: string[];
  url: string;
  start_date: string;
  end_date: string;
}

export interface Certification {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  credential_url: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  date: string;
}

export interface Internship {
  id: string;
  user_id: string;
  company: string;
  role: string;
  description: string;
  start_date: string;
  end_date: string;
}
