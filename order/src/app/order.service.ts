import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface StatusChange {
  status: string;
  at: string;
}

export interface Order {
  id: number;
  userId: number | null;
  userEmail: string | null;
  customerName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'cod' | 'card' | 'upi';
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  statusHistory: StatusChange[];
  createdAt: string;
}

export interface OrdersResponse {
  data: Order[];
  scope: 'all' | 'own';
  role: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/order`;

  list(): Observable<OrdersResponse> {
    return this.http.get<OrdersResponse>(this.baseUrl, this.authHeaders());
  }

  advance(id: number): Observable<{ message?: string; data: Order }> {
    return this.http.post<{ message?: string; data: Order }>(
      `${this.baseUrl}/${id}/advance`,
      {},
      this.authHeaders()
    );
  }

  private authHeaders(): { headers: HttpHeaders } {
    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('mfe-token') : '';
    return {
      headers: new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }
}
