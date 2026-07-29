import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

interface SidebarGroup {
  label: string;
  icon: string;
  links: SidebarLink[];
}

interface SidebarLink {
  label: string;
  route: string;
  icon: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private authService = inject(AuthService);

  isCollapsed = signal(false);

  user = this.authService.currentUser;
  profile = this.authService.profile;

  sidebarGroups: SidebarGroup[] = [
    {
      label: 'Main',
      icon: 'nav',
      links: [
        { label: 'Dashboard', route: '/dashboard', icon: '📊' }
      ]
    },
    {
      label: 'Committees',
      icon: 'groups',
      links: [
        { label: 'All Committees', route: '/committees', icon: '🏛' },
        { label: 'My Committee', route: '/dashboard/my-committee', icon: '👥', roles: ['Committee'] }
      ]
    },
    {
      label: 'Placements',
      icon: 'work',
      links: [
        { label: 'Placement Hub', route: '/placements', icon: '💼' },
        { label: 'My Club', route: '/dashboard/my-club', icon: '⭐', roles: ['Placement Club'] }
      ]
    },
    {
      label: 'Resources',
      icon: 'library_books',
      links: [
        { label: 'Resource Library', route: '/resources', icon: '📚' },
        { label: 'My Uploads', route: '/dashboard/my-uploads', icon: '📤', roles: ['Committee', 'Placement Club', 'Faculty', 'Admin'] }
      ]
    },
    {
      label: 'Profile',
      icon: 'person',
      links: [
        { label: 'My Profile', route: '/dashboard/profile', icon: '👤' },
        { label: 'Settings', route: '/dashboard/settings', icon: '⚙' }
      ]
    },
    {
      label: 'Administration',
      icon: 'admin_panel_settings',
      links: [
        { label: 'Admin Panel', route: '/admin', icon: '🛡', roles: ['Admin'] },
        { label: 'User Management', route: '/admin/users', icon: '👥', roles: ['Admin'] },
        { label: 'Content Moderation', route: '/admin/moderation', icon: '📋', roles: ['Admin', 'Faculty'] }
      ]
    }
  ];

  get filteredGroups(): SidebarGroup[] {
    if (!this.user) {
      return [];
    }
    return this.sidebarGroups
      .map(group => ({
        ...group,
        links: group.links.filter(link =>
          !link.roles || this.authService.hasAnyRole(link.roles)
        )
      }))
      .filter(group => group.links.length > 0);
  }

  get userInitial(): string {
    return this.profile?.name?.charAt(0)?.toUpperCase() || this.user?.email?.charAt(0)?.toUpperCase() || 'U';
  }

  get displayName(): string {
    return this.profile?.name || this.user?.email || 'User';
  }

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }
}