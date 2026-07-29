import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { NewsItem, NewsType } from '../../core/models/content.model';

@Component({
  selector: 'app-news-activities',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './news-activities.component.html',
  styleUrls: ['./news-activities.component.scss']
})
export class NewsActivitiesComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  newsItems: NewsItem[] = [];
  filteredItems: NewsItem[] = [];
  activeFilter: NewsType | 'all' = 'all';
  expandedIds = new Set<string>();
  showAddForm = false;
  submitting = false;

  newsForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
    type: ['general' as NewsType, Validators.required],
    image_url: [''],
    event_date: ['', Validators.required],
  });

  get isAdminOrCommittee(): boolean {
    return this.auth.hasAnyRole(['Admin', 'Committee', 'Faculty']);
  }

  readonly newsTypes: { value: NewsType; label: string }[] = [
    { value: 'workshop', label: 'Workshop' },
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'guest_lecture', label: 'Guest Lecture' },
    { value: 'placement_session', label: 'Placement Session' },
    { value: 'general', label: 'General' },
  ];

  ngOnInit(): void {
    this.loadNews();
  }

  async loadNews(): Promise<void> {
    this.newsItems = await this.supabase.getNews();
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeFilter === 'all') {
      this.filteredItems = this.newsItems;
    } else {
      this.filteredItems = this.newsItems.filter(n => n.type === this.activeFilter);
    }
  }

  setFilter(type: NewsType | 'all'): void {
    this.activeFilter = type;
    this.applyFilter();
  }

  toggleExpand(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newsForm.reset({ type: 'general' });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.newsForm.invalid) return;
    this.submitting = true;
    const news = this.newsForm.getRawValue();
    await this.supabase.saveNews({ ...news, created_by: this.auth.currentUser?.id });
    this.submitting = false;
    this.showAddForm = false;
    this.newsForm.reset({ type: 'general' });
    await this.loadNews();
  }

  async deleteNews(id: string): Promise<void> {
    await this.supabase.deleteNews(id);
    await this.loadNews();
  }

  typeLabel(type: NewsType): string {
    return this.newsTypes.find(t => t.value === type)?.label ?? type;
  }
}