import { AppCart, CartItem, CartCoupon } from "../../models/cart";
import { MOCK_PRODUCTS } from "./mock.data";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

interface CartStore { items: CartItem[]; coupons: CartCoupon[] }

const MOCK_COUPON_DEFS: Record<string, { type: string; value: number }> = {
  "KPOP10":  { type: "percent",    value: 10 },
  "VIPFAN":  { type: "fixed_cart", value: 15 },
  "NEWUSER": { type: "fixed_cart", value: 5  },
};

let store: CartStore = { items: [], coupons: [] };

export function getCartStore() {
  return store;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function subtotal(): number {
  return store.items.reduce((s, i) => s + i.lineTotal, 0);
}

function buildCart(token: string): AppCart {
  const sub      = subtotal();
  const discount = store.coupons.reduce((s, c) => s + c.discount, 0);
  const shipping = store.items.length > 0 ? 5.95 : 0;
  const tax      = parseFloat(((sub - discount) * 0.08).toFixed(2));
  const total    = parseFloat((sub - discount + shipping + tax).toFixed(2));

  return {
    cartToken:     token,
    items:         [...store.items],
    itemsCount:    store.items.reduce((s, i) => s + i.quantity, 0),
    coupons:       [...store.coupons],
    needsShipping: store.items.length > 0,
    needsPayment:  store.items.length > 0,
    isEmpty:       store.items.length === 0,
    totals: {
      subtotal:      sub,
      discountTotal: discount,
      shippingTotal: shipping,
      taxTotal:      tax,
      total,
      currencyCode:   "USD",
      currencySymbol: "$",
    },
  };
}

function calcDiscount(def: { type: string; value: number }, sub: number): number {
  return parseFloat(
    (def.type === "percent" ? (sub * def.value) / 100 : Math.min(def.value, sub)).toFixed(2)
  );
}

function makeKey(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// MockCartProvider
// ---------------------------------------------------------------------------

export class MockCartProvider {

  static async getCart(token: string): Promise<AppCart> {
    await delay(300);
    return buildCart(token);
  }

  /**
   * variantId — when Flutter provides it (Option B), we skip selectedOptions
   *             lookup and match the variant directly by ID. Faster and more
   *             reliable than attribute matching.
   *
   * selectedOptions — still required for display (building CartItemOption[])
   *                   and as a fallback when variantId is not provided.
   */
  static async addItem(
    productId: string,
    quantity: number,
    selectedOptions?: Record<string, string>,
    variantId?: string,
  ): Promise<AppCart> {
    await delay(600);

    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!product)                              throw new Error(`Product ${productId} not found`);
    if (product.stockStatus === "outofstock") throw new Error(`${product.name} is out of stock`);

    let resolvedVariantId: string | undefined;
    let unitPrice = product.price;
    let image     = product.featuredImage.url;

    if (product.type === "variable") {
      if (!selectedOptions || Object.keys(selectedOptions).length === 0) {
        throw new Error(`${product.name} requires a variant selection`);
      }

      // If Flutter sent variantId — use it directly, just validate it exists
      // If not — resolve by matching selectedOptions (fallback path)
      const variant = variantId
        ? product.variants?.find((v) => v.id === variantId)
        : product.variants?.find((v) =>
            Object.entries(selectedOptions).every(([k, val]) => v.selectedOptions[k] === val)
          );

      if (!variant)                              throw new Error("Selected variant not found");
      if (variant.stockStatus === "outofstock") throw new Error("This variant is out of stock");

      resolvedVariantId = variant.id;
      unitPrice         = variant.price;
      image             = variant.image?.url ?? image;
    }

    // Build clean display options from selectedOptions for Flutter cart UI
    const options = selectedOptions
      ? Object.entries(selectedOptions).map(([name, value]) => ({
          name:  name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      : [];

    // Merge with existing cart item if same product + variant
    const existingIdx = store.items.findIndex(
      (i) => i.productId === productId && i.variantId === resolvedVariantId
    );

    if (existingIdx >= 0) {
      const ex     = store.items[existingIdx];
      const newQty = ex.quantity + quantity;
      store.items[existingIdx] = {
        ...ex,
        quantity:  newQty,
        lineTotal: parseFloat((unitPrice * newQty).toFixed(2)),
      };
    } else {
      store.items.push({
        key:       makeKey(),
        productId,
        variantId: resolvedVariantId,
        name:      product.name,
        quantity,
        price:     unitPrice,
        lineTotal: parseFloat((unitPrice * quantity).toFixed(2)),
        image,
        options,
      });
    }

    return buildCart("mock-cart-token");
  }

  static async removeItem(key: string): Promise<AppCart> {
    await delay(400);
    const before = store.items.length;
    store.items  = store.items.filter((i) => i.key !== key);
    if (store.items.length === before) throw new Error(`Cart item ${key} not found`);
    return buildCart("mock-cart-token");
  }

  static async updateItemQuantity(key: string, quantity: number): Promise<AppCart> {
    await delay(400);
    const idx = store.items.findIndex((i) => i.key === key);
    if (idx < 0) throw new Error(`Cart item ${key} not found`);

    if (quantity <= 0) {
      store.items.splice(idx, 1);
    } else {
      const item = store.items[idx];
      store.items[idx] = {
        ...item,
        quantity,
        lineTotal: parseFloat((item.price * quantity).toFixed(2)),
      };
    }
    return buildCart("mock-cart-token");
  }

  static async applyCoupon(code: string): Promise<AppCart> {
    await delay(500);
    const upper = code.toUpperCase();
    const def   = MOCK_COUPON_DEFS[upper];
    if (!def)                                         throw new Error(`Coupon "${code}" is not valid`);
    if (store.coupons.some((c) => c.code === upper)) throw new Error(`Coupon "${code}" already applied`);

    store.coupons.push({
      code:         upper,
      discountType: def.type,
      discount:     calcDiscount(def, subtotal()),
    });
    return buildCart("mock-cart-token");
  }

  static async removeCoupon(code: string): Promise<AppCart> {
    await delay(300);
    const upper  = code.toUpperCase();
    const before = store.coupons.length;
    store.coupons = store.coupons.filter((c) => c.code !== upper);
    if (store.coupons.length === before) throw new Error(`Coupon "${code}" not in cart`);
    return buildCart("mock-cart-token");
  }

  static resetCart(): void {
    store = { items: [], coupons: [] };
  }

   
// ============================================================
// providers/mock/mock.cart.ts     ← ADD mergeCarts method
// Add inside MockCartProvider class
// ============================================================
 
static async mergeCarts(
  guestCartToken: string,
  _userCartToken?: string | null,
): Promise<AppCart> {
  await delay(500);
  // In mock mode both tokens point to the same in-memory store
  // so merge is a no-op — just return the current cart state
  return buildCart(_userCartToken ?? guestCartToken);
}
}