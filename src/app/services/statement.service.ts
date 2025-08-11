import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Models
export interface ClientAccountStatementDto {
  clientName: string;
  accountNumber: string;
  balance: number;
  currency?: string;
  lastTransactionDate?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface SupplierAccountStatementDto {
  supplierName: string;
  vatNumber: string;
  balance: number;
  currency?: string;
  lastTransactionDate?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AccountTransactionDto {
  id: number;
  type: string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  reference?: string;
  status: string;
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

  private unwrapResponse<TResponse>(response: any): TResponse {
    if (response == null) return response as TResponse;
    // Common wrappers: { success, data }, { Data }, or raw object/array
    if (typeof response === 'object') {
      if ('data' in response) return (response as any).data as TResponse;
      if ('Data' in response) return (response as any).Data as TResponse;
    }
    return response as TResponse;
  }

  getClientStatement(key: string, hash: string): Observable<ClientAccountStatementDto> {
    return this.http
      .get<any>(this.baseUrl + 'ClientStatement/statement', { params: { key, hash } })
      .pipe(map(r => this.unwrapResponse<ClientAccountStatementDto>(r)));
  }

  getClientTransactions(key: string, hash: string): Observable<AccountTransactionDto[]> {
    return this.http
      .get<any>(this.baseUrl + 'ClientStatement/transactions', { params: { key, hash } })
      .pipe(map(r => this.unwrapResponse<AccountTransactionDto[]>(r)));
  }

  getSupplierStatement(key: string, hash: string): Observable<SupplierAccountStatementDto> {
    return this.http
      .get<any>(this.baseUrl + 'SupplierStatement/statement', { params: { key, hash } })
      .pipe(map(r => this.unwrapResponse<SupplierAccountStatementDto>(r)));
  }

  getSupplierTransactions(key: string, hash: string): Observable<AccountTransactionDto[]> {
    return this.http
      .get<any>(this.baseUrl + 'SupplierStatement/transactions', { params: { key, hash } })
      .pipe(map(r => this.unwrapResponse<AccountTransactionDto[]>(r)));
  }
}