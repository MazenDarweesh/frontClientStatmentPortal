import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
  <footer class="app-footer">
    <div class="inner">© {{year}} EgyDynamic</div>
  </footer>
  `,
  styles: [`
    .app-footer { margin-top: 24px; padding: 12px 16px; border-top: 1px solid #e5e7eb; color:#6b7280; background:#fff; }
    .inner { text-align:center; font-size: 12px; }
  `]
})
export class AppFooterComponent { year = new Date().getFullYear(); }


