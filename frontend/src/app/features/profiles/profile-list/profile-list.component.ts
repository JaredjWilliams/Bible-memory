import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Profile, ProfileService } from '../../../core/services/profile.service';
import { ActiveProfileService } from '../../../core/services/active-profile.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <h1>Profiles</h1>

    @if (profiles().length === 0 && !showForm()) {
      <div class="empty-state">
        <p>Create your first profile to get started.</p>
        <button type="button" class="btn" (click)="showForm.set(true)">Create Profile</button>
      </div>
    } @else {
      @if (showForm()) {
        <div class="form-card">
          <h2>New Profile</h2>
          <form (ngSubmit)="onCreate()">
            <input type="text" [(ngModel)]="newName" name="name" placeholder="Profile name" required />
            <div class="form-actions">
              <button type="submit" [disabled]="loading">Create</button>
              <button type="button" (click)="showForm.set(false); newName = ''">Cancel</button>
            </div>
          </form>
        </div>
      }

      <ul class="profile-list">
        @for (p of profiles(); track p.id) {
          <li class="profile-item" [class.selected]="activeProfile.activeProfile()?.id === p.id">
            <button type="button" class="select-btn" (click)="selectProfile(p)">
              {{ p.name }}
            </button>
            <button type="button" class="delete-btn" (click)="confirmDelete(p)" title="Delete">×</button>
          </li>
        }
      </ul>

      @if (profiles().length > 0 && !showForm()) {
        <button type="button" class="btn secondary" (click)="showForm.set(true)">Add Profile</button>
        @if (activeProfile.hasActiveProfile()) {
          <a routerLink="/collections" class="btn" style="margin-left: 0.5rem;">Go to Collections</a>
        }
      }
    }

    @if (profileToDelete()) {
      <div class="modal-overlay" (click)="profileToDelete.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <p>Delete profile "{{ profileToDelete()?.name }}" and all its collections and verses?</p>
          <div class="modal-actions">
            <button type="button" class="btn danger" (click)="doDelete()">Delete</button>
            <button type="button" (click)="profileToDelete.set(null)">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: var(--surface);
      border-radius: 12px;
      margin: 1rem 0;
    }
    .empty-state p {
      color: var(--secondary-text);
      margin-bottom: 1rem;
    }
    .form-card {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1rem;
    }
    .form-card h2 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: var(--primary);
    }
    .form-card input {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--secondary);
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    .form-actions {
      display: flex;
      gap: 0.5rem;
    }
    .form-actions button {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      border: none;
      font-size: 0.95rem;
    }
    .form-actions button[type="submit"] {
      background: var(--primary);
      color: white;
    }
    .profile-list {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }
    .profile-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--surface);
      border-radius: 8px;
      margin-bottom: 0.5rem;
      border: 2px solid transparent;
    }
    .profile-item.selected {
      border-color: var(--primary);
    }
    .select-btn {
      flex: 1;
      text-align: left;
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0;
    }
    .delete-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: var(--error);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }
    .btn {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      background: var(--primary);
      color: white;
    }
    .btn.secondary {
      background: var(--secondary);
      color: var(--primary-text);
    }
    .btn.danger {
      background: var(--error);
      color: white;
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      max-width: 360px;
      width: 90%;
    }
    .modal p {
      margin: 0 0 1rem;
    }
    .modal-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  `]
})
export class ProfileListComponent implements OnInit {
  profiles = signal<Profile[]>([]);
  showForm = signal(false);
  newName = '';
  loading = false;
  profileToDelete = signal<Profile | null>(null);

  constructor(
    private profileService: ProfileService,
    public activeProfile: ActiveProfileService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.profileService.list().subscribe({
      next: (list) => this.profiles.set(list),
      error: () => this.toast.error('Failed to load profiles')
    });
  }

  onCreate(): void {
    if (!this.newName.trim()) return;
    this.loading = true;
    this.profileService.create(this.newName.trim()).subscribe({
      next: (p) => {
        this.profiles.update((list) => [...list, p]);
        this.newName = '';
        this.showForm.set(false);
        this.loading = false;
        this.toast.success('Profile created');
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  selectProfile(p: Profile): void {
    this.activeProfile.setActive(p);
    this.toast.info(`Selected: ${p.name}`);
  }

  confirmDelete(p: Profile): void {
    this.profileToDelete.set(p);
  }

  doDelete(): void {
    const p = this.profileToDelete();
    if (!p) return;
    this.profileService.delete(p.id).subscribe({
      next: () => {
        this.profiles.update((list) => list.filter((x) => x.id !== p.id));
        if (this.activeProfile.activeProfile()?.id === p.id) {
          this.activeProfile.setActive(null);
        }
        this.profileToDelete.set(null);
        this.toast.success('Profile deleted');
      },
      error: () => {}
    });
  }
}
