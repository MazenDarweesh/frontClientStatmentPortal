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
  totalRecordsText = '';
  // Order of columns for dynamic rendering
  public columns: Array<{ key: 'date' | 'notes' | 'debit' | 'credit' | 'runningBalance' }> = [
    { key: 'date' },
    { key: 'notes' },
    { key: 'debit' },
    { key: 'credit' },
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
