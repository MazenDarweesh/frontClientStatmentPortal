import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TranslationKeys } from '../Models/TranslationKeys';

export type Language = 'ar' | 'en';

const translations: Record<Language, TranslationKeys> = {
  ar: {
    LOADING_DATA: 'جاري تحميل البيانات...',
    ACCOUNT_STATEMENT: 'كشف الحساب',
    CURRENT_BALANCE: 'الرصيد الحالي',
    VIEW_FULL_STATEMENT: 'رؤية تقرير المعاملات',
    LAST_TRANSACTION: 'آخر معاملة',
    ACCOUNT_NUMBER: 'رقم الحساب',
    ACCOUNT_STATUS: 'حالة الحساب',
    TRANSACTIONS_HISTORY: 'سجل المعاملات',
    TRANSACTIONS: 'المعاملات',
    DATE: 'التاريخ',
    TYPE: 'النوع',
    REFERENCE: 'المرجع',
    AMOUNT: 'المبلغ',
    STATUS: 'الحالة',
    NO_TRANSACTIONS: 'لا توجد معاملات',
              WELCOME_MESSAGE: 'مرحباً، هذا رصيدك للفترة 25 أغسطس 2022 إلى 5 أغسطس 2025.',
              SWITCH_LANGUAGE: 'English',
              BACK_TO_STATEMENT: 'العودة لكشف الحساب',
              NO_DATA_AVAILABLE: 'لا توجد بيانات متاحة حالياً. يرجى التحقق من الرابط أو المحاولة لاحقاً.',
              SHOWING: 'عرض',
              TO: 'إلى',
              OF: 'من',
              ENTRIES: 'سجل',
              CLICK_TRANSACTION_HISTORY: 'اضغط على "رؤية تقرير المعاملات" إذا كنت تريد رؤية سجل المعاملات الكامل.',
              PAID_IN: 'مدفوع',
              PAID_OUT: 'مصروف',
              NOTE: 'ملاحظة',
              DEBIT: 'مدين',
              CREDIT: 'دائن',
              RUNNING_BALANCE: 'الرصيد الجاري',
              DESCRIPTION: 'الوصف',
              PHONE: 'الهاتف',
              ADDRESS: 'العنوان',
              COMPANY: 'الشركة'
  },
  en: {
    LOADING_DATA: 'Loading data...',
    ACCOUNT_STATEMENT: 'Account Statement',
    CURRENT_BALANCE: 'Current Balance',
    VIEW_FULL_STATEMENT: 'View Transactions Report',
    LAST_TRANSACTION: 'Last Transaction',
    ACCOUNT_NUMBER: 'Account Number',
    ACCOUNT_STATUS: 'Account Status',
    TRANSACTIONS_HISTORY: 'Transactions History',
    TRANSACTIONS: 'Transactions',
    DATE: 'Date',
    TYPE: 'Type',
    REFERENCE: 'Reference',
    AMOUNT: 'Amount',
    STATUS: 'Status',
    NO_TRANSACTIONS: 'No transactions found',
                  WELCOME_MESSAGE: 'Hello, this is your balance for the period from August 25, 2022 to August 5, 2025.',
              SWITCH_LANGUAGE: 'العربية',
              BACK_TO_STATEMENT: 'Back to Statement',
              NO_DATA_AVAILABLE: 'No data available at the moment. Please check the link or try again later.',
              SHOWING: 'Showing',
              TO: 'to',
              OF: 'of',
              ENTRIES: 'entries',
              CLICK_TRANSACTION_HISTORY: 'Click "View Transactions Report" if you want to view your entire transaction history.',
              PAID_IN: 'Paid in',
              PAID_OUT: 'Paid out',
              NOTE: 'Note',
              DEBIT: 'Debit',
              CREDIT: 'Credit',
              RUNNING_BALANCE: 'Running balance',
              DESCRIPTION: 'Description',
              PHONE: 'Phone',
              ADDRESS: 'Address',
              COMPANY: 'Company'
  }
};

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = new BehaviorSubject<Language>('ar');
  public currentLanguage$ = this.currentLanguage.asObservable();

  constructor() {
    // Try to get language from localStorage or default to Arabic
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
        this.currentLanguage.next(savedLanguage);
      }
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage.value;
  }

  setLanguage(language: Language): void {
    this.currentLanguage.next(language);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('language', language);
    }
  }

  translate(key: keyof TranslationKeys): string {
    const language = this.currentLanguage.value;
    return translations[language][key] || key;
  }

  getTranslations(): TranslationKeys {
    return translations[this.currentLanguage.value];
  }
}
