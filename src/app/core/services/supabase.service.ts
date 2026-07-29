import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, AuthResponse, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { UserProfile, UserRole, UserRoleRow, Project, Certification, Achievement, Internship } from '../models/user.model';
import { AssessmentTest, Question, TestSubmission, StudentAnswer, DSAProblem, DSAContest, DSASubmission } from '../models/assessment.model';
import { NewsItem, CommitteeMember, PlacementClubMember, FeedbackForm, FeedbackResponse, FAQ, AboutContent, ContactSubmission, Notification } from '../models/content.model';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async logout(): Promise<void> {
    await this.client.auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${environment.appUrl}/auth/set-password`,
    });
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.client.auth.getUser();
    return data.user;
  }

  async getSession() {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  // User Roles
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data } = await this.client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    return (data || []).map((r: any) => r.role as UserRole);
  }

  async setUserRoles(userId: string, roles: UserRole[]): Promise<void> {
    await this.client.from('user_roles').delete().eq('user_id', userId);
    if (roles.length > 0) {
      await this.client.from('user_roles').insert(roles.map(role => ({ user_id: userId, role })));
    }
  }

  // User Profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  }

  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    await this.client.from('user_profiles').update(profile).eq('id', userId);
  }

  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data } = await this.client.storage.from(bucket).upload(path, file, { upsert: true });
    const { data: urlData } = this.client.storage.from(bucket).getPublicUrl(data?.path || path);
    return urlData.publicUrl;
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    await this.client.storage.from(bucket).remove([path]);
  }

  // Projects
  async getProjects(userId: string): Promise<Project[]> {
    const { data } = await this.client.from('projects').select('*').eq('user_id', userId).order('start_date', { ascending: false });
    return data || [];
  }

  async saveProject(project: Partial<Project>): Promise<void> {
    if (project.id) {
      await this.client.from('projects').update(project).eq('id', project.id);
    } else {
      await this.client.from('projects').insert(project);
    }
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.from('projects').delete().eq('id', id);
  }

  // Certifications
  async getCertifications(userId: string): Promise<Certification[]> {
    const { data } = await this.client.from('certifications').select('*').eq('user_id', userId).order('issue_date', { ascending: false });
    return data || [];
  }

  async saveCertification(cert: Partial<Certification>): Promise<void> {
    if (cert.id) {
      await this.client.from('certifications').update(cert).eq('id', cert.id);
    } else {
      await this.client.from('certifications').insert(cert);
    }
  }

  async deleteCertification(id: string): Promise<void> {
    await this.client.from('certifications').delete().eq('id', id);
  }

  // Achievements
  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data } = await this.client.from('achievements').select('*').eq('user_id', userId).order('date', { ascending: false });
    return data || [];
  }

  async saveAchievement(achievement: Partial<Achievement>): Promise<void> {
    if (achievement.id) {
      await this.client.from('achievements').update(achievement).eq('id', achievement.id);
    } else {
      await this.client.from('achievements').insert(achievement);
    }
  }

  async deleteAchievement(id: string): Promise<void> {
    await this.client.from('achievements').delete().eq('id', id);
  }

  // Internships
  async getInternships(userId: string): Promise<Internship[]> {
    const { data } = await this.client.from('internships').select('*').eq('user_id', userId).order('start_date', { ascending: false });
    return data || [];
  }

  async saveInternship(internship: Partial<Internship>): Promise<void> {
    if (internship.id) {
      await this.client.from('internships').update(internship).eq('id', internship.id);
    } else {
      await this.client.from('internships').insert(internship);
    }
  }

  async deleteInternship(id: string): Promise<void> {
    await this.client.from('internships').delete().eq('id', id);
  }

  // Assessments
  async getTests(): Promise<AssessmentTest[]> {
    const { data } = await this.client.from('assessment_tests').select('*').order('start_time', { ascending: false });
    return data || [];
  }

  async getTest(id: string): Promise<AssessmentTest | null> {
    const { data } = await this.client.from('assessment_tests').select('*').eq('id', id).single();
    return data;
  }

  async saveTest(test: Partial<AssessmentTest>): Promise<void> {
    if (test.id) {
      await this.client.from('assessment_tests').update(test).eq('id', test.id);
    } else {
      await this.client.from('assessment_tests').insert(test);
    }
  }

  async deleteTest(id: string): Promise<void> {
    await this.client.from('assessment_tests').delete().eq('id', id);
  }

  async getQuestions(testId: string): Promise<Question[]> {
    const { data } = await this.client.from('questions').select('*').eq('test_id', testId).order('order');
    return data || [];
  }

  async saveQuestion(question: Partial<Question>): Promise<void> {
    if (question.id) {
      await this.client.from('questions').update(question).eq('id', question.id);
    } else {
      await this.client.from('questions').insert(question);
    }
  }

  async deleteQuestion(id: string): Promise<void> {
    await this.client.from('questions').delete().eq('id', id);
  }

  async submitTest(submission: Partial<TestSubmission>, answers: Partial<StudentAnswer>[]): Promise<void> {
    const { data: sub } = await this.client.from('test_submissions').insert(submission).select('id').single();
    if (sub && answers.length > 0) {
      await this.client.from('student_answers').insert(answers.map(a => ({ ...a, submission_id: sub.id })));
    }
  }

  async getTestSubmissions(testId: string): Promise<TestSubmission[]> {
    const { data } = await this.client.from('test_submissions').select('*').eq('test_id', testId);
    return data || [];
  }

  // DSA
  async getDSAContests(): Promise<DSAContest[]> {
    const { data } = await this.client.from('dsa_contests').select('*').order('start_time', { ascending: false });
    return data || [];
  }

  async getDSAContest(id: string): Promise<DSAContest | null> {
    const { data } = await this.client.from('dsa_contests').select('*, dsa_problems(*)').eq('id', id).single();
    return data;
  }

  async saveDSAContest(contest: Partial<DSAContest>): Promise<void> {
    if (contest.id) {
      await this.client.from('dsa_contests').update(contest).eq('id', contest.id);
    } else {
      await this.client.from('dsa_contests').insert(contest);
    }
  }

  async getDSAProblems(contestId: string): Promise<DSAProblem[]> {
    const { data } = await this.client.from('dsa_problems').select('*').eq('contest_id', contestId).order('order');
    return data || [];
  }

  async saveDSAProblem(problem: Partial<DSAProblem>): Promise<void> {
    if (problem.id) {
      await this.client.from('dsa_problems').update(problem).eq('id', problem.id);
    } else {
      await this.client.from('dsa_problems').insert(problem);
    }
  }

  async submitDSACode(submission: Partial<DSASubmission>): Promise<void> {
    await this.client.from('dsa_submissions').insert(submission);
  }

  async getDSASubmissions(contestId: string, problemId?: string): Promise<DSASubmission[]> {
    let query = this.client.from('dsa_submissions').select('*, user_profiles!inner(name, prn)').eq('contest_id', contestId);
    if (problemId) query = query.eq('problem_id', problemId);
    const { data } = await query;
    return data || [];
  }

  async gradeDSASubmission(id: string, score: number, remarks: string, gradedBy: string): Promise<void> {
    await this.client.from('dsa_submissions').update({ score, remarks, is_graded: true, graded_by: gradedBy, graded_at: new Date().toISOString() }).eq('id', id);
  }

  // News
  async getNews(): Promise<NewsItem[]> {
    const { data } = await this.client.from('news').select('*').order('event_date', { ascending: false });
    return data || [];
  }

  async saveNews(news: Partial<NewsItem>): Promise<void> {
    if (news.id) {
      await this.client.from('news').update(news).eq('id', news.id);
    } else {
      await this.client.from('news').insert(news);
    }
  }

  async deleteNews(id: string): Promise<void> {
    await this.client.from('news').delete().eq('id', id);
  }

  // Committee
  async getCommitteeMembers(current?: boolean): Promise<CommitteeMember[]> {
    let query = this.client.from('committee_members').select('*').order('order');
    if (current !== undefined) query = query.eq('is_current', current);
    const { data } = await query;
    return data || [];
  }

  async saveCommitteeMember(member: Partial<CommitteeMember>): Promise<void> {
    if (member.id) {
      await this.client.from('committee_members').update(member).eq('id', member.id);
    } else {
      await this.client.from('committee_members').insert(member);
    }
  }

  async deleteCommitteeMember(id: string): Promise<void> {
    await this.client.from('committee_members').delete().eq('id', id);
  }

  // Placement Club
  async getPlacementClubMembers(current?: boolean): Promise<PlacementClubMember[]> {
    let query = this.client.from('placement_club_members').select('*').order('order');
    if (current !== undefined) query = query.eq('is_current', current);
    const { data } = await query;
    return data || [];
  }

  async savePlacementClubMember(member: Partial<PlacementClubMember>): Promise<void> {
    if (member.id) {
      await this.client.from('placement_club_members').update(member).eq('id', member.id);
    } else {
      await this.client.from('placement_club_members').insert(member);
    }
  }

  async deletePlacementClubMember(id: string): Promise<void> {
    await this.client.from('placement_club_members').delete().eq('id', id);
  }

  // Feedback
  async getFeedbackForms(): Promise<FeedbackForm[]> {
    const { data } = await this.client.from('feedback_forms').select('*, news(title)').order('start_time', { ascending: false });
    return data || [];
  }

  async saveFeedbackForm(form: Partial<FeedbackForm>): Promise<void> {
    if (form.id) {
      await this.client.from('feedback_forms').update(form).eq('id', form.id);
    } else {
      await this.client.from('feedback_forms').insert(form);
    }
  }

  async submitFeedback(response: Partial<FeedbackResponse>): Promise<void> {
    await this.client.from('feedback_responses').insert(response);
  }

  async getFeedbackResponses(formId: string): Promise<FeedbackResponse[]> {
    const { data } = await this.client.from('feedback_responses').select('*, user_profiles!inner(name, prn)').eq('feedback_form_id', formId);
    return data || [];
  }

  // FAQ
  async getFAQs(): Promise<FAQ[]> {
    const { data } = await this.client.from('faqs').select('*').eq('is_published', true).order('order');
    return data || [];
  }

  async saveFAQ(faq: Partial<FAQ>): Promise<void> {
    if (faq.id) {
      await this.client.from('faqs').update(faq).eq('id', faq.id);
    } else {
      await this.client.from('faqs').insert(faq);
    }
  }

  async deleteFAQ(id: string): Promise<void> {
    await this.client.from('faqs').delete().eq('id', id);
  }

  // About
  async getAboutContent(): Promise<AboutContent | null> {
    const { data } = await this.client.from('about_content').select('*').single();
    return data;
  }

  async saveAboutContent(content: Partial<AboutContent>): Promise<void> {
    if (content.id) {
      await this.client.from('about_content').update(content).eq('id', content.id);
    } else {
      await this.client.from('about_content').insert(content);
    }
  }

  // Contact
  async submitContact(form: Partial<ContactSubmission>): Promise<void> {
    await this.client.from('contact_submissions').insert(form);
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    const { data } = await this.client.from('contact_submissions').select('*').order('created_at', { ascending: false });
    return data || [];
  }

  async markContactRead(id: string): Promise<void> {
    await this.client.from('contact_submissions').update({ is_read: true }).eq('id', id);
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data } = await this.client.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    return data || [];
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.client.from('notifications').update({ is_read: true }).eq('id', id);
  }

  async createNotification(notification: Partial<Notification>): Promise<void> {
    await this.client.from('notifications').insert(notification);
  }

  // Realtime subscriptions
  subscribeToTable(table: string, callback: (payload: any) => void) {
    return this.client
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }

  // Search
  async search(query: string): Promise<{ students: any[]; news: any[]; committee: any[] }> {
    const [students, news, committee] = await Promise.all([
      this.client.from('user_profiles').select('id, name, prn, class, batch').ilike('name', `%${query}%`).limit(10).then(r => r.data || []),
      this.client.from('news').select('id, title, type').ilike('title', `%${query}%`).limit(10).then(r => r.data || []),
      this.client.from('committee_members').select('id, name, role').ilike('name', `%${query}%`).limit(10).then(r => r.data || []),
    ]);
    return { students, news, committee };
  }

  // Invite user (triggers edge function)
  async inviteUser(email: string, roles: UserRole[]): Promise<void> {
    const session = await this.getSession();
    const response = await fetch(
      `${environment.supabaseUrl}/functions/v1/invite-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email, roles }),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to invite user');
    }
  }

  // Send email (triggers edge function)
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const session = await this.getSession();
    await fetch(
      `${environment.supabaseUrl}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ to, subject, html }),
      }
    );
  }
}
