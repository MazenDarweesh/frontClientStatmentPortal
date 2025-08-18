import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './components/layout/app-header/app-header.component';
import { AppFooterComponent } from './components/layout/app-footer/app-footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('statement-viewer');
}
