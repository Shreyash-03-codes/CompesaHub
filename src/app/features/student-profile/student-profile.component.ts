import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import {
  UserProfile,
  Project,
  Certification,
  Achievement,
  Internship,
} from '../../core/models/user.model';

interface ProjectForm {
  title: string; description: string; technologies: string; url: string; start_date: string; end_date: string;
}
interface CertForm {
  name: string; issuer: string; issue_date: string; expiry_date: string; credential_url: string;
}
interface AchievementForm {
  title: string; description: string; date: string;
}
interface InternshipForm {
  company: string; role: string; description: string; start_date: string; end_date: string;
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss'],
})
export class StudentProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private route = inject(ActivatedRoute);
  private currentUser = this.authService.currentUser;

  profileId = '';
  profile = signal<UserProfile | null>(null);
  isOwnProfile = signal(false);
  loading = signal(true);
  saving = signal(false);

  editName = '';
  editPrn = '';
  editClass = '';
  editDivision = '';
  editBatch = '';
  editBio = '';
  editSkills = '';
  editGithub = '';
  editLinkedin = '';
  editLeetcode = '';
  editCodechef = '';
  editHackerrank = '';
  editPortfolio = '';
  editPhotoUrl = '';

  photoPreview = '';
  selectedPhoto: File | null = null;
  selectedResume: File | null = null;
  uploadingResume = false;

  projects = signal<Project[]>([]);
  certifications = signal<Certification[]>([]);
  achievements = signal<Achievement[]>([]);
  internships = signal<Internship[]>([]);

  showProjectForm = signal(false);
  showCertForm = signal(false);
  showAchievementForm = signal(false);
  showInternshipForm = signal(false);

  editingProjectId = signal<string | null>(null);
  editingCertId = signal<string | null>(null);
  editingAchievementId = signal<string | null>(null);
  editingInternshipId = signal<string | null>(null);

  projectForm: ProjectForm = { title: '', description: '', technologies: '', url: '', start_date: '', end_date: '' };
  certForm: CertForm = { name: '', issuer: '', issue_date: '', expiry_date: '', credential_url: '' };
  achievementForm: AchievementForm = { title: '', description: '', date: '' };
  internshipForm: InternshipForm = { company: '', role: '', description: '', start_date: '', end_date: '' };

  async ngOnInit(): Promise<void> {
    this.profileId = this.route.snapshot.paramMap.get('id') || this.currentUser?.id || '';
    this.isOwnProfile.set(this.profileId === this.currentUser?.id);

    try {
      const profile = await this.supabase.getProfile(this.profileId);
      this.profile.set(profile);
      this.populateForm(profile);
      if (this.isOwnProfile()) {
        await Promise.all([
          this.loadProjects(),
          this.loadCertifications(),
          this.loadAchievements(),
          this.loadInternships(),
        ]);
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    } finally {
      this.loading.set(false);
    }
  }

  private populateForm(p: UserProfile | null): void {
    if (!p) return;
    this.editName = p.name || '';
    this.editPrn = p.prn || '';
    this.editClass = p.class || '';
    this.editDivision = p.division || '';
    this.editBatch = p.batch || '';
    this.editBio = p.bio || '';
    this.editSkills = (p.skills || []).join(', ');
    this.editGithub = p.github_url || '';
    this.editLinkedin = p.linkedin_url || '';
    this.editLeetcode = p.leetcode_url || '';
    this.editCodechef = p.codechef_url || '';
    this.editHackerrank = p.hackerrank_url || '';
    this.editPortfolio = p.portfolio_url || '';
    this.editPhotoUrl = p.photo_url || '';
    this.photoPreview = p.photo_url || '';
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedPhoto = file;
    const reader = new FileReader();
    reader.onload = () => (this.photoPreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  onResumeSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedResume = file;
  }

  async saveProfile(): Promise<void> {
    if (!this.isOwnProfile()) return;
    this.saving.set(true);
    try {
      let photoUrl = this.editPhotoUrl;
      if (this.selectedPhoto) {
        photoUrl = await this.supabase.uploadFile('profiles', `${this.profileId}/photo`, this.selectedPhoto);
      }
      let resumeUrl = this.profile()?.resume_url || '';
      if (this.selectedResume) {
        this.uploadingResume = true;
        resumeUrl = await this.supabase.uploadFile('resumes', `${this.profileId}/resume`, this.selectedResume);
        this.uploadingResume = false;
      }
      const skills = this.editSkills.split(',').map(s => s.trim()).filter(Boolean);
      await this.supabase.updateProfile(this.profileId, {
        name: this.editName,
        prn: this.editPrn,
        class: this.editClass,
        division: this.editDivision,
        batch: this.editBatch,
        bio: this.editBio,
        skills,
        photo_url: photoUrl,
        resume_url: resumeUrl,
        github_url: this.editGithub,
        linkedin_url: this.editLinkedin,
        leetcode_url: this.editLeetcode,
        codechef_url: this.editCodechef,
        hackerrank_url: this.editHackerrank,
        portfolio_url: this.editPortfolio,
      });
      const updated = await this.supabase.getProfile(this.profileId);
      this.profile.set(updated);
      this.editPhotoUrl = photoUrl;
      this.photoPreview = photoUrl;
      this.selectedPhoto = null;
      this.selectedResume = null;
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      this.saving.set(false);
      this.uploadingResume = false;
    }
  }

  // --- Projects ---
  async loadProjects(): Promise<void> {
    const items = await this.supabase.getProjects(this.profileId);
    this.projects.set(items);
  }

  openAddProject(): void {
    this.projectForm = { title: '', description: '', technologies: '', url: '', start_date: '', end_date: '' };
    this.editingProjectId.set(null);
    this.showProjectForm.set(true);
  }

  openEditProject(p: Project): void {
    this.projectForm = {
      title: p.title,
      description: p.description,
      technologies: (p.technologies || []).join(', '),
      url: p.url || '',
      start_date: p.start_date || '',
      end_date: p.end_date || '',
    };
    this.editingProjectId.set(p.id);
    this.showProjectForm.set(true);
  }

  cancelProjectForm(): void {
    this.showProjectForm.set(false);
    this.editingProjectId.set(null);
  }

  async saveProject(): Promise<void> {
    const data: Partial<Project> = {
      user_id: this.profileId,
      title: this.projectForm.title,
      description: this.projectForm.description,
      technologies: this.projectForm.technologies.split(',').map(s => s.trim()).filter(Boolean),
      url: this.projectForm.url || undefined,
      start_date: this.projectForm.start_date || undefined,
      end_date: this.projectForm.end_date || undefined,
    };
    if (this.editingProjectId()) {
      data.id = this.editingProjectId()!;
    }
    await this.supabase.saveProject(data);
    await this.loadProjects();
    this.cancelProjectForm();
  }

  async deleteProject(id: string): Promise<void> {
    if (!confirm('Delete this project?')) return;
    await this.supabase.deleteProject(id);
    await this.loadProjects();
  }

  // --- Certifications ---
  async loadCertifications(): Promise<void> {
    const items = await this.supabase.getCertifications(this.profileId);
    this.certifications.set(items);
  }

  openAddCert(): void {
    this.certForm = { name: '', issuer: '', issue_date: '', expiry_date: '', credential_url: '' };
    this.editingCertId.set(null);
    this.showCertForm.set(true);
  }

  openEditCert(c: Certification): void {
    this.certForm = {
      name: c.name,
      issuer: c.issuer,
      issue_date: c.issue_date || '',
      expiry_date: c.expiry_date || '',
      credential_url: c.credential_url || '',
    };
    this.editingCertId.set(c.id);
    this.showCertForm.set(true);
  }

  cancelCertForm(): void {
    this.showCertForm.set(false);
    this.editingCertId.set(null);
  }

  async saveCertification(): Promise<void> {
    const data: Partial<Certification> = {
      user_id: this.profileId,
      name: this.certForm.name,
      issuer: this.certForm.issuer,
      issue_date: this.certForm.issue_date || undefined,
      expiry_date: this.certForm.expiry_date || undefined,
      credential_url: this.certForm.credential_url || undefined,
    };
    if (this.editingCertId()) {
      data.id = this.editingCertId()!;
    }
    await this.supabase.saveCertification(data);
    await this.loadCertifications();
    this.cancelCertForm();
  }

  async deleteCertification(id: string): Promise<void> {
    if (!confirm('Delete this certification?')) return;
    await this.supabase.deleteCertification(id);
    await this.loadCertifications();
  }

  // --- Achievements ---
  async loadAchievements(): Promise<void> {
    const items = await this.supabase.getAchievements(this.profileId);
    this.achievements.set(items);
  }

  openAddAchievement(): void {
    this.achievementForm = { title: '', description: '', date: '' };
    this.editingAchievementId.set(null);
    this.showAchievementForm.set(true);
  }

  openEditAchievement(a: Achievement): void {
    this.achievementForm = {
      title: a.title,
      description: a.description,
      date: a.date || '',
    };
    this.editingAchievementId.set(a.id);
    this.showAchievementForm.set(true);
  }

  cancelAchievementForm(): void {
    this.showAchievementForm.set(false);
    this.editingAchievementId.set(null);
  }

  async saveAchievement(): Promise<void> {
    const data: Partial<Achievement> = {
      user_id: this.profileId,
      title: this.achievementForm.title,
      description: this.achievementForm.description,
      date: this.achievementForm.date || undefined,
    };
    if (this.editingAchievementId()) {
      data.id = this.editingAchievementId()!;
    }
    await this.supabase.saveAchievement(data);
    await this.loadAchievements();
    this.cancelAchievementForm();
  }

  async deleteAchievement(id: string): Promise<void> {
    if (!confirm('Delete this achievement?')) return;
    await this.supabase.deleteAchievement(id);
    await this.loadAchievements();
  }

  // --- Internships ---
  async loadInternships(): Promise<void> {
    const items = await this.supabase.getInternships(this.profileId);
    this.internships.set(items);
  }

  openAddInternship(): void {
    this.internshipForm = { company: '', role: '', description: '', start_date: '', end_date: '' };
    this.editingInternshipId.set(null);
    this.showInternshipForm.set(true);
  }

  openEditInternship(i: Internship): void {
    this.internshipForm = {
      company: i.company,
      role: i.role,
      description: i.description,
      start_date: i.start_date || '',
      end_date: i.end_date || '',
    };
    this.editingInternshipId.set(i.id);
    this.showInternshipForm.set(true);
  }

  cancelInternshipForm(): void {
    this.showInternshipForm.set(false);
    this.editingInternshipId.set(null);
  }

  async saveInternship(): Promise<void> {
    const data: Partial<Internship> = {
      user_id: this.profileId,
      company: this.internshipForm.company,
      role: this.internshipForm.role,
      description: this.internshipForm.description,
      start_date: this.internshipForm.start_date || undefined,
      end_date: this.internshipForm.end_date || undefined,
    };
    if (this.editingInternshipId()) {
      data.id = this.editingInternshipId()!;
    }
    await this.supabase.saveInternship(data);
    await this.loadInternships();
    this.cancelInternshipForm();
  }

  async deleteInternship(id: string): Promise<void> {
    if (!confirm('Delete this internship?')) return;
    await this.supabase.deleteInternship(id);
    await this.loadInternships();
  }
}
