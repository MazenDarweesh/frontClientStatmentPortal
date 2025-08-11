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
    data: { role: 'S' },
    loadComponent: () => import('./components/client-statement/client-statement.component').then(m => m.ClientStatementComponent)
  },
  {
    path: 'client-transactions',
    loadComponent: () => import('./components/client-transactions/client-transactions.component').then(m => m.ClientTransactionsComponent)
  },
  {
    path: 'supplier-transactions',
    data: { role: 'S' },
    loadComponent: () => import('./components/client-transactions/client-transactions.component').then(m => m.ClientTransactionsComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: 'view-statement' },
  { path: '**', redirectTo: 'view-statement' }
];
