import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService, ClientAccountStatementDto, SupplierAccountStatementDto, AccountTransactionDto } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

type AnyAccountStatementDto = ClientAccountStatementDto | SupplierAccountStatementDto;

@Component({
  selector: 'app-client-statement',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ProgressSpinnerModule, MessageModule, TranslatePipe],
  templateUrl: './client-statement.component.html',
  styleUrls: ['./client-statement.component.css']
})

export class ClientStatementComponent implements OnInit, OnDestroy {
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

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private statementService: StatementService, 
    private translationService: TranslationService,
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
        // Fallback demo content when deep-link params are missing
        this.statement = {
          clientName: 'Demo Client',
          accountNumber: 'EG1234567890',
          balance: 15234.75
        } as ClientAccountStatementDto;
        this.displayName = 'Demo Client';
        this.transactions = [
          { type: 'Deposit', amount: 5000, currency: 'EGP', date: '2024-12-01', notes: 'Initial', status: 'Completed' },
          { type: 'Purchase', amount: -1200.5, currency: 'EGP', date: '2024-12-05', notes: 'Order #A102', status: 'Completed' },
          { type: 'Refund', amount: 300, currency: 'EGP', date: '2024-12-08', notes: 'Order #A102', status: 'Completed' }
        ] as AccountTransactionDto[];
        this.loading = false;
        this.error = false;
        return;
      }
      
      this.loadStatement();
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

  loadStatement() {
    const isSupplier = this.role === 'S';

    if (isSupplier) {
      this.statementService.getSupplierStatement(this.key!, this.hash!).subscribe({
        next: (dto) => {
          this.statement = dto as AnyAccountStatementDto;
          this.displayName = this.computeDisplayName(this.statement);
          this.loading = false;
        },
        error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
      });

      this.statementService.getSupplierTransactions(this.key!, this.hash!).subscribe({
        next: (list) => {
          this.transactions = list;
        },
        error: () => { this.error = true; this.errorMessage = 'Network error'; }
      });
    } else {
      this.statementService.getClientStatement(this.key!, this.hash!).subscribe({
        next: (dto) => {
          this.statement = dto as AnyAccountStatementDto;
          this.displayName = this.computeDisplayName(this.statement);
          this.loading = false;
        },
        error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
      });

      this.statementService.getClientTransactions(this.key!, this.hash!).subscribe({
        next: (list) => {
          this.transactions = list;
        },
        error: () => { this.error = true; this.errorMessage = 'Network error'; }
      });
    }
  }

  viewFullStatement(): void {
    const key = this.route.snapshot.queryParamMap.get('key');
    const hash = this.route.snapshot.queryParamMap.get('hash');
    const role = this.route.snapshot.queryParamMap.get('role');
    if (key && hash) {
      this.router.navigate(['/client-transactions'], { 
        queryParams: { key, hash, role: role || this.role || undefined } 
      });
    }
  }

  refreshData(): void {
    if (!this.statement) return;
    const key = this.route.snapshot.queryParamMap.get('key');
    const hash = this.route.snapshot.queryParamMap.get('hash');
    if (!key || !hash) return;
    this.loading = true;
    const isSupplier = this.role === 'S';
    if (isSupplier) {
      this.statementService.getSupplierStatement(key, hash).subscribe({
        next: (dto) => { this.statement = dto; this.displayName = this.computeDisplayName(dto as AnyAccountStatementDto); this.loading = false; },
        error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
      });
    } else {
      this.statementService.getClientStatement(key, hash).subscribe({
        next: (dto) => { this.statement = dto; this.displayName = this.computeDisplayName(dto as AnyAccountStatementDto); this.loading = false; },
        error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
      });
    }
  }
}


