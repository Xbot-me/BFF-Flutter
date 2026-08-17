// Standard in-memory store for dev/testing
const mockOrders = new Map<string, { status: string; amount: number }>();

export class MockStoreService {
  static createOrder(amount: number): string {
    const orderId = `MOCK-${Date.now()}`;
    mockOrders.set(orderId, { status: "pending", amount });
    return orderId;
  }

  static updateStatus(orderId: string, status: "processing" | "failed"): void {
    const order = mockOrders.get(orderId);
    if (order) {
      mockOrders.set(orderId, { ...order, status });
    }
  }

  static getStatus(orderId: string): string {
    return mockOrders.get(orderId)?.status ?? "not_found";
  }
}