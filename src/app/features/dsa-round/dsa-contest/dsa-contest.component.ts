import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DSAContest, DSAProblem, DSASubmission } from '../../../core/models/assessment.model';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'app-dsa-contest',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dsa-contest.component.html',
  styleUrls: ['./dsa-contest.component.scss'],
})
export class DsaContestComponent implements OnInit, OnDestroy, AfterViewInit {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('codeEditor', { static: false }) codeEditorRef!: ElementRef;

  contest: DSAContest | null = null;
  problems: DSAProblem[] = [];
  currentProblemIndex = 0;
  code = '';
  language: string = 'java';
  loading = true;
  submitting = false;
  submitted = false;

  remainingSeconds = 0;
  private timerInterval: any;
  private editor: monaco.editor.IStandaloneCodeEditor | null = null;

  readonly languages = ['java', 'python', 'cpp', 'c'];

  ngOnInit(): void {
    this.loadContest();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initEditor(), 100);
  }

  ngOnDestroy(): void {
    this.clearTimer();
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
  }

  private async loadContest(): Promise<void> {
    const contestId = this.route.snapshot.paramMap.get('id');
    if (!contestId) {
      this.router.navigate(['/dsa-round']);
      return;
    }
    try {
      const data = await this.supabase.getDSAContest(contestId);
      if (!data) {
        this.router.navigate(['/dsa-round']);
        return;
      }
      this.contest = data;
      this.problems = data.problems || await this.supabase.getDSAProblems(contestId);
      this.initTimer();
    } catch (err) {
      console.error('Failed to load contest', err);
    } finally {
      this.loading = false;
    }
  }

  private initEditor(): void {
    if (!this.codeEditorRef?.nativeElement) return;
    const el = this.codeEditorRef.nativeElement;
    this.editor = monaco.editor.create(el, {
      value: this.code,
      language: this.language,
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
    });
    this.editor.onDidChangeModelContent(() => {
      this.code = this.editor?.getValue() || '';
    });
  }

  private updateEditorLanguage(): void {
    if (this.editor) {
      const model = this.editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, this.language);
      }
    }
  }

  private initTimer(): void {
    if (this.contest) {
      const now = new Date().getTime();
      const end = new Date(this.contest.end_time).getTime();
      const durationMs = this.contest.duration_minutes * 60 * 1000;
      const remaining = Math.min(end - now, durationMs);
      this.remainingSeconds = Math.max(0, Math.floor(remaining / 1000));
      if (this.remainingSeconds <= 0) {
        this.handleTimeUp();
        return;
      }
      this.timerInterval = setInterval(() => {
        this.remainingSeconds--;
        if (this.remainingSeconds <= 0) {
          this.handleTimeUp();
        }
      }, 1000);
    }
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTime(): string {
    const h = Math.floor(this.remainingSeconds / 3600);
    const m = Math.floor((this.remainingSeconds % 3600) / 60);
    const s = this.remainingSeconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  get currentProblem(): DSAProblem | undefined {
    return this.problems[this.currentProblemIndex];
  }

  selectProblem(index: number): void {
    if (index >= 0 && index < this.problems.length) {
      if (this.editor) {
        this.code = this.editor.getValue();
      }
      this.currentProblemIndex = index;
      setTimeout(() => {
        if (this.editor) {
          this.editor.setValue(this.code || '');
          this.updateEditorLanguage();
        }
      }, 50);
    }
  }

  changeLanguage(lang: string): void {
    this.language = lang;
    this.updateEditorLanguage();
  }

  async submitCode(): Promise<void> {
    if (this.submitting || this.submitted || !this.contest || !this.currentProblem) return;
    if (!this.code.trim()) {
      alert('Please write some code before submitting.');
      return;
    }
    if (!confirm(`Submit solution for "${this.currentProblem.title}"?`)) return;

    this.submitting = true;
    const user = await this.supabase.getCurrentUser();
    if (!user) {
      this.submitting = false;
      return;
    }

    try {
      const submission: Partial<DSASubmission> = {
        contest_id: this.contest.id,
        problem_id: this.currentProblem.id,
        user_id: user.id,
        code: this.code,
        language: this.language,
        submitted_at: new Date().toISOString(),
        is_graded: false,
        max_points: this.currentProblem.max_points,
      };
      await this.supabase.submitDSACode(submission);
      alert('Solution submitted successfully!');
    } catch (err) {
      console.error('Submit failed', err);
      alert('Failed to submit. Please try again.');
    } finally {
      this.submitting = false;
    }
  }

  private async handleTimeUp(): Promise<void> {
    this.clearTimer();
    this.submitted = true;
    alert('Time is up!');
  }
}