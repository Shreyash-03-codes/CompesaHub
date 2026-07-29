import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile, UserRole } from '../../core/models/user.model';
import { NewsItem, CommitteeMember, Notification } from '../../core/models/content.model';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

interface SearchResults {
  students: UserProfile[];
  news: NewsItem[];
  committee: CommitteeMember[];
}

@Component({
  selector: 'app-search-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './search-notifications.component.html',
  styleUrls: ['./search-notifications.component.scss'],
})
export class SearchNotificationsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  searchControl = new FormControl('');
  searchResults: SearchResults | null = null;
  hasSearched = false;

  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.supabase.search(query)),
    ).subscribe(results => {
      this.searchResults = results;
      this.hasSearched = true;
    });

    this.loadNotifications();
  }

  onSearchInput(): void {
    const query = this.searchControl.value?.trim();
    if (!query) {
      this.searchResults = null;
      this.hasSearched = false;
      return;
    }
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchResults = null;
    this.hasSearched = false;
  }

  private async loadNotifications(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    this.notifications = await this.supabase.getNotifications(user.id);
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  async markAsRead(id: string): Promise<void> {
    await this.supabase.markNotificationRead(id);
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.is_read = true;
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
  }
}
