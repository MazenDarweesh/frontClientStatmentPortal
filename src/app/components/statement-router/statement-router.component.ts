import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-statement-router',
  standalone: true,
  imports: [CommonModule],
  template: `<p>Routing...</p>`
})
export class StatementRouterComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const role = this.route.snapshot.queryParamMap.get('role');
    const key = this.route.snapshot.queryParamMap.get('key');
    const hash = this.route.snapshot.queryParamMap.get('hash');

    if (!key || !hash || !role) {
      // Fallback: show client page without params so the app does not get stuck
      this.router.navigate(['/client-statement']);
      return;
    }

    if (role === 'C' || role === 'S') {
      this.router.navigate(['/client-statement'], { queryParams: { key, hash, role } });
    }
  }
}


