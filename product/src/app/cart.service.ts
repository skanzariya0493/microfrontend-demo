import { Injectable, computed, effect, signal } from '@angular/core';
import { Product } from './product.service';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  quantity: number;
}

const STORAGE_KEY = 'mfe-cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.load());

  /** Read-only view of the cart items. */
  readonly items = this._items.asReadonly();

  /** Total number of units across all items. */
  readonly totalItems = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  /** Total price of the whole cart. */
  readonly totalPrice = computed(() =>
    this._items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  constructor() {
    // Persist the cart whenever it changes
    effect(() => {
      const items = this._items();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    });
  }

  /** Add a product; if already in the cart, bump its quantity. */
  add(product: Product): void {
    if (product.id == null) {
      return;
    }
    const id = product.id;
    this._items.update((list) => {
      const existing = list.find((item) => item.id === id);
      if (existing) {
        return list.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...list,
        {
          id,
          name: product.name,
          price: product.price,
          category: product.category,
          quantity: 1,
        },
      ];
    });
  }

  increment(id: number): void {
    this._items.update((list) =>
      list.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  }

  /** Decrease quantity; removes the item when it reaches 0. */
  decrement(id: number): void {
    this._items.update((list) =>
      list
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  remove(id: number): void {
    this._items.update((list) => list.filter((item) => item.id !== id));
  }

  clear(): void {
    this._items.set([]);
  }

  private load(): CartItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
