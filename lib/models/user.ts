/**
 * INDUSTRY STANDARD: Platform-Agnostic User Contract
 * Maps cleanly to WooCommerce Customers and Shopify Customers.
 */

export interface Address {
  id: string; // Internal BFF ID or platform ID
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string; // State/Province/Division
  postcode: string;
  country: string;
  phone?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface AppUser {
  id: string; // The canonical ID (String for Shopify GID compatibility)
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  
  // BFF-level business logic (Points/Loyalty)
  rewardPoints?: number;
  
  // Multi-address support (Standard for modern eCommerce)
  addresses?: Address[];
  defaultShippingAddressId?: string;
  defaultBillingAddressId?: string;

  isGuest?: boolean;
  isVerified?: boolean;
  
  createdAt?: string;
  updatedAt?: string;
}