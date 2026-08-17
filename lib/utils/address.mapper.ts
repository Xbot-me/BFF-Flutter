import type { Address } from "../models/user";
import type { BillingAddress, ShippingAddress } from "../validations/checkout.schema";

// ---------------------------------------------------------------------------
// Maps a saved UserAddress (camelCase, from AppUser.addresses[])
// to the checkout BillingAddress shape (snake_case, WooCommerce Store API).
//
// email is on AppUser, not Address — pass it separately.
//
// State fallback: for countries without states (BD, SG, HK etc.) we use city
// as the state value. The checkout schema requires state to be non-empty, but
// the cross-field .refine() only enforces it for US/CA/AU — safe elsewhere.
// ---------------------------------------------------------------------------

export function mapUserAddressToBilling(
  address: Address,
  email:   string,
): BillingAddress {
  return {
    first_name: address.firstName ?? "",
    last_name:  address.lastName  ?? "",
    address_1:  address.address1,
    address_2:  address.address2  ?? "",
    city:       address.city,
    state:      address.state     || address.city,
    postcode:   address.postcode,
    country:    address.country,
    phone:      address.phone     ?? "",
    email,
  };
}

export function mapUserAddressToShipping(address: Address): ShippingAddress {
  return {
    first_name: address.firstName ?? "",
    last_name:  address.lastName  ?? "",
    address_1:  address.address1,
    address_2:  address.address2  ?? "",
    city:       address.city,
    state:      address.state     || address.city,
    postcode:   address.postcode,
    country:    address.country,
    phone:      address.phone     ?? "",
  };
}

// ---------------------------------------------------------------------------
// Finds and maps the default billing + shipping addresses from AppUser
// in one call — used by the checkout pre-fill flow
// ---------------------------------------------------------------------------

export function getDefaultCheckoutAddresses(
  user: { email: string; addresses?: Address[]; defaultBillingAddressId?: string; defaultShippingAddressId?: string },
): { billing: BillingAddress | null; shipping: ShippingAddress | null } {
  const addresses = user.addresses ?? [];

  const billingAddr = addresses.find(
    (a) => a.id === user.defaultBillingAddressId || a.isDefaultBilling
  ) ?? addresses[0];

  const shippingAddr = addresses.find(
    (a) => a.id === user.defaultShippingAddressId || a.isDefaultShipping
  ) ?? addresses[0];

  return {
    billing:  billingAddr  ? mapUserAddressToBilling(billingAddr, user.email)  : null,
    shipping: shippingAddr ? mapUserAddressToShipping(shippingAddr)             : null,
  };
}