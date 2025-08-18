import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface VisitorEvent {
  eventType?: string;
  companyKey?: string;
  ipAddress?: string;
  userAgent?: string;
  eventDate?: Date;
  accountName?: string;
  accountType?: string;
}

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private readonly baseUrl = 'https://localhost:7293/api/VisitorEvent/log';

  constructor(private http: HttpClient) {}

  logEvent(event: VisitorEvent) {
    // Add user agent
    event.userAgent = navigator.userAgent;
    event.eventDate = new Date();
    // IP address should be set by backend if not available
    return this.http.post(this.baseUrl, event).subscribe();
  }
}
