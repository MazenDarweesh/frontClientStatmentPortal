import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClientStatement {
  clientName: string;
  currentBalance: number;
  currency: string;
  lastTransactionDate?: string;
  accountNumber?: string;
  accountType?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatementService {
  private apiUrl = 'https://api.example.com/statement'; // Mock URL - سيتم تغييره لاحقاً

  constructor(private http: HttpClient) { }

  getClientStatement(token: string): Observable<ClientStatement> {
    const params = new HttpParams().set('token', token);
    return this.http.get<ClientStatement>(this.apiUrl, { params });
  }

  // Mock data for development
  getMockStatement(): Observable<ClientStatement> {
    return new Observable(observer => {
      setTimeout(() => {
        // Generate random data for demonstration
        const clients = [
          'أحمد محمد علي',
          'فاطمة أحمد حسن',
          'محمد علي محمود',
          'سارة أحمد كريم',
          'علي حسن محمد',
          'نور الدين أحمد',
          'مريم علي حسن',
          'يوسف محمد أحمد'
        ];
        
        const currencies = ['ج.م', 'دولار', 'يورو', 'ريال'];
        
        const randomClient = clients[Math.floor(Math.random() * clients.length)];
        const randomCurrency = currencies[Math.floor(Math.random() * currencies.length)];
        const randomBalance = Math.random() * 50000 + 1000; // بين 1000 و 51000
        const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // خلال آخر 30 يوم
        
        const accountTypes = ['حساب جاري', 'حساب توفير', 'حساب استثماري'];
        const statuses = ['نشط', 'معلق', 'مغلق مؤقتاً'];
        
        observer.next({
          clientName: randomClient,
          currentBalance: parseFloat(randomBalance.toFixed(2)),
          currency: randomCurrency,
          lastTransactionDate: randomDate.toISOString().split('T')[0],
          accountNumber: 'EG' + Math.floor(Math.random() * 9000000000 + 1000000000),
          accountType: accountTypes[Math.floor(Math.random() * accountTypes.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)]
        });
        observer.complete();
      }, 800); // أسرع قليلاً
    });
  }
} 