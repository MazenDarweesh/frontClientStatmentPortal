import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService, ClientAccountStatementDto, SupplierAccountStatementDto, AccountTransactionDto } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

type AnyAccountStatementDto = ClientAccountStatementDto | SupplierAccountStatementDto;

@Component({
  selector: 'app-client-transactions',
  templateUrl: './client-transactions.component.html',
  styleUrls: ['./client-transactions.component.css'],
  standalone: true,
  imports: [CommonModule, TableModule, ProgressSpinnerModule, MessageModule, TranslatePipe]
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
          this.transactions = list;
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
          this.transactions = list;
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
}
