import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  error = '';
  submitting = false;

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.submitting = true;
    this.error = '';
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.login(email, password);
    this.submitting = false;
    if (result.error) {
      this.error = result.error;
    } else {
      await this.router.navigate(['/dashboard']);
    }
  }
}
