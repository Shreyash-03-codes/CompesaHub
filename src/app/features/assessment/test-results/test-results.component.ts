import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AssessmentTest, TestSubmission, Question, StudentAnswer } from '../../../core/models/assessment.model';

interface TopicBreakdown {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

interface LeaderboardEntry {
  name: string;
  prn: string;
  score: number;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-test-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './test-results.component.html',
  styleUrls: ['./test-results.component.scss'],
})
export class TestResultsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);

  test: AssessmentTest | null = null;
  submission: TestSubmission | null = null;
  answers: StudentAnswer[] = [];
  questions: Question[] = [];
  topicBreakdown: TopicBreakdown[] = [];
  leaderboard: LeaderboardEntry[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadResults();
  }

  get percentage(): number {
    if (!this.submission || this.submission.total === 0) return 0;
    return Math.round((this.submission.score / this.submission.total) * 100);
  }

  get correctCount(): number {
    return this.answers.filter(a => a.is_correct).length;
  }

  get incorrectCount(): number {
    return this.answers.filter(a => !a.is_correct).length;
  }

  get totalPoints(): number {
    return this.questions.reduce((s, q) => s + q.points, 0);
  }

  private async loadResults(): Promise<void> {
    const testId = this.route.snapshot.paramMap.get('id');
    if (!testId) return;
    try {
      this.test = await this.supabase.getTest(testId);
      this.questions = await this.supabase.getQuestions(testId);
      const user = await this.supabase.getCurrentUser();
      if (user) {
        const submissions = await this.supabase.getTestSubmissions(testId);
        this.submission = submissions.find(s => s.user_id === user.id) || null;
      }
      this.buildTopicBreakdown();
      await this.buildLeaderboard(testId);
    } catch (err) {
      console.error('Failed to load results', err);
    } finally {
      this.loading = false;
    }
  }

  private buildTopicBreakdown(): void {
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const q of this.questions) {
      const entry = topicMap.get(q.topic_tag) || { correct: 0, total: 0 };
      entry.total += q.points;
      const ans = this.answers.find(a => a.question_id === q.id);
      if (ans?.is_correct) entry.correct += q.points;
      topicMap.set(q.topic_tag, entry);
    }
    this.topicBreakdown = Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));
  }

  private async buildLeaderboard(testId: string): Promise<void> {
    const submissions = await this.supabase.getTestSubmissions(testId);
    const sorted = submissions
      .filter(s => s.total > 0)
      .sort((a, b) => b.score - a.score || a.submitted_at.localeCompare(b.submitted_at))
      .slice(0, 20);
    this.leaderboard = [];
    for (const s of sorted) {
      const profile = await this.supabase.getProfile(s.user_id);
      this.leaderboard.push({
        name: profile?.name || 'Unknown',
        prn: profile?.prn || '',
        score: s.score,
        total: s.total,
        percentage: Math.round((s.score / s.total) * 100),
      });
    }
  }
}