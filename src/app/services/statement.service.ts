import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Models
export interface ClientAccountStatementDto {
  clientName: string;
  accountNumber: string;
  balance?: number;
  currency?: string;
  lastTransactionDate?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  eDescription?: string;
  phone?: string;
  address?: string | null;
  company?: string;
}

export interface SupplierAccountStatementDto {
  supplierName: string;
  vatNumber: string;
  balance?: number;
  currency?: string;
  lastTransactionDate?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  eDescription?: string;
  phone?: string;
  address?: string | null;
  company?: string;
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

  private toNumber(value: any): number | undefined {
    if (value == null) return undefined;
    const num = typeof value === 'string' ? Number(value.replace(/,/g, '')) : Number(value);
    return isNaN(num) ? undefined : num;
  }

  private normalizeTransactions(raw: any): AccountTransactionDto[] {
    const list: any[] = Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? []);
    return list.map((it, idx) => {
      const debit = this.toNumber(it?.Debit ?? it?.debit) ?? 0;
      const credit = this.toNumber(it?.Credit ?? it?.credit) ?? 0;
      let amount = this.toNumber(it?.amount);
      if (amount == null) amount = credit - debit;
      const rawDate = it?.date ?? it?.EDate ?? it?.eDate ?? it?.Date ?? it?.transactionDate ?? '';
      const date = this.normalizeDate(rawDate);
      const notes = it?.notes ?? it?.EDescription ?? it?.EDESCRIPTION ?? it?.eDescription ?? it?.description ?? it?.Note ?? '';
      const currency = it?.currency ?? it?.Currency ?? '';
      const reference = it?.reference ?? it?.Ref ?? '';
      const status = it?.status ?? 'Completed';
      const type = amount >= 0 ? 'Credit' : 'Debit';
      return {
        id: it?.id ?? idx,
        type,
        amount: amount,
        currency,
        date,
        notes,
        reference,
        status
      } as AccountTransactionDto;
    });
  }

  private normalizeDate(value: any): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // ISO-like
      if (/\d{4}-\d{2}-\d{2}/.test(trimmed) || trimmed.includes('T')) {
        const d = new Date(trimmed);
        return isNaN(d.getTime()) ? '' : d.toISOString();
      }
      // dd/MM/yyyy [HH:mm[:ss]]
      const m = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
      if (m) {
        const [, dd, mm, yyyy, hh = '00', min = '00', ss = '00'] = m;
        const d = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
        return isNaN(d.getTime()) ? '' : d.toISOString();
      }
      const parsed = new Date(trimmed);
      return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
    }
    return '';
  }

  private normalizeClientStatement(raw: any): ClientAccountStatementDto {
    return {
      clientName: raw?.clientName ?? raw?.name ?? raw?.Name ?? raw?.personalDetails?.Name ?? raw?.PersonalDetails?.Name ?? '',
      accountNumber: raw?.accountNumber ?? raw?.AccountNumber ?? raw?.accountNo ?? '',
      balance: this.toNumber(raw?.balance) ?? undefined,
      currency: raw?.currency ?? raw?.Currency ?? undefined,
      lastTransactionDate: raw?.lastTransactionDate ?? raw?.LastTransactionDate ?? undefined,
      status: raw?.status ?? raw?.Status ?? undefined,
      fromDate: raw?.fromDate ?? raw?.FromDate ?? undefined,
      toDate: raw?.toDate ?? raw?.ToDate ?? undefined,
      eDescription: raw?.eDescription ?? raw?.EDescription ?? raw?.description ?? undefined,
      phone: raw?.phone ?? raw?.Phone ?? raw?.personalDetails?.Phone ?? raw?.PersonalDetails?.Phone ?? undefined,
      address: raw?.address ?? raw?.Address ?? raw?.personalDetails?.Address ?? raw?.PersonalDetails?.Address ?? null,
      company: raw?.company ?? raw?.Company ?? raw?.personalDetails?.Company ?? raw?.PersonalDetails?.Company ?? undefined
    } as ClientAccountStatementDto;
  }

  private normalizeSupplierStatement(raw: any): SupplierAccountStatementDto {
    return {
      supplierName: raw?.supplierName ?? raw?.name ?? raw?.Name ?? raw?.personalDetails?.Name ?? raw?.PersonalDetails?.Name ?? '',
      vatNumber: raw?.vatNumber ?? raw?.VatNumber ?? raw?.VATNumber ?? '',
      balance: this.toNumber(raw?.balance) ?? undefined,
      currency: raw?.currency ?? raw?.Currency ?? undefined,
      lastTransactionDate: raw?.lastTransactionDate ?? raw?.LastTransactionDate ?? undefined,
      status: raw?.status ?? raw?.Status ?? undefined,
      fromDate: raw?.fromDate ?? raw?.FromDate ?? undefined,
      toDate: raw?.toDate ?? raw?.ToDate ?? undefined,
      eDescription: raw?.eDescription ?? raw?.EDescription ?? raw?.description ?? undefined,
      phone: raw?.phone ?? raw?.Phone ?? raw?.personalDetails?.Phone ?? raw?.PersonalDetails?.Phone ?? undefined,
      address: raw?.address ?? raw?.Address ?? raw?.personalDetails?.Address ?? raw?.PersonalDetails?.Address ?? null,
      company: raw?.company ?? raw?.Company ?? raw?.personalDetails?.Company ?? raw?.PersonalDetails?.Company ?? undefined
    } as SupplierAccountStatementDto;
  }

  getClientStatement(key: string, hash: string): Observable<ClientAccountStatementDto> {
    return this.http
      .get<any>(this.baseUrl + 'ClientStatement/statement', { params: { key, hash } })
      .pipe(
        map(r => this.unwrapResponse<any>(r)),
        map(raw => this.normalizeClientStatement(raw))
      );
  }

  getClientTransactions(key: string, hash: string): Observable<AccountTransactionDto[]> {
    return this.http
      .get<any>(this.baseUrl + 'ClientStatement/transactions', { params: { key, hash } })
      .pipe(
        map(r => this.unwrapResponse<any>(r)),
        map(raw => this.normalizeTransactions(raw))
      );
  }

  getSupplierStatement(key: string, hash: string): Observable<SupplierAccountStatementDto> {
    return this.http
      .get<any>(this.baseUrl + 'SupplierStatement/statement', { params: { key, hash } })
      .pipe(
        map(r => this.unwrapResponse<any>(r)),
        map(raw => this.normalizeSupplierStatement(raw))
      );
  }

  getSupplierTransactions(key: string, hash: string): Observable<AccountTransactionDto[]> {
    return this.http
      .get<any>(this.baseUrl + 'SupplierStatement/transactions', { params: { key, hash } })
      .pipe(
        map(r => this.unwrapResponse<any>(r)),
        map(raw => this.normalizeTransactions(raw))
      );
  }
}