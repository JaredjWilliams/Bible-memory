import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PassageResponse {
  text: string;
  reference: string;
}

@Injectable({ providedIn: 'root' })
export class PassageService {
  constructor(private http: HttpClient) {}

  fetch(query: string): Observable<PassageResponse> {
    return this.http.get<PassageResponse>(`${environment.apiUrl}/passages`, {
      params: { q: query }
    });
  }
}
