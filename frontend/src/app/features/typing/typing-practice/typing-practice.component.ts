import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Verse, VerseService } from '../../../core/services/verse.service';
import { PracticeService } from '../../../core/services/practice.service';
import { ActiveProfileService } from '../../../core/services/active-profile.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-typing-practice',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="header-row">
      <button type="button" class="back" (click)="goBack()">← Back</button>
    </div>
    <h1>Typing Practice</h1>

    @if (verses().length === 0) {
      <div class="empty-state">
        <p>No verses to practice. Add verses to your collection first.</p>
        <a routerLink="/collections" class="btn">Go to Collections</a>
      </div>
    } @else {
      @if (dueCount() > 0) {
        <div class="due-banner">
          {{ dueCount() }} verse(s) due for review
        </div>
      }
      <div class="range-selector">
        <h2>Select verses</h2>
        <p>From verse <select [(ngModel)]="startIdx" (ngModelChange)="onRangeChange()">
          @for (v of verses(); track v.id; let i = $index) {
            <option [value]="i">{{ i + 1 }}. {{ v.reference }}</option>
          }
        </select>
        to verse <select [(ngModel)]="endIdx" (ngModelChange)="onRangeChange()">
          @for (v of verses(); track v.id; let i = $index) {
            <option [value]="i">{{ i + 1 }}. {{ v.reference }}</option>
          }
        </select>
        </p>
      </div>

      @if (combinedText()) {
        <div class="progress-indicators">
          <div class="progress-bar">
            <span class="progress-label">Total: {{ totalProgressPercent() }}%</span>
            <div class="progress-track"><div class="progress-fill" [style.width.%]="totalProgressPercent()"></div></div>
          </div>
          @if (verseBoundaries().length > 2) {
            <div class="progress-bar">
              <span class="progress-label">Current verse: {{ currentVerseProgressPercent() }}%</span>
              <div class="progress-track"><div class="progress-fill" [style.width.%]="currentVerseProgressPercent()"></div></div>
            </div>
          }
        </div>
        <div class="reference">{{ referenceRange() }}</div>
        <div #typingArea class="typing-area" tabindex="0" (keydown)="onKeyDown($event)" (click)="focusArea($event)">
          <div class="chars">
            @for (ch of chars(); track $index; let i = $index) {
              @if (i < typedCount()) {
                <span [class.correct]="typedChars()[i] === ch" [class.incorrect]="typedChars()[i] !== ch">{{ ch }}</span>
              } @else if (i === typedCount()) {
                <span class="cursor">|</span>
              } @else {
                <span class="pending">{{ ch }}</span>
              }
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .header-row { margin-bottom: 1rem; }
    .back { color: var(--primary); }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: var(--surface);
      border-radius: 12px;
    }
    .empty-state p { color: var(--secondary-text); margin-bottom: 1rem; }
    .btn { display: inline-block; padding: 0.6rem 1.2rem; background: var(--primary); color: white; border-radius: 8px; text-decoration: none; }
    .range-selector {
      background: var(--surface);
      padding: 1rem;
      border-radius: 12px;
      margin: 1rem 0;
    }
    .range-selector h2 { margin: 0 0 0.5rem; font-size: 1rem; }
    .range-selector select {
      padding: 0.4rem;
      border: 1px solid var(--secondary);
      border-radius: 6px;
      margin: 0 0.25rem;
    }
    .reference {
      font-weight: 600;
      color: var(--primary);
      margin: 1rem 0 0.5rem;
    }
    .typing-area {
      background: var(--surface);
      padding: 1.5rem;
      border-radius: 12px;
      min-height: 200px;
      font-size: 1.1rem;
      line-height: 1.8;
      outline: none;
      border: 2px solid var(--secondary);
    }
    .typing-area:focus { border-color: var(--primary); }
    .chars span { display: inline; }
    .chars .correct { background: #27ae60; color: white; }
    .chars .incorrect { color: #c0392b; font-weight: 600; }
    .chars .cursor { background: var(--primary); color: white; animation: blink 1s step-end infinite; }
    .chars .pending { color: var(--secondary-text); }
    @keyframes blink { 50% { opacity: 0; } }
    .due-banner {
      background: #f0f7f0;
      border: 1px solid #27ae60;
      color: #1e8449;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .progress-indicators { margin: 1rem 0; }
    .progress-bar { margin-bottom: 0.5rem; }
    .progress-label { font-size: 0.9rem; color: var(--secondary-text); display: block; margin-bottom: 0.25rem; }
    .progress-track {
      height: 6px;
      background: var(--secondary);
      border-radius: 3px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: var(--primary);
      transition: width 0.15s ease;
    }
    .back {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      font-size: 1rem;
      padding: 0;
    }
    .back:hover { text-decoration: underline; }
  `]
})
export class TypingPracticeComponent implements OnInit, AfterViewChecked {
  collectionId = 0;
  verses = signal<Verse[]>([]);
  startIdx = 0;
  endIdx = 0;
  combinedText = signal('');
  chars = signal<string[]>([]);
  typedChars = signal<string[]>([]);
  typedCount = signal(0);
  referenceRange = signal('');
  dueCount = signal(0);
  verseBoundaries = signal<number[]>([]); // start index of each verse in combined text

  @ViewChild('typingArea') typingAreaRef?: ElementRef<HTMLDivElement>;
  private needsFocus = false;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private verseService: VerseService,
    private practiceService: PracticeService,
    public activeProfile: ActiveProfileService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('collectionId');
    if (id) {
      this.collectionId = +id;
      this.loadVerses();
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsFocus && this.typingAreaRef?.nativeElement) {
      this.typingAreaRef.nativeElement.focus();
      this.needsFocus = false;
    }
  }

  goBack(): void {
    this.location.back();
  }

  totalProgressPercent(): number {
    const total = this.chars().length;
    if (total === 0) return 0;
    const correct = this.typedChars().filter((t, i) => t === this.chars()[i]).length;
    return Math.round((correct / total) * 100);
  }

  currentVerseProgressPercent(): number {
    const boundaries = this.verseBoundaries();
    if (boundaries.length < 2) return this.totalProgressPercent();
    const pos = this.typedCount();
    let verseStart = 0;
    let verseEnd = this.chars().length;
    for (let i = 0; i < boundaries.length - 1; i++) {
      if (pos >= boundaries[i] && pos < boundaries[i + 1]) {
        verseStart = boundaries[i];
        verseEnd = boundaries[i + 1] - 2; // end before newline separator
        break;
      }
    }
    const verseLen = verseEnd - verseStart + 1;
    if (verseLen <= 0) return 100;
    const typedInVerse = Math.min(pos - verseStart, verseLen);
    const correctInVerse = this.typedChars()
      .slice(verseStart, verseStart + typedInVerse)
      .filter((t, i) => t === this.chars()[verseStart + i]).length;
    return Math.round((correctInVerse / verseLen) * 100);
  }

  loadVerses(): void {
    this.verseService.list(this.collectionId).subscribe({
      next: (list) => {
        this.verses.set(list);
        if (list.length > 0) {
          this.endIdx = list.length - 1;
          this.onRangeChange();
        }
      },
      error: () => this.toast.error('Failed to load verses')
    });
    this.practiceService.getDueVerses(this.collectionId).subscribe({
      next: (due) => this.dueCount.set(due.length)
    });
  }

  onRangeChange(): void {
    const list = this.verses();
    if (list.length === 0) return;
    this.startIdx = Math.min(this.startIdx, list.length - 1);
    this.endIdx = Math.max(this.endIdx, this.startIdx);
    const selected = list.slice(this.startIdx, this.endIdx + 1);
    const text = selected.map((v) => v.text).join('\n');
    this.combinedText.set(text);
    this.chars.set([...text]);
    this.typedChars.set([]);
    this.typedCount.set(0);
    const boundaries: number[] = [0];
    let idx = 0;
    for (const v of selected) {
      idx += v.text.length + 1; // +1 for newline between verses
      boundaries.push(idx);
    }
    this.verseBoundaries.set(boundaries);
    const refs = selected.map((v) => v.reference);
    this.referenceRange.set(refs.length === 1 ? refs[0] : refs[0] + '–' + refs[refs.length - 1]);
    this.needsFocus = true;
  }

  private isPunctuationOrSpace(ch: string): boolean {
    return /[\s\p{P}\p{S}]/u.test(ch);
  }

  /** Accept typed key when expected is punctuation - allow keyboard equivalents (e.g. straight " for curly ") */
  private isAcceptablePunctuation(expected: string, typed: string): boolean {
    if (typed === expected) return true;
    // Any quote for any quote - verse may have " " " user types " or '
    const allQuotes = '"\'"\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B';
    if (allQuotes.includes(expected) && allQuotes.includes(typed)) return true;
    // Keyboard quote keys (Shift+', Shift+2 on some layouts) - accept when expected is any quote
    const keyboardQuotes = '"\'`';
    if (allQuotes.includes(expected) && keyboardQuotes.includes(typed)) return true;
    // Hyphen/dash equivalents
    const dashChars = ['-', '–', '—', '−', '‐'];
    if (dashChars.includes(expected) && dashChars.includes(typed)) return true;
    return false;
  }

  focusArea(e: Event): void {
    (e.currentTarget as HTMLElement).focus();
  }

  onKeyDown(e: KeyboardEvent): void {
    const text = this.combinedText();
    if (!text) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      const count = this.typedCount();
      if (count > 0) {
        this.typedChars.update((arr) => arr.slice(0, -1));
        this.typedCount.update((n) => n - 1);
      }
      return;
    }

    const key = e.key === 'Quote' ? '"' : e.key;  // fallback when browser reports key name
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const count = this.typedCount();
      if (count >= this.chars().length) return;
      const expected = this.chars()[count];
      if (this.isPunctuationOrSpace(expected)) {
        const allQuotes = '"\'"\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B';
        const isQuote = allQuotes.includes(expected);
        if (isQuote) {
          // For quotes: accept " ' ` or exact match - keyboard produces different chars than verse
          const acceptable = '"\'`' + expected;
          if (!acceptable.includes(key)) {
            e.preventDefault();
            return;
          }
        } else if (!this.isAcceptablePunctuation(expected, key)) {
          e.preventDefault();
          return;
        }
      }
      e.preventDefault();
      this.typedChars.update((arr) => [...arr, key]);
      const newCount = count + 1;
      this.typedCount.update(() => newCount);
      if (newCount === this.chars().length) {
        this.submitResult();
      }
    }
  }

  submitResult(): void {
    const list = this.verses();
    const selected = list.slice(this.startIdx, this.endIdx + 1);
    const verseIds = selected.map((v) => v.id);
    const typed = this.typedChars();
    const expected = this.chars();
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === expected[i]) correct++;
    }
    const accuracy = expected.length > 0 ? (correct / expected.length) * 100 : 0;
    this.practiceService.recordResult(verseIds, accuracy, true).subscribe({
      next: () => this.toast.success('Practice recorded!'),
      error: () => {}
    });
  }
}
