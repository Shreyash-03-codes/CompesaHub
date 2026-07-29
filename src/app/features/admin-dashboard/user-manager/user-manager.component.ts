import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { UserRole, ALL_ROLES } from '../../../core/models/user.model';

interface CreatedUser {
  email: string;
  roles: UserRole[];
  status: 'success' | 'error';
  error?: string;
}

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-manager.component.html',
  styleUrls: ['./user-manager.component.scss'],
})
export class UserManagerComponent {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);

  allRoles = ALL_ROLES;

  singleForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    roles: this.fb.array<boolean>(ALL_ROLES.map(() => false)),
  });

  singleSubmitting = false;
  singleError = '';

  bulkFile: File | null = null;
  bulkSubmitting = false;
  bulkError = '';

  createdUsers: CreatedUser[] = [];

  get selectedRoles(): UserRole[] {
    return ALL_ROLES.filter((_, i) => this.singleForm.controls.roles.at(i).value);
  }

  toggleRole(index: number): void {
    const control = this.singleForm.controls.roles.at(index);
    control.setValue(!control.value);
  }

  async onSubmitSingle(): Promise<void> {
    if (this.singleForm.invalid || this.selectedRoles.length === 0) return;
    this.singleSubmitting = true;
    this.singleError = '';
    const email = this.singleForm.getRawValue().email;

    try {
      await this.supabase.inviteUser(email, this.selectedRoles);
      this.createdUsers.unshift({ email, roles: [...this.selectedRoles], status: 'success' });
      this.singleForm.reset();
    } catch (err: any) {
      this.singleError = err.message || 'Failed to invite user';
      this.createdUsers.unshift({ email, roles: [...this.selectedRoles], status: 'error', error: this.singleError });
    }
    this.singleSubmitting = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.bulkFile = input.files[0];
    }
  }

  async onBulkImport(): Promise<void> {
    if (!this.bulkFile) return;
    this.bulkSubmitting = true;
    this.bulkError = '';

    try {
      const text = await this.bulkFile.text();
      const lines = text.split('\n').filter(l => l.trim());
      const parsed = lines.map(line => {
        const [email, rolesStr] = line.split(',').map(s => s.trim());
        if (!email || !rolesStr) throw new Error('Invalid CSV format. Expected: email,role1|role2');
        const roles = rolesStr.split('|') as UserRole[];
        const invalid = roles.filter(r => !ALL_ROLES.includes(r));
        if (invalid.length) throw new Error(`Invalid roles: ${invalid.join(', ')}`);
        return { email, roles };
      });

      for (const item of parsed) {
        try {
          await this.supabase.inviteUser(item.email, item.roles);
          this.createdUsers.unshift({ email: item.email, roles: item.roles, status: 'success' });
        } catch (err: any) {
          this.createdUsers.unshift({ email: item.email, roles: item.roles, status: 'error', error: err.message });
        }
      }
    } catch (err: any) {
      this.bulkError = err.message || 'Bulk import failed';
    }
    this.bulkSubmitting = false;
    this.bulkFile = null;
  }
}
