import { Component, OnInit, inject, signal, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { StatCounterComponent } from '../../shared/components/stat-counter/stat-counter.component';
import { AssessmentTest } from '../../core/models/assessment.model';
import { NewsItem, PlacementClubMember } from '../../core/models/content.model';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCounterComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss'],
})
export class StudentDashboardComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);

  @ViewChildren('widgetEl') widgetElements!: QueryList<ElementRef>;

  currentUser$ = this.authService.currentUser$;
  profile$ = this.authService.profile$;

  upcomingTests = signal<AssessmentTest[]>([]);
  newsItems = signal<NewsItem[]>([]);
  placementMembers = signal<PlacementClubMember[]>([]);
  submissions = signal<any[]>([]);
  loading = signal(true);
  error = signal('');

  get upcomingCount(): number {
    return this.upcomingTests().length;
  }
  get newsCount(): number {
    return this.newsItems().length;
  }
  get testsAttempted(): number {
    return this.submissions().length;
  }

  async ngOnInit(): Promise<void> {
    try {
      const [tests, news, members] = await Promise.all([
        this.supabase.getTests(),
        this.supabase.getNews(),
        this.supabase.getPlacementClubMembers(),
      ]);
      const now = new Date().toISOString();
      this.upcomingTests.set(
        (tests || []).filter(t => t.end_time > now).sort((a, b) => a.start_time.localeCompare(b.start_time)).slice(0, 5),
      );
      this.newsItems.set((news || []).slice(0, 5));
      this.placementMembers.set((members || []).slice(0, 4));

      const user = await this.supabase.getCurrentUser();
      if (user) {
        const { data } = await this.supabase.supabase
          .from('test_submissions')
          .select('*')
          .eq('user_id', user.id);
        this.submissions.set(data || []);
      }
    } catch (e) {
      this.error.set('Failed to load dashboard data. Please try again later.');
      console.error('Dashboard load error:', e);
    } finally {
      this.loading.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.setupScrollObserver();
  }

  private setupScrollObserver(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    setTimeout(() => {
      this.widgetElements?.forEach(el => observer.observe(el.nativeElement));
    });
  }
}
