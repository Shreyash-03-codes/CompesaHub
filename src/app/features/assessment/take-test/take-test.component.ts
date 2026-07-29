import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AssessmentTest, Question, StudentAnswer, TestSubmission } from '../../../core/models/assessment.model';

@Component({
  selector: 'app-take-test',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './take-test.component.html',
  styleUrls: ['./take-test.component.scss'],
})
export class TakeTestComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  test: AssessmentTest | null = null;
  questions: Question[] = [];
  currentIndex = 0;
  loading = true;
  submitting = false;
  submitted = false;

  answers: Map<string, number[]> = new Map();
  remainingSeconds = 0;
  private timerInterval: any;

  async ngOnInit(): Promise<void> {
    const testId = this.route.snapshot.paramMap.get('id');
    if (!testId) {
      this.router.navigate(['/assessment']);
      return;
    }
    try {
      this.test = await this.supabase.getTest(testId);
      if (!this.test) {
        this.router.navigate(['/assessment']);
        return;
      }
      this.questions = await this.supabase.getQuestions(testId);
      this.initTimer();
    } catch (err) {
      console.error('Failed to load test', err);
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private initTimer(): void {
    if (this.test) {
      const now = new Date().getTime();
      const end = new Date(this.test.end_time).getTime();
      const durationMs = this.test.duration_minutes * 60 * 1000;
      const remaining = Math.min(end - now, durationMs);
      this.remainingSeconds = Math.max(0, Math.floor(remaining / 1000));
      if (this.remainingSeconds <= 0) {
        this.autoSubmit();
        return;
      }
      this.timerInterval = setInterval(() => {
        this.remainingSeconds--;
        if (this.remainingSeconds <= 0) {
          this.autoSubmit();
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
    const m = Math.floor(this.remainingSeconds / 60);
    const s = this.remainingSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  get currentQuestion(): Question | undefined {
    return this.questions[this.currentIndex];
  }

  get progress(): number {
    if (!this.questions.length) return 0;
    return ((this.currentIndex + 1) / this.questions.length) * 100;
  }

  get isSingleSelect(): boolean {
    const q = this.currentQuestion;
    return !q || q.correct_options.length <= 1;
  }

  isOptionSelected(questionId: string, optionIndex: number): boolean {
    const selected = this.answers.get(questionId);
    return selected ? selected.includes(optionIndex) : false;
  }

  toggleOption(questionId: string, optionIndex: number): void {
    const q = this.questions.find(x => x.id === questionId);
    if (!q) return;
    const selected = this.answers.get(questionId) || [];

    if (this.isSingleSelect) {
      this.answers.set(questionId, [optionIndex]);
    } else {
      const idx = selected.indexOf(optionIndex);
      if (idx >= 0) {
        selected.splice(idx, 1);
        if (selected.length === 0) {
          this.answers.delete(questionId);
        } else {
          this.answers.set(questionId, [...selected]);
        }
      } else {
        this.answers.set(questionId, [...selected, optionIndex]);
      }
    }
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
    }
  }

  prevQuestion(): void {
    this.goToQuestion(this.currentIndex - 1);
  }

  nextQuestion(): void {
    this.goToQuestion(this.currentIndex + 1);
  }

  isQuestionAnswered(index: number): boolean {
    const q = this.questions[index];
    return q ? (this.answers.get(q.id)?.length ?? 0) > 0 : false;
  }

  confirmSubmit(): void {
    const unanswered = this.questions.filter(q => !this.isQuestionAnswered(this.questions.indexOf(q)));
    const msg = unanswered.length > 0
      ? `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      : 'Are you sure you want to submit the test?';
    if (confirm(msg)) {
      this.submitTest();
    }
  }

  async submitTest(): Promise<void> {
    if (this.submitting || this.submitted) return;
    this.submitting = true;
    this.clearTimer();

    const user = (await this.supabase.getCurrentUser());
    if (!user || !this.test) {
      this.submitting = false;
      return;
    }

    const submission: Partial<TestSubmission> = {
      test_id: this.test.id,
      user_id: user.id,
      submitted_at: new Date().toISOString(),
      is_graded: false,
    };

    let score = 0;
    const total = this.questions.reduce((s, q) => s + q.points, 0);
    const studentAnswers: Partial<StudentAnswer>[] = this.questions.map(q => {
      const selected = this.answers.get(q.id) || [];
      const correct = this.arraysEqual(selected, q.correct_options);
      if (correct) score += q.points;
      return {
        test_id: this.test!.id,
        user_id: user.id,
        question_id: q.id,
        selected_options: selected,
        is_correct: correct,
        submitted_at: new Date().toISOString(),
      };
    });

    submission.score = score;
    submission.total = total;

    try {
      await this.supabase.submitTest(submission, studentAnswers);
      this.submitted = true;
      this.router.navigate(['/assessment/results', this.test.id]);
    } catch (err) {
      console.error('Submit failed', err);
      this.submitting = false;
    }
  }

  private async autoSubmit(): Promise<void> {
    this.clearTimer();
    await this.submitTest();
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  }
}