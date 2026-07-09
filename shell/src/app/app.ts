import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly userName = computed(() => this.auth.user()?.name ?? '');
  protected readonly userEmail = computed(() => this.auth.user()?.email ?? '');
  protected readonly userRole = computed(() => this.auth.user()?.role ?? '');

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
