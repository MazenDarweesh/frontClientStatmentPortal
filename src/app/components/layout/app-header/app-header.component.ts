import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { TranslationService } from '../../../services/translation.service';
import { LoggingService } from '../../../services/logging.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
  <header class="app-header">
    <div class="inner">
      <a [href]="dynamicProUrl" target="_blank" class="brand" (click)="logDynamicProClick()">
        <img src="assets/EGYD-Logo.png" alt="EGYD" class="logo" />
        <span class="title">Dynamic <span class="pro">Pro</span></span>
      </a>
      <a class="about" [href]="dynamicProUrl" target="_blank" (click)="logDynamicProClick()">تعرف علينا Dynamic Pro</a>
      <button class="lang" (click)="toggleLanguage()">{{ 'SWITCH_LANGUAGE' | translate }}</button>
    </div>
  </header>
  `,
  styles: [`
    .app-header { position: fixed; top:0; left:0; right:0; z-index: 1000; background:#fff; border-bottom:1px solid #e5e7eb; }
    .inner { max-width: 1200px; margin: 0 auto; padding:12px 16px; display:flex; align-items:center; gap:16px; }
    .brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
    .logo { height: 36px; }
    .title { font-weight: 800; color:#111827; letter-spacing: .3px; font-size: 1.1rem; font-family: inherit; }
    .title .pro { color:#6c63ff; }
    .about { margin-left: auto; color:#6b7280; text-decoration:none; font-weight:700; }
    .about:hover { color:#6c63ff; text-decoration: underline; }
    .lang { margin-left: 12px; background: transparent; border: 2px solid #6c63ff; color: #6c63ff; font-weight: 600; padding: 6px 10px; border-radius: 8px; cursor: pointer; }
    .lang:hover { background:#6c63ff; color:#fff; }
  `]
})
export class AppHeaderComponent {
  @Input() dynamicProUrl: string | undefined;
  @Input() companyKey: string | undefined;
  @Input() accountName: string | undefined;
  @Input() accountType: string | undefined;
  constructor(private translationService: TranslationService, private loggingService: LoggingService) {}
  toggleLanguage() {
    const current = this.translationService.getCurrentLanguage();
    this.translationService.setLanguage(current === 'ar' ? 'en' : 'ar');
  }
  logDynamicProClick() {
    this.loggingService.logEvent({
      eventType: 'Button_Click',
      companyKey: this.companyKey,
      accountName: this.accountName,
      accountType: this.accountType
    });
  }
}


