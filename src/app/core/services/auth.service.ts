import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { UserProfile, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<any>(null);
  private userRolesSubject = new BehaviorSubject<UserRole[]>([]);
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();
  userRoles$ = this.userRolesSubject.asObservable();
  profile$ = this.profileSubject.asObservable();

  async init(): Promise<void> {
    const session = await this.supabase.getSession();
    if (session?.user) {
      this.currentUserSubject.next(session.user);
      await this.loadUserData(session.user.id);
    }
    this.supabase.supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUserSubject.next(session.user);
        await this.loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUserSubject.next(null);
        this.userRolesSubject.next([]);
        this.profileSubject.next(null);
      }
    });
  }

  private async loadUserData(userId: string): Promise<void> {
    const [roles, profile] = await Promise.all([
      this.supabase.getUserRoles(userId),
      this.supabase.getProfile(userId),
    ]);
    this.userRolesSubject.next(roles);
    this.profileSubject.next(profile);
  }

  async login(email: string, password: string): Promise<{ error?: string }> {
    const result = await this.supabase.login(email, password);
    if (result.error) return { error: result.error.message };
    return {};
  }

  async logout(): Promise<void> {
    await this.supabase.logout();
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string): Promise<void> {
    await this.supabase.resetPassword(email);
  }

  hasRole(role: UserRole): boolean {
    return this.userRolesSubject.value.includes(role);
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(r => this.userRolesSubject.value.includes(r));
  }

  hasAllRoles(roles: UserRole[]): boolean {
    return roles.every(r => this.userRolesSubject.value.includes(r));
  }

  get currentUser() {
    return this.currentUserSubject.value;
  }

  get userRoles() {
    return this.userRolesSubject.value;
  }

  get profile() {
    return this.profileSubject.value;
  }

  async refreshProfile(): Promise<void> {
    if (this.currentUser?.id) {
      const profile = await this.supabase.getProfile(this.currentUser.id);
      this.profileSubject.next(profile);
    }
  }
}
