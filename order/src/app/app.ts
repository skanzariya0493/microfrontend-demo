import { Component, OnDestroy, computed, signal } from '@angular/core';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
};

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  protected readonly userName = signal(localStorage.getItem('mfe-user') ?? '');
  protected readonly items = signal<OrderItem[]>(this.loadInitialCart());
  protected readonly submittedOrder = signal('');
  protected readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
  );

  private readonly authListener = (event: Event): void => {
    this.userName.set((event as CustomEvent<string>).detail ?? '');
  };

  private readonly productListener = (event: Event): void => {
    const product = (event as CustomEvent<Omit<OrderItem, 'quantity'>>).detail;
    this.addProduct(product);
  };

  constructor() {
    window.addEventListener('mfe:auth-changed', this.authListener);
    window.addEventListener('mfe:add-to-order', this.productListener);
  }

  protected submitOrder(): void {
    if (!this.items().length) {
      return;
    }

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const total = this.total();
    this.submittedOrder.set(`${orderId} submitted for $${total}`);
    this.items.set([]);
    localStorage.removeItem('mfe-order-cart');
    localStorage.removeItem('mfe-selected-product');
    window.dispatchEvent(new CustomEvent('mfe:order-submitted', { detail: { orderId, total } }));
  }

  protected clearCart(): void {
    this.items.set([]);
    localStorage.removeItem('mfe-order-cart');
  }

  private addProduct(product: Omit<OrderItem, 'quantity'>): void {
    this.items.update((items) => {
      const existing = items.find((item) => item.id === product.id);
      const next = existing
        ? items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...items, { ...product, quantity: 1 }];

      localStorage.setItem('mfe-order-cart', JSON.stringify(next));
      return next;
    });
  }

  private loadInitialCart(): OrderItem[] {
    const cart = this.parseStorage<OrderItem[]>('mfe-order-cart');
    if (cart?.length) {
      return cart;
    }

    const selected = this.parseStorage<Omit<OrderItem, 'quantity'>>('mfe-selected-product');
    return selected ? [{ ...selected, quantity: 1 }] : [];
  }

  private parseStorage<T>(key: string): T | null {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return null;
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('mfe:auth-changed', this.authListener);
    window.removeEventListener('mfe:add-to-order', this.productListener);
  }
}
