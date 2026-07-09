import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { AuthService } from './auth.service';
import type { LoginRequest } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  isSubmitting = false;
  errorMessage = '';

  loginForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6)
      ]
    ]
  });

  get f() {
    return this.loginForm.controls;
  }

  submitLogin(): void {

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const request: LoginRequest = this.loginForm.getRawValue();

    this.authService.login(request).subscribe({
      next: () => {
        this.isSubmitting = false;

        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        console.log('returnUrl', returnUrl);
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage =
          error?.error?.message ?? 'Invalid email or password';
      }
    });

  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }

}
