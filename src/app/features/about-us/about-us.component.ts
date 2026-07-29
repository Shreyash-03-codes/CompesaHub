import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';
import { AboutContent } from '../../core/models/content.model';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  about: AboutContent | null = null;
  editing = false;
  submitting = false;

  editForm = this.fb.nonNullable.group({
    vision: ['', Validators.required],
    mission: ['', Validators.required],
    objectives: ['', Validators.required],
    structure: ['', Validators.required],
  });

  get isAdmin(): boolean {
    return this.auth.hasAnyRole(['Admin', 'Committee', 'Faculty']);
  }

  ngOnInit(): void {
    this.loadAbout();
  }

  async loadAbout(): Promise<void> {
    this.about = await this.supabase.getAboutContent();
    if (this.about) {
      this.editForm.patchValue({
        ...this.about,
        objectives: this.about.objectives.join('\n'),
      });
    }
  }

  enableEdit(): void {
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    if (this.about) {
      this.editForm.patchValue({
        ...this.about,
        objectives: this.about.objectives.join('\n'),
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.editForm.invalid) return;
    this.submitting = true;
    const raw = this.editForm.getRawValue();
    const data: Partial<AboutContent> = {
      vision: raw.vision,
      mission: raw.mission,
      objectives: raw.objectives.split('\n').map(s => s.trim()).filter(Boolean),
      structure: raw.structure,
    };
    if (this.about?.id) {
      data.id = this.about.id;
    }
    await this.supabase.saveAboutContent(data);
    this.submitting = false;
    this.editing = false;
    await this.loadAbout();
  }

  get objectivesList(): string[] {
    return this.about?.objectives || [];
  }
}