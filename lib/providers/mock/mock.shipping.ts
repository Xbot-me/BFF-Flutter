import { ShippingRate } from "../../models/shipping";

export const MOCK_USPS_RATES: ShippingRate[] = [
  {
    id: "usps_ground_advantage",
    title: "USPS Ground Advantage™",
    price: 5.95,
    currency: "USD",
    estimatedDays: "2-5 business days",
    provider: "USPS"
  },
  {
    id: "usps_priority_mail",
    title: "USPS Priority Mail®",
    price: 10.20,
    currency: "USD",
    estimatedDays: "1-3 business days",
    provider: "USPS"
  },
  {
    id: "usps_priority_mail_express",
    title: "USPS Priority Mail Express®",
    price: 28.75,
    currency: "USD",
    estimatedDays: "Next-Day to 2-Day",
    provider: "USPS"
  }
];