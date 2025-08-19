import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService } from '../../services/statement.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { Subscription, forkJoin } from 'rxjs';
import { AppHeaderComponent } from '../layout/app-header/app-header.component';
import { PersonalDetailsDto, StatementEntryWithDateDto } from '../../services/statement.service';
import { LoggingService } from '../../services/logging.service';
import { AppFooterComponent } from '../layout/app-footer/app-footer.component';

@Component({
  selector: 'app-client-statement',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ProgressSpinnerModule, MessageModule, TranslatePipe, AppHeaderComponent, AppFooterComponent],
  templateUrl: './client-statement.component.html',
  styleUrls: ['./client-statement.component.css']
})
export class ClientStatementComponent implements OnInit, OnDestroy {
  statement: PersonalDetailsDto | null = null;
  transactions: StatementEntryWithDateDto[] = [];
  loading = true;
  error = false;
  errorMessage = '';
  key: string | null = null;
  hash: string | null = null;
  role: string | null = null;
  displayName = '';
  get currentBalance(): number {
    if (!this.transactions || this.transactions.length === 0) {
      return 0;
    }
  
    // pick the transaction with the latest date
    const latestTx = [...this.transactions].sort(
      (a, b) => new Date(b.eDate).getTime() - new Date(a.eDate).getTime()
    )[0];
  
    return latestTx?.balance ?? 0;
  }
  get dynamicProUrl(): string | undefined {
    return this.statement?.dynamicProUrl;
  }
  private languageSubscription: Subscription | null = null;
  private currentLoadId = 0; // correlate async responses to avoid showing stale errors

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private statementService: StatementService,
    private translationService: TranslationService,
    private cdr: ChangeDetectorRef,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void 
  {
    // Subscribe to language changes
    this.languageSubscription = this.translationService.currentLanguage$.subscribe(() => {
      this.cdr.detectChanges();
    });

    let first = true;
    this.route.queryParams.subscribe(params => {
      this.key = params['key'];
      this.hash = params['hash'];
      this.role = params['role'] || (this.route.snapshot.data as any)?.['role'] || null;

      if (!this.key || !this.hash) 
        {
        if (!first) {
          // Only show fallback if user actually navigated without params; not on initial empty emission.
          this.statement = {
            name: 'Demo Client',
            phone: '01012345678',
            address: 'Cairo, Egypt',
            company: 'Demo Co.',
            dynamicProUrl: 'https://egydynamic.com/'
          };
          this.displayName = this.statement.name;
          this.transactions = [
            { eDate: new Date('2024-12-01'), eDescription: 'Initial Deposit', debit: 0, credit: 5000, balance: 5000 },
            { eDate: new Date('2024-12-05'), eDescription: 'Purchase A102', debit: 1200.5, credit: 0, balance: 3799.5 },
            { eDate: new Date('2024-12-08'), eDescription: 'Refund A102', debit: 0, credit: 300, balance: 4099.5 }
          ];
          this.loading = false;
          this.error = false;
        }
        first = false;
        return;
      }
      first = false;
      this.loadStatement();
    });
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }

  switchLanguage() {
    const currentLang = this.translationService.getCurrentLanguage();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    this.translationService.setLanguage(newLang);
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

  get periodStart(): Date | null {
    if (!this.transactions.length) return null;
    const minTs = Math.min(...this.transactions.map(t => t.eDate.getTime()));
    return isFinite(minTs) ? new Date(minTs) : null;
  }

  get periodEnd(): Date | null {
    if (!this.transactions.length) return null;
    const maxTs = Math.max(...this.transactions.map(t => t.eDate.getTime()));
    return isFinite(maxTs) ? new Date(maxTs) : null;
  }

  get welcomeMessage(): string {
    const ps = this.periodStart;
    const pe = this.periodEnd;
    const lang = this.translationService.getCurrentLanguage?.() ?? 'ar';
    if (ps && pe) {
      const format = (d: Date) =>
        d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      return lang === 'ar'
        ? `مرحباً، هذا رصيدك للفترة ${format(ps)} إلى ${format(pe)}.`
        : `Hello, this is your balance for the period from ${format(ps)} to ${format(pe)}.`;
    }
    return this.translationService.translate('WELCOME_MESSAGE' as any);
  }

  loadStatement() 
  {
    if (!this.key || !this.hash) return; // safety
    const isSupplier = this.role === 'S';
    const loadId = ++this.currentLoadId; // capture id for this invocation
    this.loading = true;
    this.error = false;
    this.errorMessage = '';

    const statement$ = isSupplier
      ? this.statementService.getSupplierStatement(this.key!, this.hash!)
      : this.statementService.getClientStatement(this.key!, this.hash!);

    const transactions$ = isSupplier
      ? this.statementService.getSupplierTransactions(this.key!, this.hash!)
      : this.statementService.getClientTransactions(this.key!, this.hash!);

    forkJoin([statement$, transactions$]).subscribe({
      next: ([dto, tx]) => {
        // Ignore if a newer load started
        if (loadId !== this.currentLoadId) return;
        this.statement = dto;
        this.displayName = this.computeDisplayName(dto);
        this.transactions = tx;
        this.loading = false;
      },
      error: (err) => {
        // Ignore if a newer load started
        if (loadId !== this.currentLoadId) return;
        // Suppress transient/aborted network (status 0) errors; keep spinner (silent retry optional)
        if (err instanceof HttpErrorResponse && err.status === 0) {
          // Leave loading true to allow subsequent automatic or manual retry; do not show error banner
          return;
        }
        this.loading = false;
        this.error = true;
        this.errorMessage = err.error?.message || 'Network error';
      }
    });
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
    this.loadStatement();
  }

  logDynamicProClick(eventType: string) {
    this.loggingService.logEvent({
      eventType,
      companyKey: this.key || undefined,
      accountName: this.statement?.name,
      accountType: this.role || undefined
    });
  }
}
