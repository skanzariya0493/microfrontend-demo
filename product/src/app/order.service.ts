import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api.config';

// The shell stores the JWT here after login (cross-app contract).
function authHeaders(): { headers?: HttpHeaders } {
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('mfe-token') : '';
  return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
}

export interface OrderItemPayload {
  productId: number;
  quantity: number;
  price: number;
}

export interface OrderPayload {
  customerName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'cod' | 'card' | 'upi';
  items: OrderItemPayload[];
}

export interface PlacedOrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface PlacedOrder {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  paymentMethod: 'cod' | 'card' | 'upi';
  items: PlacedOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/order`;

  place(order: OrderPayload): Observable<{ message?: string; data: PlacedOrder }> {
    return this.http.post<{ message?: string; data: PlacedOrder }>(
      this.baseUrl,
      order,
      authHeaders()
    );
  }
}
