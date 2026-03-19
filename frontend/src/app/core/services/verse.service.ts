import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Verse {
  id: number;
  reference: string;
  text: string;
  orderIndex: number;
  source: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class VerseService {
  constructor(private http: HttpClient) {}

  list(collectionId: number): Observable<Verse[]> {
    return this.http.get<Verse[]>(`${environment.apiUrl}/verses`, {
      params: { collectionId: collectionId.toString() }
    });
  }

  create(collectionId: number, reference: string, text: string, source?: string): Observable<Verse> {
    const body: Record<string, unknown> = { collectionId, reference, text };
    if (source) body['source'] = source;
    return this.http.post<Verse>(`${environment.apiUrl}/verses`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/verses/${id}`);
  }
}
