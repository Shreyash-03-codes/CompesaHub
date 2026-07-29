import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'set-password', loadComponent: () => import('./features/auth/set-password/set-password.component').then(m => m.SetPasswordComponent) },
    ],
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/student-profile/student-profile.component').then(m => m.StudentProfileComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./features/student-profile/student-profile.component').then(m => m.StudentProfileComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'assessments',
    loadComponent: () => import('./features/assessment/assessment-list/assessment-list.component').then(m => m.AssessmentListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'assessments/take/:id',
    loadComponent: () => import('./features/assessment/take-test/take-test.component').then(m => m.TakeTestComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'assessments/results/:id',
    loadComponent: () => import('./features/assessment/test-results/test-results.component').then(m => m.TestResultsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'dsa',
    loadComponent: () => import('./features/dsa-round/dsa-contest-list/dsa-contest-list.component').then(m => m.DsaContestListComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'dsa/contest/:id',
    loadComponent: () => import('./features/dsa-round/dsa-contest/dsa-contest.component').then(m => m.DsaContestComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'dsa/grading',
    loadComponent: () => import('./features/dsa-round/dsa-grading/dsa-grading.component').then(m => m.DsaGradingComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin', 'Faculty'] },
  },
  {
    path: 'news',
    loadComponent: () => import('./features/news-activities/news-activities.component').then(m => m.NewsActivitiesComponent),
  },
  {
    path: 'committee',
    loadComponent: () => import('./features/committee/committee.component').then(m => m.CommitteeComponent),
  },
  {
    path: 'placement-club',
    loadComponent: () => import('./features/placement-club/placement-club.component').then(m => m.PlacementClubComponent),
  },
  {
    path: 'feedback',
    loadComponent: () => import('./features/feedback-qa/feedback-qa.component').then(m => m.FeedbackQaComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about-us/about-us.component').then(m => m.AboutUsComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact-join/contact-join.component').then(m => m.ContactJoinComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin'] },
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search-notifications/search-notifications.component').then(m => m.SearchNotificationsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/reports-analytics/reports-analytics.component').then(m => m.ReportsAnalyticsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['Admin', 'Faculty'] },
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];
