import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatementComponent } from './components/statement/statement.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, StatementComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('statement-viewer');
}
