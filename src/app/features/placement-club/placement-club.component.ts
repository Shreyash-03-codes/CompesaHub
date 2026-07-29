import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { PlacementClubMember } from '../../core/models/content.model';
import { MemberCardComponent } from '../../shared/components/member-card/member-card.component';

@Component({
  selector: 'app-placement-club',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MemberCardComponent],
  templateUrl: './placement-club.component.html',
  styleUrls: ['./placement-club.component.scss']
})
export class PlacementClubComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  members: PlacementClubMember[] = [];
  showPast = false;
  showAddForm = false;
  editingMember: PlacementClubMember | null = null;
  submitting = false;

  memberForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    role: ['', Validators.required],
    bio: [''],
    photo_url: [''],
    email: ['', Validators.email],
    batch_year: [''],
    order: [0],
  });

  get isAdminOrPlacementClub(): boolean {
    return this.auth.hasAnyRole(['Admin', 'Placement Club', 'Faculty']);
  }

  get currentMembers(): PlacementClubMember[] {
    return this.members.filter(m => m.is_current);
  }

  get pastMembers(): PlacementClubMember[] {
    return this.members.filter(m => !m.is_current);
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  async loadMembers(): Promise<void> {
    this.members = await this.supabase.getPlacementClubMembers();
  }

  openAddForm(): void {
    this.editingMember = null;
    this.memberForm.reset({ order: 0 });
    this.showAddForm = true;
  }

  openEditForm(member: PlacementClubMember): void {
    this.editingMember = member;
    this.memberForm.patchValue(member);
    this.showAddForm = true;
  }

  closeForm(): void {
    this.showAddForm = false;
    this.editingMember = null;
    this.memberForm.reset({ order: 0 });
  }

  async onSubmit(): Promise<void> {
    if (this.memberForm.invalid) return;
    this.submitting = true;
    const data = this.memberForm.getRawValue();
    if (this.editingMember) {
      await this.supabase.savePlacementClubMember({ ...data, id: this.editingMember.id });
    } else {
      await this.supabase.savePlacementClubMember({ ...data, is_current: true });
    }
    this.submitting = false;
    this.closeForm();
    await this.loadMembers();
  }

  async deleteMember(id: string): Promise<void> {
    await this.supabase.deletePlacementClubMember(id);
    await this.loadMembers();
  }

  async archiveMember(member: PlacementClubMember): Promise<void> {
    await this.supabase.savePlacementClubMember({ ...member, is_current: false });
    await this.loadMembers();
  }

  togglePast(): void {
    this.showPast = !this.showPast;
  }
}