import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService, ClientAccountStatementDto, AccountTransactionDto, ApiResponse } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-statement',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ProgressSpinnerModule, MessageModule, TranslatePipe],
  templateUrl: './client-statement.component.html',
  styleUrls: ['./client-statement.component.css']
})
export class ClientStatementComponent implements OnInit, OnDestroy {
  statement: ClientAccountStatementDto | null = null;
  transactions: AccountTransactionDto[] = [];
  loading = true;
  error = false;
  errorMessage = '';
  key: string | null = null;
  hash: string | null = null;
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
      
      if (!this.key || !this.hash) {
        // Fallback demo content when deep-link params are missing
        this.statement = {
          clientName: 'Demo Client',
          accountNumber: 'EG1234567890',
          balance: 15234.75
        } as ClientAccountStatementDto;
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

  loadStatement() {
    this.statementService.getClientStatement(this.key!, this.hash!).subscribe({
      next: (dto: ClientAccountStatementDto) => {
        this.statement = dto;
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
    });

    this.statementService.getClientTransactions(this.key!, this.hash!).subscribe({
      next: (list: AccountTransactionDto[]) => {
        this.transactions = list;
      },
      error: () => { this.error = true; this.errorMessage = 'Network error'; }
    });
  }

  viewFullStatement(): void {
    const key = this.route.snapshot.queryParamMap.get('key');
    const hash = this.route.snapshot.queryParamMap.get('hash');
    if (key && hash) {
      this.router.navigate(['/client-transactions'], { 
        queryParams: { key, hash } 
      });
    }
  }

  refreshData(): void {
    if (!this.statement) return;
    const key = this.route.snapshot.queryParamMap.get('key');
    const hash = this.route.snapshot.queryParamMap.get('hash');
    if (!key || !hash) return;
    this.loading = true;
    this.statementService.getClientStatement(key, hash).subscribe({
      next: (dto) => { this.statement = dto; this.loading = false; },
      error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
    });
  }
}


