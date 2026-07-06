import { Component, EventEmitter, Output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from './auth.service';

export type LoginSuccessEvent = {
  name: string;
  email: string;
  role: string;
  token: string;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent {
  @Output() loginSuccess = new EventEmitter<LoginSuccessEvent>();

  protected email = 'admin@example.com';
  protected password = 'admin123';
  protected errorMessage = '';
  protected isSubmitting = false;

  constructor(private readonly authService: AuthService) {}

  protected submitLogin(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.isSubmitting = true;
    this.authService
      .login({
        email: this.email.trim(),
        password: this.password,
      })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          this.loginSuccess.emit({
            name: response.user.name,
            email: response.user.email,
            role: response.user.role,
            token: response.token,
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.error?.message || 'Login failed. Check backend server and credentials.';
        },
      });
  }
}
