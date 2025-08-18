import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Models
export interface PersonalDetailsDto {
  name: string;
  phone: string;
  address: string;
  company: string;
  dynamicProUrl: string;
}

export interface StatementEntryDto {
  eDate: string;
  eDescription: string;
  debit: number;
  credit: number;
  balance: number;
}

// Interface for transactions with Date objects (for UI use)
export interface StatementEntryWithDateDto {
  eDate: Date;
  eDescription: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class StatementService {
  private readonly baseUrl = 'https://localhost:7293/api/';

  constructor(private http: HttpClient) {}

  getClientStatement(key: string, hash: string): Observable<PersonalDetailsDto> {
    return this.http
      .get<ApiResponse<PersonalDetailsDto>>(this.baseUrl + 'ClientStatement/statement', { params: { key, hash } })
      .pipe(map(r => r.data));
  }

  getClientTransactions(key: string, hash: string): Observable<StatementEntryWithDateDto[]> {
    return this.http
      .get<ApiResponse<StatementEntryDto[]>>(this.baseUrl + 'ClientStatement/transactions', { params: { key, hash } })
      .pipe(map(r => r.data.map(transaction => ({
        ...transaction,
        eDate: new Date(transaction.eDate)
      }))));
  }

  getSupplierStatement(key: string, hash: string): Observable<PersonalDetailsDto> {
    return this.http
      .get<ApiResponse<PersonalDetailsDto>>(this.baseUrl + 'SupplierStatement/statement', { params: { key, hash } })
      .pipe(map(r => r.data));
  }

  getSupplierTransactions(key: string, hash: string): Observable<StatementEntryWithDateDto[]> {
    return this.http
      .get<ApiResponse<StatementEntryDto[]>>(this.baseUrl + 'SupplierStatement/transactions', { params: { key, hash } })
      .pipe(map(r => r.data.map(transaction => ({
        ...transaction,
        eDate: new Date(transaction.eDate)
      }))));
  }
}