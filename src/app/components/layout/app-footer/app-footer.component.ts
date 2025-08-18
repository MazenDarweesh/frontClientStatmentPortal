import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggingService } from '../../../services/logging.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
  <footer class="app-footer">
    <div class="inner">
      <a class="about" [href]="dynamicProUrl" target="_blank" (click)="logDynamicProClick()">تعرف علينا Dynamic Pro</a>
      © {{year}} EgyDynamic
    </div>
  </footer>
  `,
  styles: [`
    .app-footer { margin-top: 24px; padding: 12px 16px; border-top: 1px solid #e5e7eb; color:#6b7280; background:#fff; }
    .inner { text-align:center; font-size: 12px; }
  `]
})
export class AppFooterComponent {
  year = new Date().getFullYear();
  @Input() dynamicProUrl: string | undefined;
  @Input() companyKey: string | undefined;
  @Input() accountName: string | undefined;
  @Input() accountType: string | undefined;
  constructor(private loggingService: LoggingService) {}
  logDynamicProClick() {
    this.loggingService.logEvent({
      eventType: 'Button_Click',
      companyKey: this.companyKey,
      accountName: this.accountName,
      accountType: this.accountType
    });
  }
}


