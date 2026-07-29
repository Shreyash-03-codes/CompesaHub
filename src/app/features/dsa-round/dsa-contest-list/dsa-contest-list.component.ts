import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DSAContest } from '../../../core/models/assessment.model';

@Component({
  selector: 'app-dsa-contest-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dsa-contest-list.component.html',
  styleUrls: ['./dsa-contest-list.component.scss'],
})
export class DsaContestListComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  contests: DSAContest[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadContests();
  }

  async loadContests(): Promise<void> {
    try {
      this.contests = await this.supabase.getDSAContests();
    } catch (err) {
      console.error('Failed to load contests', err);
    } finally {
      this.loading = false;
    }
  }

  getContestStatus(contest: DSAContest): 'upcoming' | 'active' | 'past' {
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'past';
  }

  enterContest(contest: DSAContest): void {
    if (this.getContestStatus(contest) === 'active') {
      this.router.navigate(['/dsa-round/contest', contest.id]);
    }
  }
}