import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, ProductService } from '../product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
})
export class ProductForm {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);

  /** Product being edited; null (default) means the form is in "add" mode. */
  readonly editing = input<Product | null>(null);

  /** Emitted after a successful create or update. */
  readonly saved = output<void>();

  /** Emitted when the user cancels an edit. */
  readonly cancelled = output<void>();

  protected readonly saving = signal(false);
  protected readonly error = signal('');

  /** Category options shown in the add/update form dropdown. */
  protected readonly categories = [
    'Accessories',
    'Connectivity',
    'Audio',
    'Video',
    'Storage',
    'Display',
    'Networking',
    'Power',
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: [''],
    description: [''],
    price: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(1_000_000),
        // up to 2 decimal places, no negatives
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    stock: [
      0,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(1_000_000),
        // whole numbers only
        Validators.pattern(/^\d+$/),
      ],
    ],
  });

  constructor() {
    // Keep the form in sync with the `editing` input
    effect(() => {
      const product = this.editing();
      this.error.set('');
      if (product) {
        this.form.setValue({
          name: product.name,
          category: product.category ?? '',
          description: product.description ?? '',
          price: product.price,
          stock: product.stock,
        });
      } else {
        this.form.reset({ name: '', category: '', description: '', price: 0, stock: 0 });
      }
    });
  }

  protected isEditing(): boolean {
    return this.editing() !== null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const id = this.editing()?.id ?? null;
    const request =
      id === null
        ? this.productService.create(value)
        : this.productService.update(id, value);

    this.saving.set(true);
    this.error.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.form.reset({ name: '', category: '', description: '', price: 0, stock: 0 });
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.error.set(id === null ? 'Failed to create product' : 'Failed to update product');
      },
    });
  }

  protected cancel(): void {
    this.cancelled.emit();
  }
}
