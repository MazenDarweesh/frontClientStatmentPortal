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
import { StatementService, PersonalDetailsDto, StatementEntryWithDateDto } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { AppHeaderComponent } from '../layout/app-header/app-header.component';
import { Subscription } from 'rxjs';
import { LoggingService } from '../../services/logging.service';
import { AppFooterComponent } from '../layout/app-footer/app-footer.component';

@Component({
  selector: 'app-client-transactions',
  templateUrl: './client-transactions.component.html',
  styleUrls: ['./client-transactions.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DatePickerModule, ButtonModule, ProgressSpinnerModule, MessageModule, TranslatePipe, AppHeaderComponent, DragDropModule, AppFooterComponent]
})

export class ClientTransactionsComponent implements OnInit, OnDestroy, AfterViewInit {
  statement: PersonalDetailsDto | null = null;
  transactions: StatementEntryWithDateDto[] = [];
  visibleTransactions: StatementEntryWithDateDto[] = [];
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
  selectedMobileColumn: 'eDate' | 'eDescription' | 'debit' | 'credit' | 'balance' = 'eDate';
  mobileFilter: { text?: string; dateStart?: string; dateEnd?: string; numMin?: number | null; numMax?: number | null } = {};
  // Order of columns for dynamic rendering
  public columns: Array<{ key: 'eDate' | 'eDescription' | 'debit' | 'credit' | 'balance' }> = [
    { key: 'eDate' },
    { key: 'eDescription' },
    { key: 'debit' },
    { key: 'credit' },
    { key: 'balance' }
  ];
  
  get currentBalance(): number {
    if (!this.transactions || this.transactions.length === 0) {
      return 0;
    }
  
    // pick the transaction with the latest date
    const latestTx = [...this.transactions].sort(
      (a, b) => b.eDate.getTime() - a.eDate.getTime()
    )[0];
  
    return latestTx?.balance ?? 0;
  }
  
  private languageSubscription: Subscription | null = null;
  
  public get isRtl() {
    return this.translationService.getCurrentLanguage() === 'ar';
  }

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private statementService: StatementService,
    public translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private loggingService: LoggingService
  ) {}

  // ==== Lifecycle ====

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

    this.loggingService.logEvent({
      eventType: 'Page_Link',
      companyKey: this.key || undefined,
      accountName: this.statement?.name,
      accountType: this.role || undefined
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

  private computeDisplayName(dto: PersonalDetailsDto | null): string {
    return dto?.name ?? '';
  }

  get phone(): string | undefined {
    return this.statement?.phone;
  }
  
  get address(): string | undefined {
    return this.statement?.address;
  }
  
  get company(): string | undefined {
    return this.statement?.company;
  }

  get dynamicProUrl(): string | undefined {
    return this.statement?.dynamicProUrl;
  }

  get periodStart(): Date | null {
    if (!this.transactions || this.transactions.length === 0) return null;
    const minTs = Math.min(...this.transactions.map(t => new Date(t.eDate).getTime()));
    return isFinite(minTs) ? new Date(minTs) : null;
  }

  get periodEnd(): Date | null {
    if (!this.transactions || this.transactions.length === 0) return null;
    const maxTs = Math.max(...this.transactions.map(t => new Date(t.eDate).getTime()));
    return isFinite(maxTs) ? new Date(maxTs) : null;
  }

  // API Layer
  loadData() {
    const isSupplier = this.role === 'S';

    const statement$ = isSupplier
      ? this.statementService.getSupplierStatement(this.key!, this.hash!)
      : this.statementService.getClientStatement(this.key!, this.hash!);

    const transactions$ = isSupplier
      ? this.statementService.getSupplierTransactions(this.key!, this.hash!)
      : this.statementService.getClientTransactions(this.key!, this.hash!);

    statement$.subscribe({
      next: (dto) => {
        this.statement = dto;
        this.displayName = this.computeDisplayName(dto);
      },
      error: (err: any) => {
        console.error('Error loading statement:', err);
        this.error = true;
        this.errorMessage = err?.message || 'Failed to load statement';
        this.loading = false;
      }
    });

    transactions$.subscribe({
      next: (list) => {
        this.transactions = list;
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

  // ====== CALCULATIONS ======

  getTotalPaidIn(): number {
    return this.transactions
      .filter(t => t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);
  }

  getTotalPaidOut(): number {
    return this.transactions
      .filter(t => t.debit > 0)
      .reduce((sum, t) => sum + t.debit, 0);
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

  private filterTransactionsForMobile(source: StatementEntryWithDateDto[]): StatementEntryWithDateDto[] {
    if (!this.selectedMobileColumn) return source;
    
    if (this.selectedMobileColumn === 'eDescription') {
      const q = (this.mobileFilter.text || '').toLowerCase();
      if (!q) return source;
      return source.filter(t => t.eDescription.toLowerCase().includes(q));
    }
    
    if (this.selectedMobileColumn === 'eDate') {
      const start = this.mobileFilter.dateStart ? new Date(this.mobileFilter.dateStart) : null;
      const end = this.mobileFilter.dateEnd ? new Date(this.mobileFilter.dateEnd) : null;
      if (!start && !end) return source;
      const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const s = start ? toDateOnly(start) : null;
      const e = end ? toDateOnly(end) : null;
      return source.filter(t => {
        const d = toDateOnly(new Date(t.eDate));
        if (s && e) return d >= s && d <= e;
        if (s) return d.getTime() === s.getTime();
        if (e) return d <= e;
        return true;
      });
    }
    
    // Numeric filters for debit/credit/balance
    const min = this.mobileFilter.numMin ?? null;
    const max = this.mobileFilter.numMax ?? null;
    if (min == null && max == null) return source;
    
    return source.filter(t => {
      const value = this.selectedMobileColumn === 'debit' ? t.debit
        : this.selectedMobileColumn === 'credit' ? t.credit
        : t.balance;
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

  private loadMoreFrom(source: StatementEntryWithDateDto[]) {
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
  
  logDynamicProClick(eventType: string) {
    this.loggingService.logEvent({
      eventType,
      companyKey: this.key || undefined,
      accountName: this.statement?.name,
      accountType: this.role || undefined
    });
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
  
  /* Update total count when filtering */
  public onTableFilter(event: any) {
    const filtered: StatementEntryWithDateDto[] | undefined = event?.filteredValue as StatementEntryWithDateDto[] | undefined;
    if (!filtered) {
      this.totalRecordsText = String(this.transactions?.length ?? 0);
    } else {
      this.totalRecordsText = String(filtered.length);
    }
  }
  
  /* Date range / exact date filtering */
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
