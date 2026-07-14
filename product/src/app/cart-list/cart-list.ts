import { Component, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-cart-list',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './cart-list.html',
  styleUrl: './cart-list.scss',
})
export class CartList {
  protected readonly cart = inject(CartService);

  /** Emitted when the user wants to proceed to checkout. */
  readonly checkout = output<void>();
}
