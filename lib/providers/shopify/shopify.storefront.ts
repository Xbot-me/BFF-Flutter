import { ShopifyClient } from "./shopify.client";
import { ProductSummary, ProductDetail, ProductImage, ProductVariant } from "@/lib/models/product";
import { AppCart, CartItem, CartTotals } from "@/lib/models/cart";
import { ProductCategory } from "@/lib/models/catalog";

export class ShopifyStorefrontProvider {
  static getClient(tenantId?: string | null): ShopifyClient {
    return ShopifyClient.fromTenant(tenantId);
  }

  // ── Products List ──
  static async getProducts(
    options: { first?: number; query?: string; sortKey?: string; reverse?: boolean } = {},
    tenantId?: string | null
  ): Promise<ProductSummary[]> {
    const client = this.getClient(tenantId);
    const query = `
      query GetProducts($first: Int!, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean) {
        products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              id
              handle
              title
              productType
              availableForSale
              totalInventory
              createdAt
              updatedAt
              priceRange {
                minVariantPrice { amount currencyCode }
                maxVariantPrice { amount currencyCode }
              }
              compareAtPriceRange {
                minVariantPrice { amount currencyCode }
              }
              featuredImage {
                id
                url
                altText
              }
              collections(first: 1) {
                nodes {
                  title
                }
              }
            }
          }
        }
      }
    `;

    const data = await client.query(query, {
      first: options.first || 20,
      query: options.query || null,
      sortKey: options.sortKey || "BEST_SELLING",
      reverse: options.reverse || false,
    });

    return data.products.edges.map(({ node }: any): ProductSummary => {
      const minPrice = parseFloat(node.priceRange.minVariantPrice.amount);
      const maxPrice = parseFloat(node.priceRange.maxVariantPrice.amount);
      const comparePrice = node.compareAtPriceRange?.minVariantPrice?.amount
        ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
        : null;

      const onSale = Boolean(comparePrice && comparePrice > minPrice);

      return {
        id: node.id.replace(/^gid:\/\/shopify\/Product\//, ""),
        slug: node.handle,
        name: node.title,
        type: "simple",
        price: minPrice,
        priceRange: minPrice !== maxPrice ? { min: minPrice, max: maxPrice } : undefined,
        regularPrice: comparePrice || minPrice,
        salePrice: onSale ? minPrice : undefined,
        onSale,
        stockStatus: node.availableForSale ? "instock" : "outofstock",
        stockQuantity: node.totalInventory ?? 10,
        featuredImage: {
          id: node.featuredImage?.id || "img_feat",
          url: node.featuredImage?.url || "",
          alt: node.featuredImage?.altText || node.title,
        },
        category: node.collections?.nodes?.[0]?.title || "Merch",
        averageRating: 4.8,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
      };
    });
  }

  // ── Product Detail ──
  static async getProduct(idOrHandle: string, tenantId?: string | null): Promise<ProductDetail | null> {
    const client = this.getClient(tenantId);
    const isId = idOrHandle.startsWith("gid://shopify/Product/") || /^\d+$/.test(idOrHandle);

    const query = isId
      ? `
        query GetProductById($id: ID!) {
          product(id: $id) {
            ...ProductFields
          }
        }
      `
      : `
        query GetProductByHandle($handle: String!) {
          product(handle: $handle) {
            ...ProductFields
          }
        }
      `;

    const fragment = `
      fragment ProductFields on Product {
        id
        handle
        title
        description
        descriptionHtml
        productType
        availableForSale
        totalInventory
        createdAt
        updatedAt
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
        compareAtPriceRange {
          minVariantPrice { amount currencyCode }
        }
        featuredImage {
          id
          url
          altText
        }
        images(first: 10) {
          nodes {
            id
            url
            altText
          }
        }
        options {
          name
          values
        }
        variants(first: 50) {
          nodes {
            id
            sku
            title
            availableForSale
            quantityAvailable
            price { amount currencyCode }
            selectedOptions {
              name
              value
            }
            image {
              id
              url
              altText
            }
          }
        }
        collections(first: 1) {
          nodes {
            title
          }
        }
      }
    `;

    const cleanId = isId && !idOrHandle.startsWith("gid://shopify/Product/")
      ? `gid://shopify/Product/${idOrHandle}`
      : idOrHandle;

    const data = await client.query(query + fragment, isId ? { id: cleanId } : { handle: idOrHandle });
    const node = data.product;
    if (!node) return null;

    const minPrice = parseFloat(node.priceRange.minVariantPrice.amount);
    const maxPrice = parseFloat(node.priceRange.maxVariantPrice.amount);
    const comparePrice = node.compareAtPriceRange?.minVariantPrice?.amount
      ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
      : null;

    const onSale = Boolean(comparePrice && comparePrice > minPrice);

    const variants: ProductVariant[] = (node.variants?.nodes || []).map((v: any) => {
      const selectedOpts: Record<string, string> = {};
      for (const opt of v.selectedOptions || []) {
        selectedOpts[opt.name.toLowerCase()] = opt.value;
      }

      return {
        id: v.id.replace(/^gid:\/\/shopify\/ProductVariant\//, ""),
        sku: v.sku || "",
        price: parseFloat(v.price.amount),
        selectedOptions: selectedOpts,
        stockStatus: v.availableForSale ? "instock" : "outofstock",
        stockQuantity: v.quantityAvailable ?? 10,
        image: v.image ? { id: v.image.id, url: v.image.url, alt: v.image.altText || "" } : undefined,
      };
    });

    const images: ProductImage[] = (node.images?.nodes || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.altText || node.title,
    }));

    return {
      id: node.id.replace(/^gid:\/\/shopify\/Product\//, ""),
      slug: node.handle,
      name: node.title,
      type: variants.length > 1 ? "variable" : "simple",
      price: minPrice,
      priceRange: minPrice !== maxPrice ? { min: minPrice, max: maxPrice } : undefined,
      regularPrice: comparePrice || minPrice,
      salePrice: onSale ? minPrice : undefined,
      onSale,
      stockStatus: node.availableForSale ? "instock" : "outofstock",
      stockQuantity: node.totalInventory ?? 10,
      featuredImage: {
        id: node.featuredImage?.id || "img_feat",
        url: node.featuredImage?.url || images[0]?.url || "",
        alt: node.featuredImage?.altText || node.title,
      },
      category: node.collections?.nodes?.[0]?.title || "Merch",
      averageRating: 4.9,
      description: node.description || "",
      shortDescription: node.description?.substring(0, 150) || "",
      images: images.length > 0 ? images : [{ id: "feat", url: node.featuredImage?.url || "", alt: node.title }],
      options: node.options?.map((o: any) => ({ name: o.name, values: o.values })) || [],
      variants,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
  }

  // ── Collections / Categories ──
  static async getCategories(tenantId?: string | null): Promise<ProductCategory[]> {
    const client = this.getClient(tenantId);
    const query = `
      query GetCollections {
        collections(first: 20) {
          edges {
            node {
              id
              handle
              title
              description
              products(first: 1) {
                totalCount
              }
            }
          }
        }
      }
    `;

    const data = await client.query(query);
    return data.collections.edges.map(({ node }: any): ProductCategory => ({
      name: node.title,
      slug: node.handle,
      count: node.products?.totalCount ?? 0,
      description: node.description || "",
    }));
  }

  // ── Cart Operations (with checkoutUrl) ──
  private static mapShopifyCart(cart: any): AppCart {
    const items: CartItem[] = (cart.lines?.edges || []).map(({ node }: any) => {
      const merchandise = node.merchandise;
      const opts = (merchandise.selectedOptions || []).map((o: any) => ({
        name: o.name,
        value: o.value,
      }));

      const price = parseFloat(merchandise.price?.amount || "0");
      const lineTotal = parseFloat(node.cost?.totalAmount?.amount || (price * node.quantity).toString());

      return {
        key: node.id,
        productId: merchandise.product?.id?.replace(/^gid:\/\/shopify\/Product\//, "") || "",
        variantId: merchandise.id?.replace(/^gid:\/\/shopify\/ProductVariant\//, "") || "",
        name: merchandise.product?.title || merchandise.title || "Item",
        quantity: node.quantity,
        price,
        lineTotal,
        image: merchandise.image?.url || merchandise.product?.featuredImage?.url || "",
        options: opts,
      };
    });

    const subtotal = parseFloat(cart.cost?.subtotalAmount?.amount || "0");
    const total = parseFloat(cart.cost?.totalAmount?.amount || "0");
    const taxTotal = parseFloat(cart.cost?.totalTaxAmount?.amount || "0");
    const currencyCode = cart.cost?.totalAmount?.currencyCode || "USD";

    const totals: CartTotals = {
      subtotal,
      total,
      taxTotal,
      shippingTotal: 0,
      discountTotal: 0,
      currencyCode,
      currencySymbol: currencyCode === "USD" ? "$" : currencyCode,
    };

    return {
      cartToken: cart.id,
      checkoutUrl: cart.checkoutUrl, // ⚡ Shopify Native Checkout Bridge URL
      items,
      itemsCount: cart.totalQuantity || items.reduce((s, i) => s + i.quantity, 0),
      totals,
      coupons: (cart.discountCodes || []).map((d: any) => ({
        code: d.code,
        discountType: "shopify",
        discount: 0,
      })),
      needsShipping: true,
      needsPayment: true,
      isEmpty: items.length === 0,
    };
  }

  static async createCart(
    lines: Array<{ merchandiseId: string; quantity: number }>,
    tenantId?: string | null
  ): Promise<AppCart> {
    const client = this.getClient(tenantId);
    const mutation = `
      mutation CreateCart($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            totalQuantity
            cost {
              subtotalAmount { amount currencyCode }
              totalAmount { amount currencyCode }
              totalTaxAmount { amount currencyCode }
            }
            discountCodes {
              code
              applicable
            }
            lines(first: 50) {
              edges {
                node {
                  id
                  quantity
                  cost {
                    totalAmount { amount currencyCode }
                  }
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      price { amount currencyCode }
                      image { url }
                      selectedOptions { name value }
                      product {
                        id
                        title
                        featuredImage { url }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const formattedLines = lines.map((l) => ({
      merchandiseId: l.merchandiseId.startsWith("gid://shopify/ProductVariant/")
        ? l.merchandiseId
        : `gid://shopify/ProductVariant/${l.merchandiseId}`,
      quantity: l.quantity,
    }));

    const data = await client.query(mutation, { input: { lines: formattedLines } });
    return this.mapShopifyCart(data.cartCreate.cart);
  }
}
