import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, UpperCasePipe } from '@angular/common';
import { ProductService, Product } from './product.service';
import { ProductForm } from './product-form/product-form';
import { CartList } from './cart-list/cart-list';
import { CartService } from './cart.service';
import { Checkout } from './checkout/checkout';
import { PlacedOrder } from './order.service';
import { ToastContainer } from './toast/toast';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductForm, CartList, Checkout, ToastContainer, DecimalPipe, UpperCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  protected readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  protected readonly userName = signal(localStorage.getItem('mfe-user') ?? '');
  protected readonly isSuperAdmin = signal(this.readIsSuperAdmin());
  protected readonly lastOrder = signal('');

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly editingProduct = signal<Product | null>(null);

  protected readonly checkingOut = signal(false);
  protected readonly placedOrder = signal<PlacedOrder | null>(null);

  private readIsSuperAdmin(): boolean {
    return (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('mfe-role') === 'super_admin'
    );
  }

  private readonly authListener = (event: Event): void => {
    this.userName.set((event as CustomEvent<string>).detail ?? '');
    // Role may have changed on login/logout — re-read it
    this.isSuperAdmin.set(this.readIsSuperAdmin());
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
    const wasEditing = this.editingProduct() !== null;
    this.editingProduct.set(null);
    this.loadProducts();
    this.toast.success(wasEditing ? 'Product updated' : 'Product added');
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
        this.toast.success(`${product.name} deleted`);
      },
      error: () => this.toast.error('Failed to delete product'),
    });
  }

  protected addToCart(product: Product): void {
    this.cart.add(product);
    this.toast.success(`${product.name} added to cart`);
  }

  protected startCheckout(): void {
    this.placedOrder.set(null);
    this.checkingOut.set(true);
  }

  protected onCheckoutCancel(): void {
    this.checkingOut.set(false);
  }

  protected onOrderPlaced(order: PlacedOrder): void {
    this.checkingOut.set(false);
    this.placedOrder.set(order);
    this.toast.success(`Order #${order.id} placed successfully`);
    // Stock was reduced on the server — refresh the catalog to show new levels
    this.loadProducts();
  }

  protected dismissOrder(): void {
    this.placedOrder.set(null);
  }

  ngOnDestroy(): void {
    window.removeEventListener('mfe:auth-changed', this.authListener);
    window.removeEventListener('mfe:order-submitted', this.orderListener);
  }
}
