import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-wrapper">
      <div class="welcome-card">
        <div class="logo-row">
          <img src="assets/EGYD-Logo.png" alt="Dynamic Pro" class="logo" />
          <div class="brand-text">Dynamic <span>Pro</span></div>
        </div>
        <h1 class="headline">Welcome to Dynamic Pro</h1>
        <p class="subtitle">Preparing your experience...</p>
        <div class="progress-bar"><div class="bar"></div></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }
    .home-wrapper { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:2rem; background:linear-gradient(135deg,#f8fafc,#eef2ff); }
    .welcome-card { width:100%; max-width:520px; background:rgba(255,255,255,0.9); backdrop-filter:blur(14px); border:1px solid #e2e8f0; border-radius:28px; padding:2.5rem 2.75rem 2.75rem; box-shadow:0 10px 40px -10px rgba(0,0,0,0.15); text-align:center; position:relative; overflow:hidden; }
    .welcome-card:before { content:''; position:absolute; inset:0; background:radial-gradient(circle at 70% 20%, rgba(99,102,241,0.12), transparent 60%); pointer-events:none; }
    .logo-row { display:flex; align-items:center; gap:1rem; justify-content:center; margin-bottom:1.25rem; }
    .logo { width:60px; height:60px; border-radius:16px; object-fit:cover; box-shadow:0 4px 16px rgba(0,0,0,0.08); }
    .brand-text { font-family:'Cairo','Segoe UI',sans-serif; font-size:1.9rem; font-weight:700; letter-spacing:.5px; color:#0f172a; }
    .brand-text span { background:linear-gradient(135deg,#f28c00,#ffb54d); -webkit-background-clip:text; color:transparent; }
    .headline { margin:0 0 .75rem; font-family:'Cairo','Segoe UI',sans-serif; font-size:2.1rem; font-weight:800; line-height:1.15; background:linear-gradient(135deg,#2563eb,#6366f1); -webkit-background-clip:text; color:transparent; }
    .subtitle { margin:0 0 1.75rem; font-size:1rem; font-weight:500; color:#475569; letter-spacing:.3px; }
    .progress-bar { width:100%; height:8px; background:#e2e8f0; border-radius:6px; overflow:hidden; position:relative; }
    .bar { width:40%; height:100%; background:linear-gradient(90deg,#2563eb,#6366f1,#2563eb); background-size:200% 100%; animation: slide 1.3s linear infinite; }
    @keyframes slide { 0% { transform:translateX(-40%); } 100% { transform:translateX(260%); } }
    @media (max-width:600px){ .welcome-card { padding:2rem 1.75rem 2.25rem; border-radius:22px; } .headline { font-size:1.75rem; } .brand-text { font-size:1.6rem; } }
  `]
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {
    // External redirect (component-based instead of global script)
    window.location.href = 'https://egydynamic.com/';
  }
}
