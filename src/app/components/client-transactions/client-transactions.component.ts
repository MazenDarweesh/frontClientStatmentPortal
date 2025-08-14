import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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

export class ClientTransactionsComponent implements OnInit, OnDestroy, AfterViewInit {
  statement: AnyAccountStatementDto | null = null;
  transactions: AccountTransactionDto[] = [];
  visibleTransactions: AccountTransactionDto[] = [];
  loading = true;
  error = false;
  errorMessage = '';
  key: string | null = null;
  hash: string | null = null;
  role: string | null = null;
  displayName = '';
  totalRecordsText = '';
  mobileShowTable = false;
  private pageSize = 10;
  private pageIndex = 0;
  canLoadMore = false;
  private intersectionObserver: IntersectionObserver | null = null;
  @ViewChild('infiniteScrollSentinel') sentinelRef?: ElementRef<HTMLDivElement>;
  mobileFilterOpen = false;
  selectedMobileColumn: 'date' | 'notes' | 'debit' | 'credit' | 'runningBalance' = 'date';
  mobileFilter: { text?: string; dateStart?: string; dateEnd?: string; numMin?: number | null; numMax?: number | null } = {};
  // Order of columns for dynamic rendering
  public columns: Array<{ key: 'date' | 'notes' | 'debit' | 'credit' | 'runningBalance' }> = [
    { key: 'date' },
    { key: 'notes' },
    { key: 'debit' },
    { key: 'credit' },
    { key: 'runningBalance' }
  ];
  get currentBalance(): number {
    const latest = this.getLatestRunningBalance(this.transactions);
    if (latest != null) return latest;
    if (this.statement && typeof (this.statement as any).balance === 'number') {
      return (this.statement as any).balance as number;
    }
    return this.transactions.reduce((sum, t) => sum + (t?.amount ?? 0), 0);
  }
  private languageSubscription: Subscription | null = null;
  public get isRtl() {
    return this.translationService.getCurrentLanguage() === 'ar';
  }

  private getLatestRunningBalance(list: AccountTransactionDto[]): number | null {
    if (!list || list.length === 0) return null;
    let latestItem: AccountTransactionDto | null = null;
    let latestTs = -Infinity;
    for (const t of list) {
      const ts = new Date((t as any).date).getTime();
      if (isNaN(ts)) continue;
      if (ts > latestTs) {
        latestTs = ts;
        latestItem = t;
      }
    }
    const rb = (latestItem as any)?.runningBalance;
    return typeof rb === 'number' ? rb : null;
  }

  // No recompute here: runningBalance comes from backend
  private recomputeRunningBalances(_: AccountTransactionDto[]): void {}

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private statementService: StatementService,
    public translationService: TranslationService,
    private cdr: ChangeDetectorRef
  ) {}

    // ==== Lifecycle ====

  ngOnInit(): void 
  {
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

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
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

  get periodStart(): Date | null {
    if (!this.transactions || this.transactions.length === 0) return null;
    let minTs = Infinity;
    for (const t of this.transactions) {
      const ts = new Date((t as any).date).getTime();
      if (!isNaN(ts)) minTs = Math.min(minTs, ts);
    }
    return isFinite(minTs) ? new Date(minTs) : null;
  }

  get periodEnd(): Date | null {
    if (!this.transactions || this.transactions.length === 0) return null;
    let maxTs = -Infinity;
    for (const t of this.transactions) {
      const ts = new Date((t as any).date).getTime();
      if (!isNaN(ts)) maxTs = Math.max(maxTs, ts);
    }
    return isFinite(maxTs) ? new Date(maxTs) : null;
  }
//  API Layer
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
          this.transactions = (list as any).map((t: any) => ({
            ...t,
            date: new Date(t.date as any),
            runningBalance: t.runningBalance ?? t.balanceAfter ?? t.balance
          })) as any;
          this.totalRecordsText = String(this.transactions?.length ?? 0);
          this.loading = false;
          this.error = false;
          this.resetMobilePagination();
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
          this.transactions = (list as any).map((t: any) => ({
            ...t,
            date: new Date(t.date as any),
            runningBalance: t.runningBalance ?? t.balanceAfter ?? t.balance
          })) as any;
          this.totalRecordsText = String(this.transactions?.length ?? 0);
          this.loading = false;
          this.error = false;
          this.resetMobilePagination();
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

                                             // ====== CALCULATIONS ======

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

  // Navigation / User Actions
  toggleMobileView() {
    this.mobileShowTable = !this.mobileShowTable;
    if (!this.mobileShowTable) {
      setTimeout(() => this.setupIntersectionObserver());
    }
  }

  openMobileFilter() {
    this.mobileFilterOpen = true;
  }
  closeMobileFilter() {
    this.mobileFilterOpen = false;
  }
  resetMobileFilter() {
    this.mobileFilter = {};
    this.applyMobileFilter();
  }
  applyMobileFilter() {
    const filtered = this.filterTransactionsForMobile(this.transactions);
    this.pageIndex = 0;
    this.visibleTransactions = [];
    this.canLoadMore = filtered.length > 0;
    this.loadMoreFrom(filtered);
    setTimeout(() => this.setupIntersectionObserver());
    this.mobileFilterOpen = false;
  }

  private filterTransactionsForMobile(source: AccountTransactionDto[]): AccountTransactionDto[] {
    if (!this.selectedMobileColumn) return source;
    if (this.selectedMobileColumn === 'notes') {
      const q = (this.mobileFilter.text || '').toLowerCase();
      if (!q) return source;
      return source.filter(t => ((t as any)?.notes || (t as any)?.reference || '').toLowerCase().includes(q));
    }
    if (this.selectedMobileColumn === 'date') {
      const start = this.mobileFilter.dateStart ? new Date(this.mobileFilter.dateStart) : null;
      const end = this.mobileFilter.dateEnd ? new Date(this.mobileFilter.dateEnd) : null;
      if (!start && !end) return source;
      const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const s = start ? toDateOnly(start) : null;
      const e = end ? toDateOnly(end) : null;
      return source.filter(t => {
        const d = toDateOnly(new Date((t as any).date));
        if (s && e) return d >= s && d <= e;
        if (s) return d.getTime() === s.getTime();
        if (e) return d <= e;
        return true;
      });
    }
    // Numeric filters for debit/credit/runningBalance
    const min = this.mobileFilter.numMin ?? null;
    const max = this.mobileFilter.numMax ?? null;
    if (min == null && max == null) return source;
    return source.filter(t => {
      const value = this.selectedMobileColumn === 'debit' ? (t as any).debit
        : this.selectedMobileColumn === 'credit' ? (t as any).credit
        : (t as any).runningBalance;
      if (typeof value !== 'number') return false;
      if (min != null && value < min) return false;
      if (max != null && value > max) return false;
      return true;
    });
  }

  private resetMobilePagination() {
    // apply current filter if open
    const base = this.filterTransactionsForMobile(this.transactions);
    this.pageIndex = 0;
    this.visibleTransactions = [];
    this.canLoadMore = base.length > 0;
    this.loadMoreFrom(base);
    // Reconnect observer after content change
    setTimeout(() => this.setupIntersectionObserver());
  }

  private setupIntersectionObserver() {
    if (!this.sentinelRef) return;
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.intersectionObserver = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry && entry.isIntersecting) {
        const base = this.filterTransactionsForMobile(this.transactions);
        this.loadMoreFrom(base);
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    this.intersectionObserver.observe(this.sentinelRef.nativeElement);
  }

  private loadMoreFrom(source: AccountTransactionDto[]) {
    if (!source || this.pageIndex * this.pageSize >= source.length) {
      this.canLoadMore = false;
      return;
    }
    const start = this.pageIndex * this.pageSize;
    const end = Math.min(start + this.pageSize, source.length);
    this.visibleTransactions = this.visibleTransactions.concat(source.slice(start, end));
    this.pageIndex += 1;
    this.canLoadMore = end < source.length;
  }
  switchLanguage() {
    const currentLang = this.translationService.getCurrentLanguage();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    this.translationService.setLanguage(newLang);
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
                                              // ====== TABLE EVENTS ======
  /* Reorder columns with RTL fix (kept but not essential to sorting) */
  public dropColumn(event: CdkDragDrop<any[]>) {
    const isRtl = this.translationService.getCurrentLanguage() === 'ar';
    if (isRtl) {
      const total = this.columns.length - 1;
      moveItemInArray(this.columns, total - event.previousIndex, total - event.currentIndex);
    } else {
      moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    }
  }
  // Remove custom sort: rely on PrimeNG single sort
/* Update total count when filtering */
  public onTableFilter(event: any) 
  {
    const filtered: AccountTransactionDto[] | undefined = event?.filteredValue as AccountTransactionDto[] | undefined;
    // Do NOT recompute running balances on filtered subset, otherwise filter
    // results will drift because the values being filtered change post-filter.
    // Only recompute when filters are cleared (no filteredValue provided).
    if (!filtered) {
      this.recomputeRunningBalances(this.transactions);
      this.totalRecordsText = String(this.transactions?.length ?? 0);
    } else {
      this.totalRecordsText = String(filtered.length);
    }
  }
/* Date range / exact date filtering */
  public dateRangeFilter(value: any, filter: any): boolean 
  {
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
