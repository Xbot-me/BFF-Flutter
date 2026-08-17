import { email, z } from "zod";
import { UserAddressSchema } from "./user.schema";
import { mapUserAddressToBilling,mapUserAddressToShipping } from "../utils/address.mapper";

// ---------------------------------------------------------------------------
// Address schemas — billing and shipping are intentionally separate types.
// Woo does NOT expect `email` inside shipping_address.
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name:  z.string().min(1, "Last name is required"),
  address_1:  z.string().min(1, "Address line 1 is required"),
  address_2:  z.string().optional().default(""),
  city:       z.string().min(1, "City is required"),
  state:      z.string().min(1, "State is required"), // required — empty string causes silent Woo failures for US/CA/AU
  postcode:   z.string().min(1, "Postcode is required"),
  country:    z.string().length(2, "Country must be a 2-letter ISO code"),
  phone:      z.string().optional().default(""),
});

export const BillingAddressSchema = AddressSchema.extend({
  email: z.string().email("Valid billing email is required"),
});

// ---------------------------------------------------------------------------
// Payment data — flexible passthrough, keys determined by gateway plugin
// ---------------------------------------------------------------------------

export const PaymentDataItemSchema = z.object({
  key:   z.string().min(1),
  value: z.string(),
});

// ---------------------------------------------------------------------------
// Checkout request
// ---------------------------------------------------------------------------

export const CheckoutRequestSchema = z.object({
  cartToken:       z.string().min(1, "cartToken is required"),
  nonce:           z.string().min(1, "nonce is required"),
  billingAddress:  UserAddressSchema.omit({id:true}).extend({
    email: z.string().email("Valid billing email is required")
  }),
  shippingAddress: UserAddressSchema.omit({id: true}),
  paymentMethod:   z.string().min(1, "paymentMethod is required"), // no default — forces Flutter to be explicit
  paymentData:     z.array(PaymentDataItemSchema).default([]),
  shippingMethod:  z.array(z.string()).optional(),                  // e.g. ["flat_rate:1"] — optional now, likely required later
  customerNote:    z.string().optional().default(""),
})
  // Cross-field refinement: state is required for US, CA, AU addresses
  .transform((data) => ({
    ...data,
    billingAddress: mapUserAddressToBilling(data.billingAddress, data.billingAddress.email),
    shippingAddress: mapUserAddressToShipping(data.shippingAddress),
  }))
  .refine(
    (data) => {
      const countriesRequiringState = ["US", "CA", "AU"];
      if (countriesRequiringState.includes(data.billingAddress.country)) {
        return data.billingAddress.state.length > 0;
      }
      return true;
    },
    { message: "State is required for US, CA, and AU billing addresses", path: ["billingAddress", "state"] }
  )
  .refine(
    (data) => {
      const countriesRequiringState = ["US", "CA", "AU"];
      if (countriesRequiringState.includes(data.shippingAddress.country)) {
        return data.shippingAddress.state.length > 0;
      }
      return true;
    },
    { message: "State is required for US, CA, and AU shipping addresses", path: ["shippingAddress", "state"] }
  );

// ---------------------------------------------------------------------------
// Woo error shape — structured so Flutter can handle each case cleanly
// ---------------------------------------------------------------------------

export const WooErrorSchema = z.object({
  code:    z.string().optional(),
  message: z.string().optional(),
  data:    z.any().optional(),
});

// ---------------------------------------------------------------------------
// Checkout response — typed error categories so Flutter switches cleanly
// ---------------------------------------------------------------------------

export const CheckoutResponseSchema = z.object({
  success:  z.boolean(),
  orderId:  z.string().optional(),
  orderKey: z.string().optional(),
  message:  z.string().optional(),
  type: z.enum([
    "success",
    "payment_error",
    "validation_error",
    "server_error",
    "network_error",
  ]).optional(),
  
  details: z.any().optional(),
});

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------
export type CheckoutRequestInput  = z.input<typeof CheckoutRequestSchema>;

export type CheckoutRequest  = z.infer<typeof CheckoutRequestSchema>;
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;
export type BillingAddress   = z.infer<typeof BillingAddressSchema>;
export type ShippingAddress  = z.infer<typeof AddressSchema>;
export type PaymentDataItem  = z.infer<typeof PaymentDataItemSchema>;
export type WooError         = z.infer<typeof WooErrorSchema>;