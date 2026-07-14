import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ProductService, Product } from './product.service';
import { ProductForm } from './product-form/product-form';
import { CartList } from './cart-list/cart-list';
import { CartService } from './cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductForm, CartList],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  protected readonly cart = inject(CartService);

  protected readonly userName = signal(localStorage.getItem('mfe-user') ?? '');
  protected readonly lastOrder = signal('');

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly editingProduct = signal<Product | null>(null);

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

  ngOnInit(): void {
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set('');
    this.productService.list().subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load products. Is the backend running?');
        this.loading.set(false);
      },
    });
  }

  protected edit(product: Product): void {
    this.editingProduct.set(product);
  }

  protected onSaved(): void {
    this.editingProduct.set(null);
    this.loadProducts();
  }

  protected onCancel(): void {
    this.editingProduct.set(null);
  }

  protected remove(product: Product): void {
    if (product.id === undefined) {
      return;
    }
    this.productService.remove(product.id).subscribe({
      next: () => {
        if (this.editingProduct()?.id === product.id) {
          this.editingProduct.set(null);
        }
        this.loadProducts();
      },
      error: () => this.error.set('Failed to delete product'),
    });
  }

  protected addToCart(product: Product): void {
    this.cart.add(product);
  }

  ngOnDestroy(): void {
    window.removeEventListener('mfe:auth-changed', this.authListener);
    window.removeEventListener('mfe:order-submitted', this.orderListener);
  }
}
