import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class SignupComponent {

  signupData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  signup(): void {

    if (this.signupData.password !== this.signupData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    console.log(this.signupData);

    // TODO
    // Call backend API
    // POST /api/auth/register

  }

}