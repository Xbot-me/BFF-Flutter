import { AppUser } from "../../models/user";

export const MOCK_USER: AppUser = {
  id: "user_99",
  email: "mustafizur@dev.com",
  firstName: "Mustafizur",
  lastName: "Rahman",
  displayName: "Mustafizur Dev",
  phone: "+8801700000000",
  rewardPoints: 450,
  isGuest: false,
  isVerified: true,
  createdAt: "2024-01-15T10:00:00Z",
  addresses: [
    {
      id: "addr_1",
      firstName: "Mustafizur",
      lastName: "Rahman",
      address1: "House 12, Road 5",
      address2: "Banani",
      city: "Dhaka",
      postcode: "1213",
      country: "BD",
      phone: "+8801700000000",
      isDefaultShipping: true,
      isDefaultBilling: true
    }
  ],
  defaultShippingAddressId: "addr_1",
  defaultBillingAddressId: "addr_1"
};