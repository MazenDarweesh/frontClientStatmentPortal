import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService, ClientAccountStatementDto, SupplierAccountStatementDto, AccountTransactionDto } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { AppHeaderComponent } from '../layout/app-header/app-header.component';
import { Subscription } from 'rxjs';

type AnyAccountStatementDto = ClientAccountStatementDto | SupplierAccountStatementDto;

@Component({
  selector: 'app-client-transactions',
  templateUrl: './client-transactions.component.html',
  styleUrls: ['./client-transactions.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DatePickerModule, ButtonModule, ProgressSpinnerModule, MessageModule, TranslatePipe, AppHeaderComponent, DragDropModule]
})

export class ClientTransactionsComponent implements OnInit, OnDestroy {
  statement: AnyAccountStatementDto | null = null;
  transactions: AccountTransactionDto[] = [];
  loading = true;
  error = false;
  errorMessage = '';
  key: string | null = null;
  hash: string | null = null;
  role: string | null = null;
  displayName = '';
  // Order of columns for dynamic rendering and drag-and-drop
  public columns: Array<{ key: 'date' | 'notes' | 'amount' | 'runningBalance' }> = [
    { key: 'date' },
    { key: 'notes' },
    { key: 'amount' },
    { key: 'runningBalance' }
  ];
  get currentBalance(): number {
    if (this.statement && typeof (this.statement as any).balance === 'number') {
      return (this.statement as any).balance as number;
    }
    return this.transactions.reduce((sum, t) => sum + (t?.amount ?? 0), 0);
  }
  private languageSubscription: Subscription | null = null;
  public get isRtl() {
    return this.translationService.getCurrentLanguage() === 'ar';
  }

  private recomputeRunningBalances(list: AccountTransactionDto[]): void {
    let balance = 0;
    for (const tx of list) {
      balance += tx.amount;
      (tx as any).runningBalance = balance;
    }
  }

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private statementService: StatementService,
    public translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to language changes
    this.languageSubscription = this.translationService.currentLanguage$.subscribe(() => {
      this.cdr.detectChanges();
    });

    this.route.queryParams.subscribe(params => {
      this.key = params['key'];
      this.hash = params['hash'];
      this.role = params['role'] || (this.route.snapshot.data && (this.route.snapshot.data as any)['role']) || null;
      
      if (!this.key || !this.hash) {
        this.error = true;
        this.errorMessage = 'Missing required parameters';
        this.loading = false;
        return;
      }
      
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  switchLanguage() {
    const currentLang = this.translationService.getCurrentLanguage();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    this.translationService.setLanguage(newLang);
  }

  private computeDisplayName(dto: AnyAccountStatementDto | null): string {
    if (!dto) return '';
    return (dto as any).clientName || (dto as any).supplierName || (dto as any).name || '';
  }

  get phone(): string | undefined {
    return (this.statement as any)?.phone;
  }
  get address(): string | null | undefined {
    return (this.statement as any)?.address;
  }
  get company(): string | undefined {
    return (this.statement as any)?.company;
  }
  get description(): string | undefined {
    return (this.statement as any)?.eDescription;
  }

  loadData() {
    const isSupplier = this.role === 'S';

    if (isSupplier) {
      this.statementService.getSupplierStatement(this.key!, this.hash!).subscribe({
        next: (dto) => {
          this.statement = dto as AnyAccountStatementDto;
          this.displayName = this.computeDisplayName(this.statement);
        },
        error: (err: any) => {
          console.error('Error loading statement:', err);
          this.error = true;
          this.errorMessage = err?.message || 'Failed to load statement';
          this.loading = false;
        }
      });

      this.statementService.getSupplierTransactions(this.key!, this.hash!).subscribe({
        next: (list) => {
          this.transactions = list.map(t => ({ ...t, date: new Date(t.date as any) })) as any;
          this.recomputeRunningBalances(this.transactions);
          this.loading = false;
          this.error = false;
        },
        error: (err: any) => {
          console.error('Error loading transactions:', err);
          this.error = true;
          this.errorMessage = err?.message || 'Failed to load transactions';
          this.loading = false;
        }
      });
    } else {
      this.statementService.getClientStatement(this.key!, this.hash!).subscribe({
        next: (dto) => {
          this.statement = dto as AnyAccountStatementDto;
          this.displayName = this.computeDisplayName(this.statement);
        },
        error: (err: any) => {
          console.error('Error loading statement:', err);
          this.error = true;
          this.errorMessage = err?.message || 'Failed to load statement';
          this.loading = false;
        }
      });

      this.statementService.getClientTransactions(this.key!, this.hash!).subscribe({
        next: (list) => {
          this.transactions = list.map(t => ({ ...t, date: new Date(t.date as any) })) as any;
          this.recomputeRunningBalances(this.transactions);
          this.loading = false;
          this.error = false;
        },
        error: (err: any) => {
          console.error('Error loading transactions:', err);
          this.error = true;
          this.errorMessage = err?.message || 'Failed to load transactions';
          this.loading = false;
        }
      });
    }
  }

  goBack() {
    if (this.key && this.hash) {
      this.router.navigate(['/client-statement'], {
        queryParams: { key: this.key, hash: this.hash, role: this.role || undefined }
      });
    } else {
      this.router.navigate(['/client-statement'], { queryParams: this.role ? { role: this.role } : undefined });
    }
  }

  getTotalPaidIn(): number {
    return this.transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalPaidOut(): number {
    return this.transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  getRunningBalance(index: number): number {
    let balance = 0;
    for (let i = 0; i <= index; i++) {
      balance += this.transactions[i].amount;
    }
    return balance;
  }

  public dropColumn(event: CdkDragDrop<any[]>) {
    const isRtl = this.translationService.getCurrentLanguage() === 'ar'; // ✅ NEW
    if (isRtl) {
      const total = this.columns.length - 1;
      moveItemInArray(
        this.columns,
        total - event.previousIndex,
        total - event.currentIndex
      );
    } else {
      moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    }
  }

  public onCustomSort(event: SortEvent) {
    if (!event || !event.data) return;

    // Precompute running balance for current order
    const runningBalanceMap = new Map<AccountTransactionDto, number>();
    let balance = 0;
    for (const tx of event.data as AccountTransactionDto[]) {
      balance += tx.amount;
      runningBalanceMap.set(tx, balance);
      (tx as any).runningBalance = balance;
    }

    const compare = (a: AccountTransactionDto, b: AccountTransactionDto, field: string, order: number) => {
      const getValue = (t: AccountTransactionDto): any => {
        switch (field) {
          case 'date':
            return new Date((t as any).date).getTime();
          case 'notes':
            return (t.notes || t.reference || '') as string;
          case 'amount':
            return t.amount;
          case 'runningBalance':
            return runningBalanceMap.get(t) ?? 0;
          default:
            return '';
        }
      };
      const v1 = getValue(a);
      const v2 = getValue(b);
      let result = 0;
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        result = v1 - v2;
      } else {
        result = String(v1).localeCompare(String(v2));
      }
      return order * (result < 0 ? -1 : result > 0 ? 1 : 0);
    };

    if (event.multiSortMeta && event.multiSortMeta.length) {
      (event.data as AccountTransactionDto[]).sort((a, b) => {
        for (const meta of event.multiSortMeta!) {
          const res = compare(a, b, meta.field as string, meta.order ?? 1);
          if (res !== 0) return res;
        }
        return 0;
      });
    } else if (event.field) {
      (event.data as AccountTransactionDto[]).sort((a, b) => compare(a, b, event.field as string, event.order ?? 1));
    }
  }

  public onTableFilter(event: any) {
    const list: AccountTransactionDto[] = (event && event.filteredValue) ? event.filteredValue : this.transactions;
    this.recomputeRunningBalances(list);
  }

  public dateRangeFilter(value: any, filter: any): boolean {
    if (!filter) return true;
    const toDateOnly = (d: any): Date => {
      const dt = d instanceof Date ? d : new Date(d);
      return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const cell = toDateOnly(value);

    // If filter is a single date → compare equality by day
    if (filter instanceof Date) {
      const f = toDateOnly(filter);
      return cell.getTime() === f.getTime();
    }

    // If filter is an object with start/end
    const start: Date | null = filter?.start ? toDateOnly(filter.start) : null;
    const end: Date | null = filter?.end ? toDateOnly(filter.end) : null;

    if (start && end) {
      return cell.getTime() >= start.getTime() && cell.getTime() <= end.getTime();
    }
    if (start && !end) {
      return cell.getTime() === start.getTime();
    }
    if (!start && end) {
      return cell.getTime() <= end.getTime();
    }
    return true;
  }
}
