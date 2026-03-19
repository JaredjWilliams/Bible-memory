import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Verse } from './verse.service';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  constructor(private http: HttpClient) {}

  recordResult(verseIds: number[], accuracy: number, completed: boolean): Observable<void> {
    return this.http.request<void>('post', `${environment.apiUrl}/practice/result`, {
      body: { verseIds, accuracy, completed }
    });
  }

  getDueVerses(collectionId?: number): Observable<Verse[]> {
    const url = collectionId != null
      ? `${environment.apiUrl}/practice/due?collectionId=${collectionId}`
      : `${environment.apiUrl}/practice/due`;
    return this.http.get<Verse[]>(url);
  }
}
