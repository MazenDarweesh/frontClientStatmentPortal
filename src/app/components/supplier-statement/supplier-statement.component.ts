import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { StatementService, SupplierAccountStatementDto, AccountTransactionDto, ApiResponse } from '../../services/statement.service';

@Component({
  selector: 'app-supplier-statement',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, ProgressSpinnerModule, MessageModule],
  template: `
  <a href="https://egydynamic.com/" target="_blank" class="system-link">
    <img src="assets/EGYD-Logo.png" alt="EGYD logo" class="logo" />
    <span class="system-title">dynamic <span class="pro">pro</span></span>
  </a>
  <div class="statement-container">
    <div *ngIf="loading" class="loading-container">
      <p-progressSpinner styleClass="w-4rem h-4rem" strokeWidth="4" fill="var(--surface-ground)" animationDuration=".5s"></p-progressSpinner>
      <p class="mt-3 text-lg">جاري تحميل البيانات...</p>
    </div>

    <div *ngIf="error" class="error-container">
      <p-message severity="error" [text]="errorMessage" styleClass="w-full"></p-message>
    </div>

    <div *ngIf="!loading && !error && statement" class="statement-content">
      <p-card styleClass="header-card">
        <div class="header-content">
          <div class="client-info">
            <h1 class="client-name">{{ statement.supplierName }}</h1>
            <p class="client-subtitle">كشف الحساب</p>
          </div>
          <div class="balance-info">
            <div class="balance-amount">
              <span class="amount">{{ statement.balance | number:'1.2-2' }}</span>
              <span class="currency">{{ statement.currency || '' }}</span>
            </div>
            <p class="balance-label">الرصيد الحالي</p>
          </div>
        </div>
      </p-card>

      <p-card styleClass="action-card">
        <div class="action-content">
          <div class="button-group">
            <p-button label="عرض كشف الحساب الكامل" icon="pi pi-file-text" size="large" styleClass="full-statement-btn"></p-button>
            <p-button label="تحديث البيانات" icon="pi pi-refresh" size="large" styleClass="refresh-btn" (onClick)="refreshData()"></p-button>
          </div>
        </div>
      </p-card>

      <p-card *ngIf="statement.lastTransactionDate || statement.vatNumber || statement.status" styleClass="info-card">
        <div class="info-content">
          <div class="info-item" *ngIf="statement.lastTransactionDate">
            <i class="pi pi-calendar info-icon"></i>
            <div class="info-text">
              <span class="info-label">آخر معاملة:</span>
              <span class="info-value">{{ statement.lastTransactionDate }}</span>
            </div>
          </div>
          <div class="info-item" *ngIf="statement.vatNumber">
            <i class="pi pi-id-card info-icon"></i>
            <div class="info-text">
              <span class="info-label">VAT:</span>
              <span class="info-value">{{ statement.vatNumber }}</span>
            </div>
          </div>
          <div class="info-item" *ngIf="statement.status">
            <i class="pi pi-check-circle info-icon" [class.status-active]="statement.status === 'Active'"></i>
            <div class="info-text">
              <span class="info-label">حالة الحساب:</span>
              <span class="info-value" [class.status-active]="statement.status === 'Active'">{{ statement.status }}</span>
            </div>
          </div>
        </div>
      </p-card>

      <p-card *ngIf="transactions?.length" styleClass="info-card">
        <ng-template pTemplate="header">Transactions</ng-template>
        <div class="info-content">
          <div class="info-item" *ngFor="let t of transactions">
            <i class="pi pi-receipt info-icon"></i>
            <div class="info-text">
              <span class="info-label">{{ t.date }} — {{ t.type }}</span>
              <span class="info-value">{{ t.amount }} {{ t.currency }} ({{ t.status }})</span>
            </div>
          </div>
        </div>
      </p-card>
    </div>
  </div>
  `,
  styles: [`
    .system-link { display:flex; align-items:center; gap: 1rem; margin-bottom: 2rem; justify-content:center; text-decoration:none; }
    .logo { height: 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 116, 240, 0.08); background: #fff; }
    .system-title { font-size: 2rem; font-weight: bold; color: #111827; letter-spacing: 1px; }
    .system-title .pro { color: #2563eb; }
    .statement-container { min-height: 100vh; padding: 1rem; background: var(--bg); }
    .loading-container { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:50vh; color: var(--text); text-align:center; }
    .error-container { max-width: 600px; margin: 2rem auto; }
    .statement-content { max-width: 600px; margin: 0 auto; display:flex; flex-direction:column; gap:1.5rem; }
    .header-card, .action-card, .info-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border:none; border-radius:20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
    .header-content { display:flex; flex-direction:column; gap:1.5rem; text-align:center; }
    .client-name { font-size:1.8rem; font-weight:700; color:#0f172a; margin-bottom:.5rem; line-height:1.2; }
    .client-subtitle { font-size:1rem; color:#7f8c8d; margin:0; }
    .balance-info { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:1.5rem; border-radius:15px; color:#fff; }
    .balance-amount { display:flex; align-items:baseline; justify-content:center; gap:.5rem; margin-bottom:.5rem; }
    .amount { font-size:2.5rem; font-weight:700; line-height:1; }
    .currency { font-size:1.2rem; font-weight:600; }
    .balance-label { font-size:1rem; margin:0; opacity:.9; }
    .action-content { display:flex; justify-content:center; padding:1rem 0; }
    .button-group { display:flex; flex-direction:column; gap:1rem; width:100%; max-width:300px; }
    @media (min-width: 768px) { .button-group { flex-direction:row; max-width:500px; } }
    .full-statement-btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border:none; border-radius:50px; padding:1rem 2rem; font-size:1.1rem; font-weight:600; color:#fff; transition:all .3s ease; box-shadow:0 4px 15px rgba(102,126,234,.4); }
    .full-statement-btn:hover { transform: translateY(-2px); box-shadow:0 6px 20px rgba(102,126,234,.6); }
    .refresh-btn { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); border:none; border-radius:50px; padding:1rem 2rem; font-size:1.1rem; font-weight:600; color:#fff; transition:all .3s ease; box-shadow:0 4px 15px rgba(40,167,69,.4); }
    .refresh-btn:hover { transform: translateY(-2px); box-shadow:0 6px 20px rgba(40,167,69,.6); }
    .info-content { padding:.5rem 0; }
    .info-item { display:flex; align-items:center; gap:1rem; padding:1rem; background:#f8f9fa; border-radius:10px; }
    .info-icon { font-size:1.2rem; color:#2563eb; background: rgba(37,99,235,.08); padding:.5rem; border-radius:50%; width:2.5rem; height:2.5rem; display:flex; align-items:center; justify-content:center; }
    .info-text { display:flex; flex-direction:column; gap:.25rem; }
    .info-label { font-size:.9rem; color:#7f8c8d; font-weight:500; }
    .info-value { font-size:1rem; color:#111827; font-weight:600; }
    
    :host { display:block; }
  `]
})
export class SupplierStatementComponent implements OnInit {
  statement: SupplierAccountStatementDto | null = null;
  transactions: AccountTransactionDto[] = [];
  loading = true;
  error = false;
  errorMessage = '';

  constructor(private route: ActivatedRoute, private statementService: StatementService) {}

  ngOnInit(): void {
    const key = this.route.snapshot.queryParamMap.get('key');
    const hash = this.route.snapshot.queryParamMap.get('hash');

    if (!key || !hash) {
      // Fallback demo content when deep-link params are missing
      this.statement = {
        supplierName: 'Demo Supplier',
        vatNumber: 'EG-VAT-555-222',
        balance: 9320.1
      } as SupplierAccountStatementDto;
      this.transactions = [
        { type: 'Invoice', amount: 2500, currency: 'EGP', date: '2024-12-02', notes: 'INV-101', status: 'Open' },
        { type: 'Payment', amount: -1000, currency: 'EGP', date: '2024-12-06', notes: 'Bank Transfer', status: 'Completed' }
      ] as AccountTransactionDto[];
      this.loading = false;
      this.error = false;
      return;
    }

    this.statementService.getSupplierStatement(key, hash).subscribe({
      next: (dto: SupplierAccountStatementDto) => {
        this.statement = dto;
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
    });

    this.statementService.getSupplierTransactions(key, hash).subscribe({
      next: (list: AccountTransactionDto[]) => {
        this.transactions = list;
        this.loading = false;
      },
      error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
    });
  }

  refreshData(): void {
    if (!this.statement) return;
    const key = this.route.snapshot.queryParamMap.get('key');
    const hash = this.route.snapshot.queryParamMap.get('hash');
    if (!key || !hash) return;
    this.loading = true;
    this.statementService.getSupplierStatement(key, hash).subscribe({
      next: (dto) => { this.statement = dto; this.loading = false; },
      error: () => { this.loading = false; this.error = true; this.errorMessage = 'Network error'; }
    });
  }
}


