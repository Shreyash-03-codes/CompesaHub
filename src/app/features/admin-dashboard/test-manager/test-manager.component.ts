import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AssessmentTest, Question } from '../../../core/models/assessment.model';

@Component({
  selector: 'app-test-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './test-manager.component.html',
  styleUrls: ['./test-manager.component.scss'],
})
export class TestManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);

  tests: AssessmentTest[] = [];
  editingTest: AssessmentTest | null = null;
  selectedTestQuestions: Question[] = [];
  editingQuestion: Question | null = null;

  testForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    type: ['weekly' as AssessmentTest['type'], Validators.required],
    topic_tags: [''],
    start_time: ['', Validators.required],
    end_time: ['', Validators.required],
    duration_minutes: [60, [Validators.required, Validators.min(1)]],
    is_published: [false],
  });

  questionForm = this.fb.nonNullable.group({
    question_text: ['', Validators.required],
    question_type: ['mcq' as Question['question_type']],
    code_snippet: [''],
    options: this.fb.array<string>([], Validators.minLength(1)),
    correct_options: this.fb.array<boolean>([]),
    points: [1, [Validators.required, Validators.min(1)]],
    topic_tag: [''],
    order: [0],
  });

  ngOnInit(): void {
    this.loadTests();
  }

  private async loadTests(): Promise<void> {
    this.tests = await this.supabase.getTests();
  }

  get optionsArray(): FormArray {
    return this.questionForm.controls.options as FormArray;
  }

  get correctOptionsArray(): FormArray {
    return this.questionForm.controls.correct_options as FormArray;
  }

  addOption(option: string = ''): void {
    this.optionsArray.push(this.fb.control(option, Validators.required));
    this.correctOptionsArray.push(this.fb.control(false));
  }

  removeOption(index: number): void {
    this.optionsArray.removeAt(index);
    this.correctOptionsArray.removeAt(index);
  }

  startCreate(): void {
    this.editingTest = null;
    this.selectedTestQuestions = [];
    this.testForm.reset({ type: 'weekly', duration_minutes: 60, is_published: false });
  }

  startEdit(test: AssessmentTest): void {
    this.editingTest = test;
    this.testForm.setValue({
      title: test.title,
      description: test.description || '',
      type: test.type,
      topic_tags: test.topic_tags?.join(', ') || '',
      start_time: test.start_time?.slice(0, 16) || '',
      end_time: test.end_time?.slice(0, 16) || '',
      duration_minutes: test.duration_minutes || 60,
      is_published: test.is_published ?? false,
    });
    this.loadQuestions(test.id);
  }

  cancelEdit(): void {
    this.editingTest = null;
    this.selectedTestQuestions = [];
    this.testForm.reset({ type: 'weekly', duration_minutes: 60, is_published: false });
  }

  async saveTest(): Promise<void> {
    if (this.testForm.invalid) return;
    const val = this.testForm.getRawValue();
    const payload: Partial<AssessmentTest> = {
      title: val.title,
      description: val.description,
      type: val.type,
      topic_tags: val.topic_tags ? val.topic_tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      start_time: val.start_time ? new Date(val.start_time).toISOString() : undefined,
      end_time: val.end_time ? new Date(val.end_time).toISOString() : undefined,
      duration_minutes: val.duration_minutes,
      is_published: val.is_published,
    };
    if (this.editingTest) payload.id = this.editingTest.id;
    await this.supabase.saveTest(payload);
    this.cancelEdit();
    await this.loadTests();
  }

  async deleteTest(id: string): Promise<void> {
    if (!confirm('Delete this test and all its questions?')) return;
    await this.supabase.deleteTest(id);
    if (this.editingTest?.id === id) this.cancelEdit();
    await this.loadTests();
  }

  private async loadQuestions(testId: string): Promise<void> {
    this.selectedTestQuestions = await this.supabase.getQuestions(testId);
  }

  startAddQuestion(): void {
    this.editingQuestion = null;
    this.questionForm.reset({ question_type: 'mcq', points: 1, order: this.selectedTestQuestions.length });
    while (this.optionsArray.length) this.optionsArray.removeAt(0);
    while (this.correctOptionsArray.length) this.correctOptionsArray.removeAt(0);
  }

  startEditQuestion(q: Question): void {
    this.editingQuestion = q;
    while (this.optionsArray.length) this.optionsArray.removeAt(0);
    while (this.correctOptionsArray.length) this.correctOptionsArray.removeAt(0);
    q.options.forEach((opt, i) => {
      this.optionsArray.push(this.fb.control(opt, Validators.required));
      this.correctOptionsArray.push(this.fb.control(q.correct_options?.includes(i) ?? false));
    });
    this.questionForm.patchValue({
      question_text: q.question_text,
      question_type: q.question_type,
      code_snippet: q.code_snippet || '',
      points: q.points,
      topic_tag: q.topic_tag || '',
      order: q.order,
    });
  }

  cancelQuestionEdit(): void {
    this.editingQuestion = null;
  }

  async saveQuestion(): Promise<void> {
    if (this.questionForm.invalid || !this.editingTest) return;
    const val = this.questionForm.getRawValue();
    const correctOptions: number[] = val.correct_options
      .map((isCorrect, i) => (isCorrect ? i : -1))
      .filter(i => i >= 0);
    const payload: Partial<Question> = {
      test_id: this.editingTest.id,
      question_text: val.question_text,
      question_type: val.question_type,
      code_snippet: val.question_type === 'code_display' ? val.code_snippet : '',
      options: val.options.filter((o): o is string => o !== null),
      correct_options: correctOptions,
      points: val.points,
      topic_tag: val.topic_tag,
      order: val.order,
    };
    if (this.editingQuestion) payload.id = this.editingQuestion.id;
    await this.supabase.saveQuestion(payload);
    this.cancelQuestionEdit();
    await this.loadQuestions(this.editingTest.id);
  }

  async deleteQuestion(id: string): Promise<void> {
    if (!confirm('Delete this question?')) return;
    await this.supabase.deleteQuestion(id);
    if (this.editingTest) await this.loadQuestions(this.editingTest.id);
    if (this.editingQuestion?.id === id) this.editingQuestion = null;
  }
}
