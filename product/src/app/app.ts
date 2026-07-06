import { Component, OnDestroy, signal } from '@angular/core';

type ProductItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnDestroy {
  protected readonly userName = signal(localStorage.getItem('mfe-user') ?? '');
  protected readonly lastOrder = signal('');
  protected readonly products: ProductItem[] = [
    { id: 'PRD-101', name: 'Wireless Keyboard', price: 69, stock: 14 },
    { id: 'PRD-204', name: 'USB-C Dock', price: 129, stock: 8 },
    { id: 'PRD-315', name: 'Noise Cancelling Headset', price: 189, stock: 5 },
  ];

  private readonly authListener = (event: Event): void => {
    this.userName.set((event as CustomEvent<string>).detail ?? '');
  };

  private readonly orderListener = (event: Event): void => {
    const detail = (event as CustomEvent<{ orderId: string; total: number }>).detail;
    this.lastOrder.set(`Order ${detail.orderId} submitted for $${detail.total}`);
  };

  constructor() {
    window.addEventListener('mfe:auth-changed', this.authListener);
    window.addEventListener('mfe:order-submitted', this.orderListener);
  }

  protected addToOrder(product: ProductItem): void {
    localStorage.setItem('mfe-selected-product', JSON.stringify(product));
    window.dispatchEvent(new CustomEvent('mfe:add-to-order', { detail: product }));
  }

  ngOnDestroy(): void {
    window.removeEventListener('mfe:auth-changed', this.authListener);
    window.removeEventListener('mfe:order-submitted', this.orderListener);
  }
}
