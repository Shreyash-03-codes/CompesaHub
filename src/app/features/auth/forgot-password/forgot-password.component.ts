import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submitted = false;
  sending = false;
  error = '';

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.sending = true;
    this.error = '';
    try {
      await this.auth.resetPassword(this.form.getRawValue().email);
      this.submitted = true;
    } catch {
      this.error = 'Failed to send reset email. Please try again.';
    } finally {
      this.sending = false;
    }
  }
}
