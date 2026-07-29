import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { StatCounterComponent } from '../../shared/components/stat-counter/stat-counter.component';
import { UserManagerComponent } from './user-manager/user-manager.component';
import { TestManagerComponent } from './test-manager/test-manager.component';

type TabId = 'dashboard' | 'users' | 'tests' | 'content';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatCounterComponent, UserManagerComponent, TestManagerComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);

  activeTab: TabId = 'dashboard';

  totalStudents = 0;
  totalTests = 0;
  totalNews = 0;
  totalCommittee = 0;

  get isAdmin(): boolean {
    return this.auth.hasRole('Admin');
  }

  async ngOnInit(): Promise<void> {
    if (!this.isAdmin) return;
    await this.loadStats();
  }

  private async loadStats(): Promise<void> {
    const allProfiles = await this.supabase.supabase.from('user_profiles').select('id', { count: 'exact', head: true });
    this.totalStudents = allProfiles.count ?? 0;

    const allTests = await this.supabase.supabase.from('assessment_tests').select('id', { count: 'exact', head: true });
    this.totalTests = allTests.count ?? 0;

    const allNews = await this.supabase.supabase.from('news').select('id', { count: 'exact', head: true });
    this.totalNews = allNews.count ?? 0;

    const allCommittee = await this.supabase.supabase.from('committee_members').select('id', { count: 'exact', head: true });
    this.totalCommittee = allCommittee.count ?? 0;
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
  }

  contentLinks: { label: string; route: string; icon: string }[] = [
    { label: 'News & Activities', route: '/admin/news', icon: '📰' },
    { label: 'Committee', route: '/admin/committee', icon: '👥' },
    { label: 'Placement Club', route: '/admin/placement-club', icon: '💼' },
    { label: 'About Content', route: '/admin/about', icon: 'ℹ️' },
    { label: 'Contact Submissions', route: '/admin/contact', icon: '✉️' },
  ];
}
