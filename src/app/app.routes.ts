import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'view-statement',
    loadComponent: () => import('./components/statement-router/statement-router.component').then(m => m.StatementRouterComponent)
  },
  {
    path: 'client-statement',
    loadComponent: () => import('./components/client-statement/client-statement.component').then(m => m.ClientStatementComponent)
  },
  {
    path: 'supplier-statement',
    loadComponent: () => import('./components/supplier-statement/supplier-statement.component').then(m => m.SupplierStatementComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'view-statement' },
  { path: '**', redirectTo: 'view-statement' }
];
