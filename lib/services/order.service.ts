import { AppOrder } from "../models/order";
import { MockOrderProvider, OrderTracking } from "../providers/mock/mock.order.provider";

type P = "MOCK" | "WOO" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class OrderService {

  static async getOrders(userId: string): Promise<AppOrder[]> {
    console.log(`[OrderService] getOrders via ${getProvider()}`);
    switch (getProvider()) {
      case "WOO": {
        const { WooOrderProvider } = await import("../providers/woocommerce/woo.order.provider");
        return WooOrderProvider.getOrders(userId);
      }
      default:
        return MockOrderProvider.getOrders(userId);
    }
  }

  static async getOrderById(orderId: string): Promise<AppOrder> {
    console.log(`[OrderService] getOrderById via ${getProvider()}`);
    switch (getProvider()) {
      case "WOO": {
        const { WooOrderProvider } = await import("../providers/woocommerce/woo.order.provider");
        return WooOrderProvider.getOrderById(orderId);
      }
      default:
        return MockOrderProvider.getOrderById(orderId);
    }
  }

  static async getOrderByKey(orderKey: string): Promise<AppOrder> {
    switch (getProvider()) {
      case "WOO": {
        const { WooOrderProvider } = await import("../providers/woocommerce/woo.order.provider");
        return WooOrderProvider.getOrderByKey(orderKey);
      }
      default:
        return MockOrderProvider.getOrderByKey(orderKey);
    }
  }

  // FIX: static method — OrderService is never instantiated with `new`
  static async getTracking(orderId: string): Promise<OrderTracking> {
    console.log(`[OrderService] getTracking via ${getProvider()}`);
    switch (getProvider()) {
      case "WOO": {
        const { WooOrderProvider } = await import("../providers/woocommerce/woo.order.provider");
        return WooOrderProvider.getTracking(orderId);
      }
      default:
        return MockOrderProvider.getTracking(orderId);
    }
  }
}