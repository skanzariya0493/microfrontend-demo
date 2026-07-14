import { Component, OnDestroy, computed, inject, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService } from '../cart.service';
import { OrderService, PlacedOrder } from '../order.service';

const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 10;

type PaymentMethod = 'cod' | 'card' | 'upi';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  protected readonly cart = inject(CartService);
  private readonly orderService = inject(OrderService);

  private methodSub?: Subscription;

  /** Emitted with the created order after a successful checkout. */
  readonly placed = output<PlacedOrder>();

  /** Emitted when the user cancels checkout. */
  readonly cancelled = output<void>();

  protected readonly placing = signal(false);
  protected readonly error = signal('');
  protected readonly method = signal<PaymentMethod>('cod');

  /** 1 = shipping address, 2 = payment. */
  protected readonly step = signal<1 | 2>(1);

  private readonly addressControls = [
    'customerName',
    'email',
    'phone',
    'addressLine',
    'city',
    'postalCode',
  ] as const;

  protected readonly shipping = computed(() => {
    const subtotal = this.cart.totalPrice();
    return subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  });
  protected readonly grandTotal = computed(() => this.cart.totalPrice() + this.shipping());

  protected readonly form = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    addressLine: ['', [Validators.required, Validators.minLength(4)]],
    city: ['', [Validators.required]],
    state: [''],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\s-]{3,10}$/)]],
    paymentMethod: ['cod' as PaymentMethod, [Validators.required]],
    // Dummy payment details — required only for the matching method
    cardNumber: [''],
    cardExpiry: [''],
    cardCvv: [''],
    upiId: [''],
  });

  constructor() {
    // Toggle validators on the dummy payment fields as the method changes.
    // Manual subscription (not takeUntilDestroyed) to stay robust under module
    // federation, where the rxjs-interop injection context can be unavailable.
    this.methodSub = this.form.controls.paymentMethod.valueChanges.subscribe((method) => {
      this.method.set(method as PaymentMethod);
      this.applyPaymentValidators(method as PaymentMethod);
    });
  }

  ngOnDestroy(): void {
    this.methodSub?.unsubscribe();
  }

  private applyPaymentValidators(method: PaymentMethod): void {
    const card: Array<[AbstractControl, ReturnType<typeof Validators.pattern> | null]> = [
      [this.form.controls.cardNumber, Validators.pattern(/^[0-9\s]{12,19}$/)],
      [this.form.controls.cardExpiry, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)],
      [this.form.controls.cardCvv, Validators.pattern(/^[0-9]{3,4}$/)],
    ];
    const upi: AbstractControl = this.form.controls.upiId;

    // Reset everything first
    [...card.map((c) => c[0]), upi].forEach((control) => {
      control.clearValidators();
      control.updateValueAndValidity({ emitEvent: false });
    });

    if (method === 'card') {
      card.forEach(([control, pattern]) => {
        control.setValidators([Validators.required, pattern!]);
        control.updateValueAndValidity({ emitEvent: false });
      });
    } else if (method === 'upi') {
      upi.setValidators([Validators.required, Validators.pattern(/^[\w.\-]{2,}@[\w]{2,}$/)]);
      upi.updateValueAndValidity({ emitEvent: false });
    }
  }

  /** Step 1 → 2: validate only the address fields, then move to payment. */
  protected goToPayment(): void {
    const invalid = this.addressControls.some((name) => this.form.get(name)!.invalid);
    if (invalid) {
      this.addressControls.forEach((name) => this.form.get(name)!.markAsTouched());
      return;
    }
    this.error.set('');
    this.step.set(2);
  }

  protected backToAddress(): void {
    this.step.set(1);
  }

  protected placeOrder(): void {
    // On the address step, "submit" (e.g. Enter key) just advances to payment
    if (this.step() === 1) {
      this.goToPayment();
      return;
    }
    if (this.cart.items().length === 0) {
      this.error.set('Your cart is empty.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload = {
      customerName: v.customerName,
      email: v.email,
      phone: v.phone,
      addressLine: v.addressLine,
      city: v.city,
      state: v.state,
      postalCode: v.postalCode,
      paymentMethod: v.paymentMethod,
      items: this.cart.items().map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    this.placing.set(true);
    this.error.set('');
    this.orderService.place(payload).subscribe({
      next: (res) => {
        this.placing.set(false);
        this.cart.clear();
        this.placed.emit(res.data);
      },
      error: (err) => {
        this.placing.set(false);
        this.error.set(err?.error?.message ?? 'Failed to place order. Please try again.');
      },
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
