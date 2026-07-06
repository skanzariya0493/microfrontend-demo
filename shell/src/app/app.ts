import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoginComponent, LoginSuccessEvent } from './login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LoginComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected userName = localStorage.getItem('mfe-user') ?? '';
  protected userEmail = localStorage.getItem('mfe-email') ?? '';
  protected userRole = localStorage.getItem('mfe-role') ?? '';

  protected get isLoggedIn(): boolean {
    return Boolean(this.userName);
  }

  protected login(event: LoginSuccessEvent): void {
    this.userName = event.name;
    this.userEmail = event.email;
    this.userRole = event.role;
    localStorage.setItem('mfe-user', this.userName);
    localStorage.setItem('mfe-email', this.userEmail);
    localStorage.setItem('mfe-role', this.userRole);
    localStorage.setItem('mfe-token', event.token);
    window.dispatchEvent(new CustomEvent('mfe:auth-changed', { detail: this.userName }));
  }

  protected logout(): void {
    this.userName = '';
    this.userEmail = '';
    this.userRole = '';
    localStorage.removeItem('mfe-user');
    localStorage.removeItem('mfe-email');
    localStorage.removeItem('mfe-role');
    localStorage.removeItem('mfe-token');
    window.dispatchEvent(new CustomEvent('mfe:auth-changed', { detail: '' }));
  }
}
