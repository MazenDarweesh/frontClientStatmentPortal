import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VisitorEvent } from '../Models/VisitorEvent';


@Injectable({ providedIn: 'root' })
export class LoggingService {
  private readonly baseUrl = 'https://localhost:7293/api/VisitorEvent/log';

  constructor(private http: HttpClient) {}

  logEvent(event: VisitorEvent) {
    return this.http.post(this.baseUrl, event).subscribe();
  }
}
