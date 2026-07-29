import { Component, inject } from '@angular/core';
import { RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'CompesaHub';
  isAuthPage = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAuthPage = event.url.startsWith('/auth');
      });
  }
}
