import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Collection, CollectionService } from '../../../core/services/collection.service';
import { Profile, ProfileService } from '../../../core/services/profile.service';
import { ActiveProfileService } from '../../../core/services/active-profile.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-collection-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <h1>Collections</h1>

    @if (!activeProfile.hasActiveProfile()) {
      <div class="profile-selector">
        @if (profiles().length === 0 && !showProfileForm()) {
          <div class="empty-state">
            <p>Create your first profile to get started.</p>
            <button type="button" class="btn" (click)="showProfileForm.set(true)">Create Profile</button>
          </div>
        } @else {
          @if (showProfileForm()) {
            <div class="form-card">
              <h2>New Profile</h2>
              <form (ngSubmit)="onCreateProfile()">
                <input type="text" [(ngModel)]="newProfileName" name="profileName" placeholder="Profile name" required />
                <div class="form-actions">
                  <button type="submit" [disabled]="profileLoading">Create</button>
                  <button type="button" (click)="showProfileForm.set(false); newProfileName = ''">Cancel</button>
                </div>
              </form>
            </div>
          }
          @if (profiles().length > 0) {
            <ul class="profile-list">
              @for (p of profiles(); track p.id) {
                <li class="profile-item">
                  <button type="button" class="select-btn" (click)="selectProfile(p)">{{ p.name }}</button>
                  <button type="button" class="delete-btn" (click)="confirmDeleteProfile(p)" title="Delete">×</button>
                </li>
              }
            </ul>
            @if (!showProfileForm()) {
              <button type="button" class="btn secondary" (click)="showProfileForm.set(true)">Add Profile</button>
            }
          }
        }
      </div>
    } @else if (collections().length === 0 && !showForm()) {
      <div class="empty-state">
        <p>No collections yet. Create one to add verses.</p>
        <button type="button" class="btn" (click)="showForm.set(true)">Create Collection</button>
      </div>
    } @else {
      @if (showForm()) {
        <div class="form-card">
          <h2>New Collection</h2>
          <form (ngSubmit)="onCreate()">
            <input type="text" [(ngModel)]="newName" name="name" placeholder="Collection name" required />
            <div class="form-actions">
              <button type="submit" [disabled]="loading">Create</button>
              <button type="button" (click)="showForm.set(false); newName = ''">Cancel</button>
            </div>
          </form>
        </div>
      }

      <ul class="collection-list">
        @for (c of collections(); track c.id) {
          <li>
            <a [routerLink]="['/collections', c.id]" class="collection-link">{{ c.name }}</a>
            <button type="button" class="delete-btn" (click)="confirmDelete(c)" title="Delete">×</button>
          </li>
        }
      </ul>

      @if (collections().length > 0 && !showForm()) {
        <button type="button" class="btn secondary" (click)="showForm.set(true)">Add Collection</button>
      }
    }

    @if (collectionToDelete()) {
      <div class="modal-overlay" (click)="collectionToDelete.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <p>Delete "{{ collectionToDelete()?.name }}" and all its verses?</p>
          <div class="modal-actions">
            <button type="button" class="btn danger" (click)="doDelete()">Delete</button>
            <button type="button" (click)="collectionToDelete.set(null)">Cancel</button>
          </div>
        </div>
      </div>
    }
    @if (profileToDelete()) {
      <div class="modal-overlay" (click)="profileToDelete.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <p>Delete profile "{{ profileToDelete()?.name }}" and all its collections and verses?</p>
          <div class="modal-actions">
            <button type="button" class="btn danger" (click)="doDeleteProfile()">Delete</button>
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
    .empty-state p { color: var(--secondary-text); margin-bottom: 1rem; }
    .form-card {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1rem;
    }
    .form-card h2 { margin: 0 0 1rem; font-size: 1.1rem; color: var(--primary); }
    .form-card input {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--secondary);
      border-radius: 6px;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    .form-actions { display: flex; gap: 0.5rem; }
    .form-actions button { padding: 0.5rem 1rem; border-radius: 6px; border: none; font-size: 0.95rem; }
    .form-actions button[type="submit"] { background: var(--primary); color: white; }
    .profile-list { list-style: none; padding: 0; margin: 1rem 0; }
    .profile-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--surface);
      border-radius: 8px;
      margin-bottom: 0.5rem;
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
    .collection-list { list-style: none; padding: 0; margin: 1rem 0; }
    .collection-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--surface);
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    .collection-link { flex: 1; font-size: 1rem; }
    .delete-btn {
      width: 32px; height: 32px;
      border: none; background: transparent;
      color: var(--error); font-size: 1.5rem;
      cursor: pointer; line-height: 1;
    }
    .btn { padding: 0.6rem 1.2rem; border-radius: 8px; border: none; font-size: 1rem; cursor: pointer; background: var(--primary); color: white; }
    .btn.secondary { background: var(--secondary); color: var(--primary-text); }
    .btn.danger { background: var(--error); color: white; }
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      max-width: 360px;
      width: 90%;
    }
    .modal p { margin: 0 0 1rem; }
    .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
  `]
})
export class CollectionListComponent implements OnInit {
  collections = signal<Collection[]>([]);
  showForm = signal(false);
  newName = '';
  loading = false;
  collectionToDelete = signal<Collection | null>(null);
  profiles = signal<Profile[]>([]);
  showProfileForm = signal(false);
  newProfileName = '';
  profileLoading = false;
  profileToDelete = signal<Profile | null>(null);

  constructor(
    private collectionService: CollectionService,
    private profileService: ProfileService,
    public activeProfile: ActiveProfileService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
    this.load();
  }

  loadProfiles(): void {
    this.profileService.list().subscribe({
      next: (list) => this.profiles.set(list),
      error: () => this.toast.error('Failed to load profiles')
    });
  }

  load(): void {
    const p = this.activeProfile.activeProfile();
    if (!p) return;
    this.collectionService.list(p.id).subscribe({
      next: (list) => this.collections.set(list),
      error: () => this.toast.error('Failed to load collections')
    });
  }

  onCreateProfile(): void {
    if (!this.newProfileName.trim()) return;
    this.profileLoading = true;
    this.profileService.create(this.newProfileName.trim()).subscribe({
      next: (p) => {
        this.profiles.update((list) => [...list, p]);
        this.activeProfile.setActive(p);
        this.newProfileName = '';
        this.showProfileForm.set(false);
        this.profileLoading = false;
        this.toast.success('Profile created');
        this.load();
      },
      error: () => {
        this.profileLoading = false;
      }
    });
  }

  selectProfile(p: Profile): void {
    this.activeProfile.setActive(p);
    this.toast.info(`Selected: ${p.name}`);
    this.load();
  }

  confirmDeleteProfile(p: Profile): void {
    this.profileToDelete.set(p);
  }

  doDeleteProfile(): void {
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

  onCreate(): void {
    if (!this.newName.trim()) return;
    const p = this.activeProfile.activeProfile();
    if (!p) return;
    this.loading = true;
    this.collectionService.create(p.id, this.newName.trim()).subscribe({
      next: (c) => {
        this.collections.update((list) => [...list, c]);
        this.newName = '';
        this.showForm.set(false);
        this.loading = false;
        this.toast.success('Collection created');
      },
      error: () => { this.loading = false; }
    });
  }

  confirmDelete(c: Collection): void {
    this.collectionToDelete.set(c);
  }

  doDelete(): void {
    const c = this.collectionToDelete();
    if (!c) return;
    this.collectionService.delete(c.id).subscribe({
      next: () => {
        this.collections.update((list) => list.filter((x) => x.id !== c.id));
        this.collectionToDelete.set(null);
        this.toast.success('Collection deleted');
      },
      error: () => {}
    });
  }
}
