import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { Order, OrderService } from './order.service';
import { API_BASE_URL } from './api.config';

interface Stage {
  key: string;
  label: string;
}

const STAGES: Stage[] = [
  { key: 'pending', label: 'Order placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, DecimalPipe, UpperCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);

  protected readonly stages = STAGES;

  protected readonly userName = signal(localStorage.getItem('mfe-user') ?? '');
  protected readonly isSuperAdmin = signal(this.readIsSuperAdmin());
  protected readonly orders = signal<Order[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly scope = signal<'all' | 'own'>('own');
  protected readonly role = signal('');
  protected readonly advancingId = signal<number | null>(null);
  protected readonly liveConnected = signal(false);
  protected readonly justUpdatedId = signal<number | null>(null);

  private eventSource?: EventSource;

  private readIsSuperAdmin(): boolean {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('mfe-role') === 'super_admin'
    );
  }

  private readonly authListener = (event: Event): void => {
    this.userName.set((event as CustomEvent<string>).detail ?? '');
    this.isSuperAdmin.set(this.readIsSuperAdmin());
    this.loadOrders();
    this.connectStream();
  };

  constructor() {
    window.addEventListener('mfe:auth-changed', this.authListener);
    window.addEventListener('mfe:order-submitted', this.reload);
  }

  ngOnInit(): void {
    this.loadOrders();
    this.connectStream();
  }

  /** Open a live Server-Sent Events connection for instant order updates. */
  private connectStream(): void {
    if (typeof EventSource === 'undefined') {
      return;
    }
    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('mfe-token') : '';
    if (!token) {
      return;
    }

    this.eventSource?.close();
    const url = `${API_BASE_URL}/order/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.addEventListener('connected', () => this.liveConnected.set(true));
    es.addEventListener('order-updated', (e: MessageEvent) => {
      try {
        this.applyOrderUpdate(JSON.parse(e.data) as Order);
      } catch {
        /* ignore malformed event */
      }
    });
    es.onerror = () => this.liveConnected.set(false); // EventSource auto-reconnects

    this.eventSource = es;
  }

  /** Merge a pushed order into the list and briefly highlight it. */
  private applyOrderUpdate(order: Order): void {
    this.orders.update((list) => {
      if (list.some((o) => o.id === order.id)) {
        return list.map((o) => (o.id === order.id ? order : o));
      }
      // A brand-new order the admin should see immediately
      return this.scope() === 'all' ? [order, ...list] : list;
    });
    this.justUpdatedId.set(order.id);
    setTimeout(() => {
      if (this.justUpdatedId() === order.id) {
        this.justUpdatedId.set(null);
      }
    }, 2500);
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
        this.error.set(
          err?.status === 401
            ? 'Please log in to view your orders.'
            : 'Could not load orders. Is the backend running?'
        );
      },
    });
  }

  protected advance(order: Order): void {
    this.advancingId.set(order.id);
    this.orderService.advance(order.id).subscribe({
      next: (res) => {
        this.advancingId.set(null);
        // Replace the updated order in place
        this.orders.update((list) =>
          list.map((o) => (o.id === res.data.id ? res.data : o))
        );
      },
      error: () => {
        this.advancingId.set(null);
        this.error.set('Failed to update delivery status.');
      },
    });
  }

  protected itemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  protected stageIndex(status: string): number {
    return STAGES.findIndex((stage) => stage.key === status);
  }

  protected isDelivered(order: Order): boolean {
    return order.status === 'delivered';
  }

  /** Timestamp for a stage from the order's history, or '' if not reached. */
  protected stageTime(order: Order, stageKey: string): string {
    const entry = order.statusHistory?.find((h) => h.status === stageKey);
    return entry ? entry.at : '';
  }

  ngOnDestroy(): void {
    window.removeEventListener('mfe:auth-changed', this.authListener);
    window.removeEventListener('mfe:order-submitted', this.reload);
    this.eventSource?.close();
  }
}
