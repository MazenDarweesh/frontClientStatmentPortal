import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
  <header class="app-header">
    <a href="https://egydynamic.com/" target="_blank" class="brand">
      <img src="assets/EGYD-Logo.png" alt="EGYD" class="logo" />
      <span class="title">dynamic <span class="pro">pro</span></span>
    </a>
  </header>
  `,
  styles: [`
    .app-header { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#fff; border-bottom:1px solid #e5e7eb; }
    .brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
    .logo { height: 36px; }
    .title { font-weight: 700; color:#111827; letter-spacing: .5px; }
    .title .pro { color:#2563eb; }
  `]
})
export class AppHeaderComponent {}


