import { AppOrder } from "../../models/order";
import { MOCK_ORDERS } from "./mock.orders";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// OrderTracking — module level, not inside the class
// ---------------------------------------------------------------------------

export interface OrderTracking {
  orderId:           string;
  status:            string;
  carrier:           string;
  trackingNumber:    string | null;
  trackingUrl:       string | null;
  estimatedDelivery: string | null;
  events: {
    description: string;
    location:    string;
    timestamp:   string;
  }[];
}

// ---------------------------------------------------------------------------
// MockOrderProvider
// ---------------------------------------------------------------------------

export class MockOrderProvider {

  static async getOrders(_userId: string): Promise<AppOrder[]> {
    await delay(600);
    return MOCK_ORDERS;
  }

  static async getOrderById(orderId: string): Promise<AppOrder> {
    await delay(400);
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    return order;
  }

  static async getOrderByKey(orderKey: string): Promise<AppOrder> {
    await delay(400);
    const order = MOCK_ORDERS.find((o) => o.orderKey === orderKey);
    if (!order) throw new Error(`Order with key ${orderKey} not found`);
    return order;
  }

  static async getTracking(orderId: string): Promise<OrderTracking> {
    await delay(400);

    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.status === "pending" || order.status === "processing") {
      return {
        orderId,
        status:            "processing",
        carrier:           "USPS",
        trackingNumber:    null,
        trackingUrl:       null,
        estimatedDelivery: null,
        events: [
          { description: "Order confirmed",        location: "Online",    timestamp: order.createdAt },
          { description: "Payment verified",       location: "Online",    timestamp: order.createdAt },
          { description: "Preparing for shipment", location: "Warehouse", timestamp: order.updatedAt },
        ],
      };
    }

    return {
      orderId,
      status:            "delivered",
      carrier:           "USPS",
      trackingNumber:    "9400111899223397444910",
      trackingUrl:       "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223397444910",
      estimatedDelivery: "2024-05-05T00:00:00Z",
      events: [
        { description: "Delivered",                 location: "Dhaka, BD",           timestamp: "2024-05-05T14:22:00Z" },
        { description: "Out for delivery",          location: "Dhaka, BD",           timestamp: "2024-05-05T08:00:00Z" },
        { description: "Arrived at post office",    location: "Dhaka, BD",           timestamp: "2024-05-04T18:30:00Z" },
        { description: "In transit",                location: "Dubai, UAE",           timestamp: "2024-05-03T10:00:00Z" },
        { description: "Departed facility",         location: "Los Angeles, CA, US", timestamp: "2024-05-02T06:00:00Z" },
        { description: "Accepted at USPS facility", location: "Los Angeles, CA, US", timestamp: "2024-05-01T16:00:00Z" },
      ],
    };
  }
}