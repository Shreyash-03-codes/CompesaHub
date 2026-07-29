import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordsMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss'],
})
export class SetPasswordComponent {
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  submitted = false;
  submitting = false;
  error = '';

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting = true;
    this.error = '';
    try {
      const password = this.form.getRawValue().password;
      const { error: updateError } = await this.supabaseService.supabase.auth.updateUser({ password });
      if (updateError) {
        this.error = updateError.message;
      } else {
        this.submitted = true;
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      }
    } catch {
      this.error = 'An unexpected error occurred. Please try again.';
    } finally {
      this.submitting = false;
    }
  }
}
