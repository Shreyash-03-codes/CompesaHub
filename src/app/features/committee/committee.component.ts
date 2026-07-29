import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { CommitteeMember } from '../../core/models/content.model';
import { MemberCardComponent } from '../../shared/components/member-card/member-card.component';

@Component({
  selector: 'app-committee',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MemberCardComponent],
  templateUrl: './committee.component.html',
  styleUrls: ['./committee.component.scss']
})
export class CommitteeComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  members: CommitteeMember[] = [];
  showPast = false;
  showAddForm = false;
  editingMember: CommitteeMember | null = null;
  submitting = false;

  memberForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    role: ['', Validators.required],
    bio: [''],
    photo_url: [''],
    email: ['', Validators.email],
    is_faculty_coordinator: [false],
    batch_year: [''],
    order: [0],
  });

  get isAdminOrCommittee(): boolean {
    return this.auth.hasAnyRole(['Admin', 'Committee', 'Faculty']);
  }

  get currentMembers(): CommitteeMember[] {
    return this.members.filter(m => m.is_current);
  }

  get pastMembers(): CommitteeMember[] {
    return this.members.filter(m => !m.is_current);
  }

  get facultyCoordinators(): CommitteeMember[] {
    return this.currentMembers.filter(m => m.is_faculty_coordinator);
  }

  get regularMembers(): CommitteeMember[] {
    return this.currentMembers.filter(m => !m.is_faculty_coordinator);
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    this.members = await this.supabase.getCommitteeMembers();
  }

  openAddForm(): void {
    this.editingMember = null;
    this.memberForm.reset({ is_faculty_coordinator: false, order: 0 });
    this.showAddForm = true;
  }

  openEditForm(member: CommitteeMember): void {
    this.editingMember = member;
    this.memberForm.patchValue(member);
    this.showAddForm = true;
  }

  closeForm(): void {
    this.showAddForm = false;
    this.editingMember = null;
    this.memberForm.reset({ is_faculty_coordinator: false, order: 0 });
  }

  async onSubmit(): Promise<void> {
    if (this.memberForm.invalid) return;
    this.submitting = true;
    const data = this.memberForm.getRawValue();
    if (this.editingMember) {
      await this.supabase.saveCommitteeMember({ ...data, id: this.editingMember.id });
    } else {
      await this.supabase.saveCommitteeMember({ ...data, is_current: true });
    }
    this.submitting = false;
    this.closeForm();
    await this.loadMembers();
  }

  async deleteMember(id: string): Promise<void> {
    await this.supabase.deleteCommitteeMember(id);
    await this.loadMembers();
  }

  async archiveMember(member: CommitteeMember): Promise<void> {
    await this.supabase.saveCommitteeMember({ ...member, is_current: false });
    await this.loadMembers();
  }

  togglePast(): void {
    this.showPast = !this.showPast;
  }
}