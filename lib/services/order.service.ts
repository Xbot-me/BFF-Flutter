import { AppOrder } from "../models/order";
import { MockOrderProvider, OrderTracking } from "../providers/mock/mock.order.provider";

type P = "MOCK" | "SHOPIFY";
const getProvider = (): P => (process.env.NEXT_PUBLIC_API_SOURCE ?? "MOCK") as P;

export class OrderService {

  static async getOrders(userId: string): Promise<AppOrder[]> {
    console.log(`[OrderService] getOrders via ${getProvider()}`);
    switch (getProvider()) {
      default:
        return MockOrderProvider.getOrders(userId);
    }
  }

  static async getOrderById(orderId: string): Promise<AppOrder> {
    console.log(`[OrderService] getOrderById via ${getProvider()}`);
    switch (getProvider()) {
      default:
        return MockOrderProvider.getOrderById(orderId);
    }
  }

  static async getOrderByKey(orderKey: string): Promise<AppOrder> {
    switch (getProvider()) {
      default:
        return MockOrderProvider.getOrderByKey(orderKey);
    }
  }

  // FIX: static method — OrderService is never instantiated with `new`
  static async getTracking(orderId: string): Promise<OrderTracking> {
    console.log(`[OrderService] getTracking via ${getProvider()}`);
    switch (getProvider()) {
      default:
        return MockOrderProvider.getTracking(orderId);
    }
  }
}