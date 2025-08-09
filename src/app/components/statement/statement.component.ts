import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

import { StatementService, ClientStatement } from '../../services/statement.service';

@Component({
  selector: 'app-statement',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ProgressSpinnerModule,
    MessageModule
  ],
  templateUrl: './statement.component.html',
  styleUrls: ['./statement.component.css']
})
export class StatementComponent implements OnInit {
  statement: ClientStatement | null = null;
  loading = true;
  error = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private statementService: StatementService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      // للاختبار، نستخدم بيانات وهمية حتى بدون token
      this.loadStatement(token || 'demo-token');
    });
  }

  private loadStatement(token: string): void {
    console.log('Loading statement with token:', token);
    
    // إضافة timeout للتأكد من عدم التوقف
    const timeout = setTimeout(() => {
      console.log('Timeout reached, using fallback data');
      this.statement = {
        clientName: 'أحمد محمد علي',
        currentBalance: 15420.50,
        currency: 'ج.م',
        lastTransactionDate: '2024-01-15',
        accountNumber: 'EG1234567890',
        accountType: 'حساب جاري',
        status: 'نشط'
      };
      this.loading = false;
    }, 3000); // 3 ثواني
    
    // استخدام Mock data للتطوير
    this.statementService.getMockStatement().subscribe({
      next: (data) => {
        console.log('Statement data received:', data);
        clearTimeout(timeout);
        this.statement = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading statement:', error);
        clearTimeout(timeout);
        // Fallback data في حالة الخطأ
        this.statement = {
          clientName: 'أحمد محمد علي',
          currentBalance: 15420.50,
          currency: 'ج.م',
          lastTransactionDate: '2024-01-15',
          accountNumber: 'EG1234567890',
          accountType: 'حساب جاري',
          status: 'نشط'
        };
        this.loading = false;
      }
    });
  }

  viewFullStatement(): void {
    // سيتم تنفيذ هذه الوظيفة لاحقاً
    alert('سيتم إضافة عرض كشف الحساب الكامل قريباً');
  }

  refreshData(): void {
    this.loading = true;
    this.error = false;
    this.statement = null;
    
    // إعادة تحميل البيانات مع بيانات عشوائية جديدة
    setTimeout(() => {
      this.loadStatement('refresh-token');
    }, 300);
  }

  loadManualData(): void {
    console.log('Manual data load triggered');
    this.statement = {
      clientName: 'أحمد محمد علي',
      currentBalance: 15420.50,
      currency: 'ج.م',
      lastTransactionDate: '2024-01-15',
      accountNumber: 'EG1234567890',
      accountType: 'حساب جاري',
      status: 'نشط'
    };
    this.loading = false;
  }
} 