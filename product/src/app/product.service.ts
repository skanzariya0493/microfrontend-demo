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

export interface Product {
  id?: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

interface ProductResponse {
  message?: string;
  data: Product;
}

interface ProductListResponse {
  data: Product[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/product`;

  list(): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(this.baseUrl);
  }

  create(product: Product): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.baseUrl, product, authHeaders());
  }

  update(id: number, product: Product): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.baseUrl}/${id}`, product, authHeaders());
  }

  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${id}`, authHeaders());
  }
}
