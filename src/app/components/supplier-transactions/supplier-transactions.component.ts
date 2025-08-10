import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService, SupplierAccountStatementDto, AccountTransactionDto } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-supplier-transactions',
  templateUrl: './supplier-transactions.component.html',
  styleUrls: ['./supplier-transactions.component.css'],
  standalone: true,
  imports: [CommonModule, TableModule, ProgressSpinnerModule, MessageModule, TranslatePipe]
})
export class SupplierTransactionsComponent implements OnInit, OnDestroy {
  statement: SupplierAccountStatementDto | null = null;
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
    this.statementService.getSupplierStatement(this.key!, this.hash!).subscribe({
      next: (dto: SupplierAccountStatementDto) => {
        this.statement = dto;
      },
      error: (err) => {
        console.error('Error loading supplier statement:', err);
        this.error = true;
        this.errorMessage = err.message || 'Failed to load supplier statement';
        this.loading = false;
      }
    });

    // Load transactions data
    this.statementService.getSupplierTransactions(this.key!, this.hash!).subscribe({
      next: (list: AccountTransactionDto[]) => {
        this.transactions = list;
        this.loading = false;
        this.error = false;
      },
      error: (err) => {
        console.error('Error loading supplier transactions:', err);
        this.error = true;
        this.errorMessage = err.message || 'Failed to load transactions';
        this.loading = false;
      }
    });
  }

  goBack() {
    if (this.key && this.hash) {
      this.router.navigate(['/supplier-statement'], {
        queryParams: { key: this.key, hash: this.hash }
      });
    } else {
      this.router.navigate(['/supplier-statement']);
    }
  }
}
