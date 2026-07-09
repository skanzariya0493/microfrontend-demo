import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss']
})
export class SignupComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  isSubmitting = false;
  errorMessage = '';

  signupForm = this.fb.group(
    {
      firstName: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],

      lastName: [''],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],

      confirmPassword: ['', [
        Validators.required
      ]]
    },
    {
      validators: this.passwordMatchValidator()
    }
  );

  get f() {
    return this.signupForm.controls;
  }

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword
        ? null
        : { passwordMismatch: true };
    };
  }

  signup(): void {

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.signup(this.signupForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage =
          error?.error?.message ?? 'Could not create your account';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

}
