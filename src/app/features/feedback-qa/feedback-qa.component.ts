import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { FeedbackForm, FeedbackResponse, FAQ } from '../../core/models/content.model';

@Component({
  selector: 'app-feedback-qa',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './feedback-qa.component.html',
  styleUrls: ['./feedback-qa.component.scss']
})
export class FeedbackQaComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  feedbackForms: (FeedbackForm & { news?: { title: string } })[] = [];
  selectedForm: (FeedbackForm & { news?: { title: string } }) | null = null;
  existingResponse: FeedbackResponse | null = null;
  responses: FeedbackResponse[] = [];
  faqs: FAQ[] = [];
  expandedFaqIds = new Set<string>();
  submitting = false;
  submitted = false;
  showAdminView = false;

  feedbackForm = this.fb.nonNullable.group({
    rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });

  get isAdminOrFaculty(): boolean {
    return this.auth.hasAnyRole(['Admin', 'Committee', 'Faculty']);
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    const [forms, faqs] = await Promise.all([
      this.supabase.getFeedbackForms(),
      this.supabase.getFAQs(),
    ]);
    this.feedbackForms = forms;
    this.faqs = faqs;
  }

  isFormActive(form: FeedbackForm): boolean {
    const now = new Date();
    const start = new Date(form.start_time);
    const end = new Date(form.end_time);
    return now >= start && now <= end && form.is_active;
  }

  selectForm(form: FeedbackForm & { news?: { title: string } }): void {
    this.selectedForm = form;
    this.submitted = false;
    this.existingResponse = null;
    this.feedbackForm.reset({ rating: 0, comment: '' });
    this.loadResponses();
    this.checkExistingResponse(form.id);
  }

  async checkExistingResponse(formId: string): Promise<void> {
    const userId = this.auth.currentUser?.id;
    if (!userId) return;
    const all = await this.supabase.getFeedbackResponses(formId);
    this.existingResponse = all.find(r => r.user_id === userId) || null;
    if (this.existingResponse) {
      this.submitted = true;
    }
  }

  async loadResponses(): Promise<void> {
    if (!this.selectedForm) return;
    this.responses = await this.supabase.getFeedbackResponses(this.selectedForm.id);
  }

  setRating(value: number): void {
    this.feedbackForm.patchValue({ rating: value });
  }

  async onSubmit(): Promise<void> {
    if (this.feedbackForm.invalid || !this.selectedForm) return;
    this.submitting = true;
    const { rating, comment } = this.feedbackForm.getRawValue();
    await this.supabase.submitFeedback({
      feedback_form_id: this.selectedForm.id,
      user_id: this.auth.currentUser?.id,
      rating,
      comment,
    });
    this.submitting = false;
    this.submitted = true;
    await this.loadResponses();
  }

  get averageRating(): number {
    if (this.responses.length === 0) return 0;
    return this.responses.reduce((sum, r) => sum + r.rating, 0) / this.responses.length;
  }

  get ratingDistribution(): { stars: number; count: number }[] {
    const dist = [1, 2, 3, 4, 5].map(stars => ({
      stars,
      count: this.responses.filter(r => r.rating === stars).length,
    }));
    return dist;
  }

  toggleFaq(id: string): void {
    if (this.expandedFaqIds.has(id)) {
      this.expandedFaqIds.delete(id);
    } else {
      this.expandedFaqIds.add(id);
    }
  }

  isFaqExpanded(id: string): boolean {
    return this.expandedFaqIds.has(id);
  }

  clearSelection(): void {
    this.selectedForm = null;
    this.responses = [];
    this.submitted = false;
    this.existingResponse = null;
  }

  get averageRatingRounded(): number {
    return Math.round(this.averageRating);
  }
}