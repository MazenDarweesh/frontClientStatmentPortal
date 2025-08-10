import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService, ClientAccountStatementDto, AccountTransactionDto } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-transactions',
  templateUrl: './client-transactions.component.html',
  styleUrls: ['./client-transactions.component.css'],
  standalone: true,
  imports: [CommonModule, TableModule, ProgressSpinnerModule, MessageModule, TranslatePipe]
})
export class ClientTransactionsComponent implements OnInit, OnDestroy {
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

  loadData() {
    // Load statement data
    this.statementService.getClientStatement(this.key!, this.hash!).subscribe({
      next: (dto: ClientAccountStatementDto) => {
        this.statement = dto;
      },
      error: (err) => {
        console.error('Error loading client statement:', err);
        this.error = true;
        this.errorMessage = err.message || 'Failed to load client statement';
        this.loading = false;
      }
    });

    // Load transactions data
    this.statementService.getClientTransactions(this.key!, this.hash!).subscribe({
      next: (list: AccountTransactionDto[]) => {
        this.transactions = list;
        this.loading = false;
        this.error = false;
      },
      error: (err) => {
        console.error('Error loading client transactions:', err);
        this.error = true;
        this.errorMessage = err.message || 'Failed to load transactions';
        this.loading = false;
      }
    });
  }

  goBack() {
    if (this.key && this.hash) {
      this.router.navigate(['/client-statement'], {
        queryParams: { key: this.key, hash: this.hash }
      });
    } else {
      this.router.navigate(['/client-statement']);
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
