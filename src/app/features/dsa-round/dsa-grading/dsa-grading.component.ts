import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DSAContest, DSAProblem, DSASubmission } from '../../../core/models/assessment.model';
import * as monaco from 'monaco-editor';

interface GradingView {
  contest: DSAContest;
  problems: DSAProblem[];
  selectedProblem: DSAProblem | null;
  submissions: DSASubmission[];
  selectedSubmission: DSASubmission | null;
  scoreInput: number;
  remarksInput: string;
  saving: boolean;
}

interface StudentTotal {
  userId: string;
  name: string;
  prn: string;
  totalScore: number;
  maxScore: number;
}

@Component({
  selector: 'app-dsa-grading',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  templateUrl: './dsa-grading.component.html',
  styleUrls: ['./dsa-grading.component.scss'],
})
export class DsaGradingComponent implements OnInit, OnDestroy, AfterViewInit {
  private supabase = inject(SupabaseService);

  @ViewChild('codeViewer', { static: false }) codeViewerRef!: ElementRef;

  contests: DSAContest[] = [];
  selectedContestId = '';
  gradingViews: Map<string, GradingView> = new Map();
  activeView: GradingView | null = null;
  studentTotals: StudentTotal[] = [];
  loading = true;

  private editor: monaco.editor.IStandaloneCodeEditor | null = null;
  private subscriptions: any[] = [];

  ngOnInit(): void {
    this.loadContests();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initEditor(), 200);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    for (const sub of this.subscriptions) {
      sub.unsubscribe();
    }
  }

  private async loadContests(): Promise<void> {
    try {
      this.contests = await this.supabase.getDSAContests();
    } catch (err) {
      console.error('Failed to load contests', err);
    } finally {
      this.loading = false;
    }
  }

  async selectContest(contestId: string): Promise<void> {
    this.selectedContestId = contestId;
    if (this.gradingViews.has(contestId)) {
      this.activeView = this.gradingViews.get(contestId)!;
      this.updateStudentTotals();
      this.setupRealtime();
      return;
    }

    const contest = this.contests.find(c => c.id === contestId);
    if (!contest) return;

    const problems = await this.supabase.getDSAProblems(contestId);
    const view: GradingView = {
      contest,
      problems,
      selectedProblem: problems.length > 0 ? problems[0] : null,
      submissions: [],
      selectedSubmission: null,
      scoreInput: 0,
      remarksInput: '',
      saving: false,
    };
    this.gradingViews.set(contestId, view);
    this.activeView = view;
    await this.loadSubmissions();
    this.updateStudentTotals();
    this.setupRealtime();
  }

  async selectProblem(problem: DSAProblem): Promise<void> {
    if (!this.activeView) return;
    this.activeView.selectedProblem = problem;
    this.activeView.selectedSubmission = null;
    this.activeView.scoreInput = 0;
    this.activeView.remarksInput = '';
    await this.loadSubmissions();
    this.updateStudentTotals();
  }

  selectSubmission(submission: DSASubmission): void {
    if (!this.activeView) return;
    this.activeView.selectedSubmission = submission;
    this.activeView.scoreInput = submission.score || 0;
    this.activeView.remarksInput = submission.remarks || '';
    this.renderCode(submission.code);
  }

  private async loadSubmissions(): Promise<void> {
    if (!this.activeView || !this.activeView.selectedProblem) return;
    try {
      this.activeView.submissions = await this.supabase.getDSASubmissions(
        this.activeView.contest.id,
        this.activeView.selectedProblem.id
      );
    } catch (err) {
      console.error('Failed to load submissions', err);
    }
  }

  async saveGrade(): Promise<void> {
    if (!this.activeView?.selectedSubmission) return;
    const submission = this.activeView.selectedSubmission;
    this.activeView.saving = true;
    try {
      const user = await this.supabase.getCurrentUser();
      await this.supabase.gradeDSASubmission(
        submission.id,
        this.activeView.scoreInput,
        this.activeView.remarksInput,
        user?.id || ''
      );
      submission.score = this.activeView.scoreInput;
      submission.remarks = this.activeView.remarksInput;
      submission.is_graded = true;
      this.updateStudentTotals();
    } catch (err) {
      console.error('Failed to save grade', err);
    } finally {
      this.activeView.saving = false;
    }
  }

  private updateStudentTotals(): void {
    if (!this.activeView) {
      this.studentTotals = [];
      return;
    }
    const { problems, submissions } = this.activeView;
    const userMap = new Map<string, StudentTotal>();

    for (const sub of submissions) {
      const existing = userMap.get(sub.user_id);
      if (existing) {
        existing.totalScore += sub.score || 0;
        existing.maxScore += sub.max_points;
      } else {
        const profile = (sub as any).user_profiles;
        userMap.set(sub.user_id, {
          userId: sub.user_id,
          name: profile?.name || 'Unknown',
          prn: profile?.prn || '',
          totalScore: sub.score || 0,
          maxScore: sub.max_points,
        });
      }
    }

    for (const problem of problems) {
      const problemSubs = submissions.filter(s => s.problem_id === problem.id);
      for (const sub of problemSubs) {
        if (!userMap.has(sub.user_id)) {
          const profile = (sub as any).user_profiles;
          userMap.set(sub.user_id, {
            userId: sub.user_id,
            name: profile?.name || 'Unknown',
            prn: profile?.prn || '',
            totalScore: sub.score || 0,
            maxScore: sub.max_points,
          });
        }
      }
    }

    this.studentTotals = Array.from(userMap.values()).sort((a, b) => b.totalScore - a.totalScore);
  }

  private setupRealtime(): void {
    if (!this.activeView) return;
    const channel = this.supabase.subscribeToTable('dsa_submissions', () => {
      this.loadSubmissions();
    });
    if (channel?.unsubscribe) {
      this.subscriptions.push({ unsubscribe: () => channel.unsubscribe() });
    }
  }

  private initEditor(): void {
    if (!this.codeViewerRef?.nativeElement) return;
    const el = this.codeViewerRef.nativeElement;
    this.editor = monaco.editor.create(el, {
      value: '',
      language: 'plaintext',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 14,
      readOnly: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
    });
  }

  private renderCode(code: string): void {
    if (this.editor) {
      this.editor.setValue(code || '');
    }
  }

  get selectedProblemMaxPoints(): number {
    return this.activeView?.selectedProblem?.max_points || 0;
  }

  getUserName(sub: any): string {
    return sub?.user_profiles?.name || 'Unknown';
  }
}