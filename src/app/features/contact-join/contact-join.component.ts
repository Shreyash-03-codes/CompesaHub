import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-contact-join',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contact-join.component.html',
  styleUrls: ['./contact-join.component.scss']
})
export class ContactJoinComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  submitted = false;
  submitting = false;

  contactForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    message: ['', Validators.required],
    inquiry_type: ['general', Validators.required],
  });

  readonly inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'join', label: 'Join COMPESA' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'partnership', label: 'Partnership / Sponsorship' },
    { value: 'other', label: 'Other' },
  ];

  ngOnInit(): void {
    const profile = this.auth.profile;
    if (profile) {
      this.contactForm.patchValue({
        name: profile.name,
        email: profile.email,
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) return;
    this.submitting = true;
    const data = this.contactForm.getRawValue();
    await this.supabase.submitContact(data);

    try {
      await this.supabase.sendEmail(
        'admin@compesa.in',
        `New Inquiry: ${data.inquiry_type}`,
        `<p>Name: ${data.name}</p><p>Email: ${data.email}</p><p>Phone: ${data.phone}</p><p>Type: ${data.inquiry_type}</p><p>Message: ${data.message}</p>`
      );
    } catch {
      // Email notification is best-effort
    }

    this.submitting = false;
    this.submitted = true;
  }

  resetForm(): void {
    this.submitted = false;
    this.contactForm.reset({ inquiry_type: 'general' });
  }
}