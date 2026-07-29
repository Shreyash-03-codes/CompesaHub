import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AssessmentTest } from '../../../core/models/assessment.model';

@Component({
  selector: 'app-assessment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './assessment-list.component.html',
  styleUrls: ['./assessment-list.component.scss'],
})
export class AssessmentListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  tests: AssessmentTest[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadTests();
  }

  async loadTests(): Promise<void> {
    try {
      this.tests = await this.supabase.getTests();
    } catch (err) {
      console.error('Failed to load tests', err);
    } finally {
      this.loading = false;
    }
  }

  getTestStatus(test: AssessmentTest): 'upcoming' | 'active' | 'past' {
    const now = new Date();
    const start = new Date(test.start_time);
    const end = new Date(test.end_time);
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'past';
  }

  startTest(test: AssessmentTest): void {
    if (this.getTestStatus(test) === 'active') {
      this.router.navigate(['/assessment/take', test.id]);
    }
  }

  viewResults(test: AssessmentTest): void {
    this.router.navigate(['/assessment/results', test.id]);
  }
}