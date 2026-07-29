import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { StatCounterComponent } from '../../shared/components/stat-counter/stat-counter.component';

interface ParticipationData {
  testTitle: string;
  totalStudents: number;
  participants: number;
  rate: number;
}

interface TopicScore {
  topic: string;
  avgScore: number;
  maxScore: number;
}

interface ScoreTrend {
  testTitle: string;
  avgScore: number;
}

@Component({
  selector: 'app-reports-analytics',
  standalone: true,
  imports: [CommonModule, StatCounterComponent],
  templateUrl: './reports-analytics.component.html',
  styleUrls: ['./reports-analytics.component.scss'],
})
export class ReportsAnalyticsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  totalUsers = 0;
  totalTests = 0;
  totalFeedback = 0;
  totalNews = 0;

  participationData: ParticipationData[] = [];
  scoreTrends: ScoreTrend[] = [];
  topicScores: TopicScore[] = [];

  async ngOnInit(): Promise<void> {
    await this.loadAggregates();
    await this.loadParticipation();
    await this.loadScoreTrends();
    await this.loadTopicScores();
  }

  private async loadAggregates(): Promise<void> {
    const [userCount, testCount, newsCount] = await Promise.all([
      this.supabase.supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      this.supabase.supabase.from('assessment_tests').select('id', { count: 'exact', head: true }),
      this.supabase.supabase.from('news').select('id', { count: 'exact', head: true }),
    ]);

    this.totalUsers = userCount.count ?? 0;
    this.totalTests = testCount.count ?? 0;
    this.totalNews = newsCount.count ?? 0;

    const feedbackCount = await this.supabase.supabase.from('feedback_responses').select('id', { count: 'exact', head: true });
    this.totalFeedback = feedbackCount.count ?? 0;
  }

  private async loadParticipation(): Promise<void> {
    const tests = await this.supabase.getTests();
    const publishedTests = tests.filter(t => t.is_published);

    const totalProfiles = await this.supabase.supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true });
    const totalStudents = totalProfiles.count ?? 1;

    for (const test of publishedTests) {
      const submissions = await this.supabase.getTestSubmissions(test.id);
      this.participationData.push({
        testTitle: test.title,
        totalStudents,
        participants: submissions.length,
        rate: totalStudents > 0 ? Math.round((submissions.length / totalStudents) * 100) : 0,
      });
    }
  }

  private async loadScoreTrends(): Promise<void> {
    const tests = await this.supabase.getTests();
    const publishedTests = tests.filter(t => t.is_published);

    for (const test of publishedTests) {
      const submissions = await this.supabase.getTestSubmissions(test.id);
      if (submissions.length === 0) continue;
      const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
      this.scoreTrends.push({
        testTitle: test.title,
        avgScore: Math.round((totalScore / submissions.length) * 100) / 100,
      });
    }
  }

  private async loadTopicScores(): Promise<void> {
    const tests = await this.supabase.getTests();
    const topicMap = new Map<string, { total: number; count: number; maxPoints: number }>();

    for (const test of tests) {
      const questions = await this.supabase.getQuestions(test.id);
      for (const q of questions) {
        if (!q.topic_tag) continue;
        const entry = topicMap.get(q.topic_tag) || { total: 0, count: 0, maxPoints: q.points };
        topicMap.set(q.topic_tag, entry);
      }
    }

    for (const test of tests) {
      const submissions = await this.supabase.getTestSubmissions(test.id);
      if (submissions.length === 0) continue;
    }

    this.topicScores = Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      avgScore: data.count > 0 ? Math.round((data.total / data.count) * 100) / 100 : 0,
      maxScore: data.maxPoints,
    }));
  }

  get maxParticipationRate(): number {
    return Math.max(...this.participationData.map(d => d.rate), 1);
  }

  get maxScoreTrend(): number {
    return Math.max(...this.scoreTrends.map(d => d.avgScore), 1);
  }

  get maxTopicScore(): number {
    return Math.max(...this.topicScores.map(d => d.avgScore), 1);
  }
}
