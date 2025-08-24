import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LoggingService } from './logging.service';
import { environment } from '../../environments/environment';
import { PersonalDetailsDto } from '../Models/PersonalDetailsDto';
import { StatementEntryWithDateDto } from '../Models/StatementEntryWithDateDto';
import { ApiResponse } from '../Models/ApiResponse';
import { StatementEntryDto } from '../Models/StatementEntryDto';


@Injectable({ providedIn: 'root' })
export class StatementService {
  // Use relative path (proxy) in dev if environment.baseUrl empty; else use provided
  private readonly baseUrl = environment.baseUrl && environment.baseUrl.trim() !== ''
    ? environment.baseUrl
    : '/api/';

  // Caches
  private clientStatementCache: { [key: string]: PersonalDetailsDto } = {};
  private clientTransactionsCache: { [key: string]: StatementEntryWithDateDto[] } = {};
  private supplierStatementCache: { [key: string]: PersonalDetailsDto } = {};
  private supplierTransactionsCache: { [key: string]: StatementEntryWithDateDto[] } = {};

  private loggedPageLinkKeys = new Set<string>();

  constructor(private http: HttpClient, private loggingService: LoggingService) {}

  getClientStatement(key: string, hash: string): Observable<PersonalDetailsDto> 
  {
    const cacheKey = `${key}|${hash}`;
    if (this.clientStatementCache[cacheKey]) {
      return new Observable(observer => {
        observer.next(this.clientStatementCache[cacheKey]);
        observer.complete();
      });
    }
    return this.http
      .get<ApiResponse<PersonalDetailsDto>>(this.baseUrl + 'ClientStatement/statement', { params: { key, hash } })
      .pipe(map(r => {
        this.clientStatementCache[cacheKey] = r.data;
        // Log first time only for this key-hash (client)
        if (!this.loggedPageLinkKeys.has(cacheKey)) {
          this.loggingService.logEvent({
            eventType: 'Page_Link',
            companyKey: key,
            accountName: r.data.name,
            accountType: 'C'
          });
          this.loggedPageLinkKeys.add(cacheKey);
        }
        return r.data;
      }));
  }

  getClientTransactions(key: string, hash: string): Observable<StatementEntryWithDateDto[]> {
    const cacheKey = `${key}|${hash}`;
    if (this.clientTransactionsCache[cacheKey]) {
      return new Observable(observer => {
        observer.next(this.clientTransactionsCache[cacheKey]);
        observer.complete();
      });
    }
    return this.http
      .get<ApiResponse<StatementEntryDto[]>>(this.baseUrl + 'ClientStatement/transactions', { params: { key, hash } })
      .pipe(map(r => {
        const data = r.data.map(transaction => ({
          ...transaction,
          eDate: new Date(transaction.eDate)
        }));
        this.clientTransactionsCache[cacheKey] = data;
        return data;
      }));
  }

  getSupplierStatement(key: string, hash: string): Observable<PersonalDetailsDto> {
    const cacheKey = `${key}|${hash}`;
    if (this.supplierStatementCache[cacheKey]) {
      return new Observable(observer => {
        observer.next(this.supplierStatementCache[cacheKey]);
        observer.complete();
      });
    }
    return this.http
      .get<ApiResponse<PersonalDetailsDto>>(this.baseUrl + 'SupplierStatement/statement', { params: { key, hash } })
      .pipe(map(r => {
        this.supplierStatementCache[cacheKey] = r.data;
        // Log first time only for this key-hash (supplier)
        if (!this.loggedPageLinkKeys.has(cacheKey)) {
          this.loggingService.logEvent({
            eventType: 'Page_Link',
            companyKey: key,
            accountName: r.data.name,
            accountType: 'S'
          });
            this.loggedPageLinkKeys.add(cacheKey);
        }
        return r.data;
      }));
  }

  getSupplierTransactions(key: string, hash: string): Observable<StatementEntryWithDateDto[]> {
    const cacheKey = `${key}|${hash}`;
    if (this.supplierTransactionsCache[cacheKey]) {
      return new Observable(observer => {
        observer.next(this.supplierTransactionsCache[cacheKey]);
        observer.complete();
      });
    }
    return this.http
      .get<ApiResponse<StatementEntryDto[]>>(this.baseUrl + 'SupplierStatement/transactions', { params: { key, hash } })
      .pipe(map(r => {
        const data = r.data.map(transaction => ({
          ...transaction,
          eDate: new Date(transaction.eDate)
        }));
        this.supplierTransactionsCache[cacheKey] = data;
        return data;
      }));
  }

  // Optional: clear cache for manual refresh
  clearClientStatementCache(key: string, hash: string) {
    delete this.clientStatementCache[`${key}|${hash}`];
  }
  clearClientTransactionsCache(key: string, hash: string) {
    delete this.clientTransactionsCache[`${key}|${hash}`];
  }
  clearSupplierStatementCache(key: string, hash: string) {
    delete this.supplierStatementCache[`${key}|${hash}`];
  }
  clearSupplierTransactionsCache(key: string, hash: string) {
    delete this.supplierTransactionsCache[`${key}|${hash}`];
  }
}