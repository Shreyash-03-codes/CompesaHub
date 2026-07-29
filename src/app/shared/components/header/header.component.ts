import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  trigger, state, style, animate, transition
} from '@angular/animations';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  animations: [
    trigger('dropdownAnimation', [
      state('void', style({ opacity: 0, transform: 'translateY(-8px)' })),
      transition(':enter', [
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ])
    ]),
    trigger('mobileMenuAnimation', [
      state('void', style({ opacity: 0, height: 0 })),
      transition(':enter', [
        animate('250ms ease-out', style({ opacity: 1, height: '*' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, height: 0 }))
      ])
    ])
  ]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  isMobileMenuOpen = signal(false);
  isUserMenuOpen = signal(false);

  user = this.authService.currentUser;
  profile = this.authService.profile;
  userRoles = this.authService.userRoles;

  navLinks: { label: string; route: string; roles?: UserRole[] }[] = [
    { label: 'Dashboard', route: '/dashboard', roles: ['Student', 'Committee', 'Placement Club', 'Faculty', 'Admin'] },
    { label: 'Assessments', route: '/assessments', roles: ['Student', 'Admin', 'Faculty'] },
    { label: 'DSA Round', route: '/dsa', roles: ['Student', 'Admin', 'Faculty'] },
    { label: 'News', route: '/news' },
    { label: 'Committee', route: '/committee' },
    { label: 'Placement Club', route: '/placement-club' },
    { label: 'Feedback', route: '/feedback' },
    { label: 'About', route: '/about' },
    { label: 'Contact', route: '/contact' },
    { label: 'Admin Panel', route: '/admin', roles: ['Admin'] },
  ];

  get filteredNavLinks() {
    if (!this.user) {
      return this.navLinks.filter(l => !l.roles);
    }
    return this.navLinks.filter(l => !l.roles || this.authService.hasAnyRole(l.roles));
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  get displayName(): string {
    return this.profile?.name || this.user?.email || 'User';
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
    if (this.isMobileMenuOpen()) {
      this.isUserMenuOpen.set(false);
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  logout(): void {
    this.isUserMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-container')) {
      this.isUserMenuOpen.set(false);
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  async changePassword(): Promise<void> {
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      if (newPassword) alert('Password must be at least 6 characters');
      return;
    }
    const confirm = prompt('Confirm new password:');
    if (newPassword !== confirm) {
      alert('Passwords do not match');
      return;
    }
    try {
      const { error } = await this.supabase.supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Password updated successfully');
    } catch (err: any) {
      alert('Failed to update password: ' + err.message);
    }
  }
}