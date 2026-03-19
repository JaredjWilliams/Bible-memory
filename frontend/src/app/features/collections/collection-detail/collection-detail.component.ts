import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Verse, VerseService } from '../../../core/services/verse.service';
import { PassageService } from '../../../core/services/passage.service';
import { CollectionService } from '../../../core/services/collection.service';
import { ActiveProfileService } from '../../../core/services/active-profile.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-collection-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="header-row">
      <a routerLink="/collections" class="back">← Collections</a>
    </div>
    <h1>{{ collectionName() }}</h1>
    <a [routerLink]="['/typing', collectionId]" class="btn" style="margin-bottom: 1rem;">Practice Typing</a>

    <div class="add-verse-section">
      <h2>Add Verse</h2>
      <div class="tabs">
        <button type="button" [class.active]="!esvMode()" (click)="esvMode.set(false)">Manual</button>
        <button type="button" [class.active]="esvMode()" (click)="esvMode.set(true)">From ESV</button>
      </div>

      @if (esvMode()) {
        <form (ngSubmit)="onAddFromEsv()" class="add-form">
          <input type="text" [(ngModel)]="esvQuery" name="esvQuery" placeholder="e.g. John 3:16 or Matthew 1:1-3" required />
          <button type="submit" [disabled]="loading">Fetch & Add</button>
        </form>
      } @else {
        <form (ngSubmit)="onAddManual()" class="add-form">
          <input type="text" [(ngModel)]="manualRef" name="reference" placeholder="Reference (e.g. John 3:16)" required />
          <textarea [(ngModel)]="manualText" name="text" placeholder="Verse text" rows="4" required></textarea>
          <button type="submit" [disabled]="loading">Add</button>
        </form>
      }
    </div>

    <h2>Verses</h2>
    @if (verses().length === 0) {
      <div class="empty-state">
        <p>No verses in this collection. Add one above.</p>
      </div>
    } @else {
      <ul class="verse-list">
        @for (v of verses(); track v.id) {
          <li>
            <span class="ref">{{ v.reference }}</span>
            <p class="text">{{ v.text }}</p>
            <button type="button" class="delete-btn" (click)="confirmDeleteVerse(v)" title="Delete">×</button>
          </li>
        }
      </ul>
    }

    @if (verseToDelete()) {
      <div class="modal-overlay" (click)="verseToDelete.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <p>Delete "{{ verseToDelete()?.reference }}"?</p>
          <div class="modal-actions">
            <button type="button" class="btn danger" (click)="doDeleteVerse()">Delete</button>
            <button type="button" (click)="verseToDelete.set(null)">Cancel</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-row { margin-bottom: 1rem; }
    .back { color: var(--primary); }
    .add-verse-section {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      margin: 1rem 0;
    }
    .add-verse-section h2 { margin: 0 0 1rem; font-size: 1rem; color: var(--primary); }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .tabs button {
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--secondary);
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
    }
    .tabs button.active { background: var(--primary); color: white; border-color: var(--primary); }
    .add-form input, .add-form textarea {
      width: 100%;
      padding: 0.6rem;
      border: 1px solid var(--secondary);
      border-radius: 6px;
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }
    .add-form textarea { resize: vertical; min-height: 80px; }
    .add-form button {
      padding: 0.5rem 1rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .empty-state {
      text-align: center;
      padding: 2rem;
      background: var(--surface);
      border-radius: 12px;
      color: var(--secondary-text);
    }
    .verse-list { list-style: none; padding: 0; margin: 1rem 0; }
    .verse-list li {
      background: var(--surface);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      position: relative;
    }
    .verse-list .ref { font-weight: 600; color: var(--primary); }
    .verse-list .text { margin: 0.5rem 0 0; font-size: 0.95rem; line-height: 1.5; }
    .verse-list .delete-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 28px; height: 28px;
      border: none; background: transparent;
      color: var(--error); font-size: 1.25rem;
      cursor: pointer; line-height: 1;
    }
    .btn.danger { background: var(--error); color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; }
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
    .btn { display: inline-block; padding: 0.5rem 1rem; background: var(--primary); color: white; border-radius: 8px; text-decoration: none; }
  `]
})
export class CollectionDetailComponent implements OnInit {
  collectionId = 0;
  collectionName = signal('');
  verses = signal<Verse[]>([]);
  esvMode = signal(true);
  esvQuery = '';
  manualRef = '';
  manualText = '';
  loading = false;
  verseToDelete = signal<Verse | null>(null);

  constructor(
    private route: ActivatedRoute,
    private verseService: VerseService,
    private collectionService: CollectionService,
    private passageService: PassageService,
    private activeProfile: ActiveProfileService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.collectionId = +id;
      this.loadVerses();
      this.loadCollectionName();
    }
  }

  private sanitizeEsvText(text: string): string {
    return text
      .replace(/\s*\(ESV\)\s*$/i, '')
      .replace(/\s*Footnotes?\s+.*$/is, '')
      .trim();
  }

  loadCollectionName(): void {
    const p = this.activeProfile.activeProfile();
    if (!p) return;
    this.collectionService.list(p.id).subscribe({
      next: (list) => {
        const c = list.find((x) => x.id === this.collectionId);
        if (c) this.collectionName.set(c.name);
        else this.collectionName.set('Collection');
      }
    });
  }

  loadVerses(): void {
    this.verseService.list(this.collectionId).subscribe({
      next: (list) => this.verses.set(list),
      error: () => this.toast.error('Failed to load verses')
    });
  }

  onAddFromEsv(): void {
    if (!this.esvQuery.trim()) return;
    this.loading = true;
    this.passageService.fetch(this.esvQuery.trim()).subscribe({
      next: (res) => {
        const cleanText = this.sanitizeEsvText(res.text);
        this.verseService.create(this.collectionId, this.esvQuery.trim(), cleanText, 'ESV').subscribe({
          next: (v) => {
            this.verses.update((list) => [...list, v]);
            this.esvQuery = '';
            this.loading = false;
            this.toast.success('Verse added');
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  onAddManual(): void {
    if (!this.manualRef.trim() || !this.manualText.trim()) return;
    this.loading = true;
    this.verseService.create(this.collectionId, this.manualRef.trim(), this.manualText.trim()).subscribe({
      next: (v) => {
        this.verses.update((list) => [...list, v]);
        this.manualRef = '';
        this.manualText = '';
        this.loading = false;
        this.toast.success('Verse added');
      },
      error: () => { this.loading = false; }
    });
  }

  confirmDeleteVerse(v: Verse): void {
    this.verseToDelete.set(v);
  }

  doDeleteVerse(): void {
    const v = this.verseToDelete();
    if (!v) return;
    this.verseService.delete(v.id).subscribe({
      next: () => {
        this.verses.update((list) => list.filter((x) => x.id !== v.id));
        this.verseToDelete.set(null);
        this.toast.success('Verse deleted');
      },
      error: () => {}
    });
  }
}
