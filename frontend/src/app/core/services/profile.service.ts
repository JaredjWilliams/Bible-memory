import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  id: number;
  name: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  list(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${environment.apiUrl}/profiles`);
  }

  create(name: string): Observable<Profile> {
    return this.http.post<Profile>(`${environment.apiUrl}/profiles`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/profiles/${id}`);
  }
}
