import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

export type LoginRequest = {
  email: string;
  password: string;
};

export interface SignupRequest {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
}

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export type LoginResponse = AuthResponse;
export type SignupResponse = AuthResponse;

/**
 * The `product` and `order` remotes read these keys directly and listen for
 * `mfe:auth-changed`, so the flat key layout and the event are a cross-app
 * contract — not an implementation detail of the shell.
 */
const NAME_KEY = 'mfe-user';
const EMAIL_KEY = 'mfe-email';
const ROLE_KEY = 'mfe-role';
const TOKEN_KEY = 'mfe-token';
const AUTH_CHANGED = 'mfe:auth-changed';

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function read(key: string): string {
  return hasStorage() ? (localStorage.getItem(key) ?? '') : '';
}

function restoreUser(): AuthUser | null {
  const name = read(NAME_KEY);
  if (!name || !read(TOKEN_KEY)) {
    return null;
  }
  return { id: '', name, email: read(EMAIL_KEY), role: read(ROLE_KEY) };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly currentUser = signal<AuthUser | null>(restoreUser());
  private readonly currentToken = signal<string>(read(TOKEN_KEY));

  readonly user = this.currentUser.asReadonly();
  readonly token = this.currentToken.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, data)
      .pipe(tap((response) => this.setSession(response)));
  }

  signup(data: SignupRequest): Observable<SignupResponse> {
    return this.http
      .post<SignupResponse>(`${environment.apiUrl}/auth/signup`, data)
      .pipe(tap((response) => this.setSession(response)));
  }

  setSession(response: AuthResponse): void {
    this.currentUser.set(response.user);
    this.currentToken.set(response.token);

    if (hasStorage()) {
      localStorage.setItem(NAME_KEY, response.user.name);
      localStorage.setItem(EMAIL_KEY, response.user.email);
      localStorage.setItem(ROLE_KEY, response.user.role);
      localStorage.setItem(TOKEN_KEY, response.token);
    }

    this.broadcast(response.user.name);
  }

  logout(): void {
    this.currentUser.set(null);
    this.currentToken.set('');

    if (hasStorage()) {
      localStorage.removeItem(NAME_KEY);
      localStorage.removeItem(EMAIL_KEY);
      localStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }

    this.broadcast('');
  }

  private broadcast(name: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_CHANGED, { detail: name }));
    }
  }
}
