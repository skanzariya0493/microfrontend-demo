import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { Order, OrderService } from './order.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);

  protected readonly userName = signal(localStorage.getItem('mfe-user') ?? '');
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly scope = signal<'all' | 'own'>('own');
  protected readonly role = signal('');

  private readonly authListener = (event: Event): void => {
    this.userName.set((event as CustomEvent<string>).detail ?? '');
    this.loadOrders();
  };

  constructor() {
    window.addEventListener('mfe:auth-changed', this.authListener);
    // Refresh the list when a new order is submitted from the product remote
    window.addEventListener('mfe:order-submitted', this.reload);
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  private readonly reload = (): void => this.loadOrders();

  protected loadOrders(): void {
    this.loading.set(true);
    this.error.set('');
    this.orderService.list().subscribe({
      next: (res) => {
        this.orders.set(res.data ?? []);
        this.scope.set(res.scope);
        this.role.set(res.role);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 401) {
          this.error.set('Please log in to view your orders.');
        } else {
          this.error.set('Could not load orders. Is the backend running?');
        }
      },
    });
  }

  protected itemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  ngOnDestroy(): void {
    window.removeEventListener('mfe:auth-changed', this.authListener);
    window.removeEventListener('mfe:order-submitted', this.reload);
  }
}
