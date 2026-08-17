import { z } from "zod";

/**
 * UserAddressSchema — camelCase fields, matches AppUser.addresses[] shape.
 *
 * Intentionally different from checkout.schema.ts AddressSchema which uses
 * snake_case to match WooCommerce Store API field names directly.
 *
 * When mapping a saved user address to a checkout payload, use
 * mapUserAddressToCheckout() in utils/address.mapper.ts.
 */
export const UserAddressSchema = z.object({
  id:               z.string().or(z.number()).transform(v => v.toString()),
  firstName:        z.string().optional().default(""),
  lastName:         z.string().optional().default(""),
  company:          z.string().optional().default(""),
  address1:         z.string().min(1, "Address is required"),
  address2:         z.string().optional().default(""),
  city:             z.string().min(1, "City is required"),
  state:            z.string().optional().default(""),  // optional here — enforced at checkout layer
  postcode:         z.string().min(1, "Postcode is required"),
  country:          z.string().min(2, "Country code is required"),
  phone:            z.string().optional().default(""),
  isDefaultShipping: z.boolean().default(false),
  isDefaultBilling:  z.boolean().default(false),
});

export const UserSchema = z.object({
  id:                      z.string().or(z.number()).transform(v => v.toString()),
  email:                   z.string().email(),
  firstName:               z.string().optional().default(""),
  lastName:                z.string().optional().default(""),
  displayName:             z.string().optional().default(""),
  avatarUrl:               z.string().url().optional(),
  phone:                   z.string().optional().default(""),
  rewardPoints:            z.number().default(0),
  addresses:               z.array(UserAddressSchema).default([]),
  defaultShippingAddressId: z.string().optional(),
  defaultBillingAddressId:  z.string().optional(),
  isGuest:                 z.boolean().default(false),
  isVerified:              z.boolean().default(false),
  createdAt:               z.string().optional(),
  updatedAt:               z.string().optional(),
});

export type UserAddress = z.infer<typeof UserAddressSchema>;
export type AppUserFromSchema = z.infer<typeof UserSchema>;