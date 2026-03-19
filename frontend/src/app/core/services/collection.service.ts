import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Collection {
  id: number;
  name: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CollectionService {
  constructor(private http: HttpClient) {}

  list(profileId: number): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${environment.apiUrl}/collections`, {
      params: { profileId: profileId.toString() }
    });
  }

  create(profileId: number, name: string): Observable<Collection> {
    return this.http.post<Collection>(`${environment.apiUrl}/collections`, { profileId, name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/collections/${id}`);
  }
}
