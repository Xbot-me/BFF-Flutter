const API_LOGIN_ID = process.env.AUTHORIZENET_API_LOGIN_ID!;
const TRANSACTION_KEY = process.env.AUTHORIZENET_TRANSACTION_KEY!;
const API_URL = "https://apitest.authorize.net/xml/v1/request.api";

export const HOSTED_URL = "https://test.authorize.net/payment/payment";

export class AuthorizeNetService {
  static async getHostedPaymentToken(
    orderId: string,
    amount: number,
    billing: any
  ): Promise<string> {
    const payload = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: {
          name: API_LOGIN_ID,
          transactionKey: TRANSACTION_KEY,
        },
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amount.toFixed(2),
          order: {
            invoiceNumber: orderId,
            description: `Order ${orderId}`,
          },
          billTo: {
            firstName: billing?.firstName || "Guest",
            lastName:  billing?.lastName  || "User",
            address:   billing?.address   || "123 Main St",
            city:      billing?.city      || "Dhaka",
            state:     billing?.state     || "WA",
            zip:       billing?.zip       || "98004",
            country:   billing?.country   || "BD",
            phoneNumber: billing?.phoneNumber || "",
          },
        },
        hostedPaymentSettings: {
          setting: [
            {
            settingName: "hostedPaymentIFrameCommunicatorUrl",
            settingValue: JSON.stringify({
                url: "https://74e0-202-125-108-160.ngrok-free.app/api/payments/iframe-communicator"
            }),
            },
           {
            settingName: "hostedPaymentReturnOptions",
            settingValue: JSON.stringify({
                showReceipt: false,
                url: `https://mustafizur.dev/checkout/return?orderId=${orderId}&status=success`,
                urlText: "Back to App",
                cancelUrl: `https://mustafizur.dev/checkout/return?orderId=${orderId}&status=cancel`,
            }),
            },
            {
              settingName: "hostedPaymentButtonOptions",
              settingValue: JSON.stringify({ text: "Pay Now" }),
            },
            {
              settingName: "hostedPaymentStyleOptions",
              settingValue: JSON.stringify({ bgColor: "#0F0F0F" }),
            },
            {
              settingName: "hostedPaymentBillingAddressOptions",
              settingValue: JSON.stringify({ show: true, required: false }),
            },
          ],
        },
      },
    };

    console.log('[AuthNet] Requesting token for order:', orderId, 'amount:', amount);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('[AuthNet] Response resultCode:', data.messages?.resultCode);

    if (data.messages.resultCode !== "Ok") {
      console.error('[AuthNet] Error:', JSON.stringify(data.messages));
      throw new Error(data.messages.message[0].text);
    }

    if (!data.token) {
      throw new Error('Auth.net returned Ok but no token was present');
    }

    console.log('[AuthNet] Token received, length:', data.token.length);
    return data.token;
  }
}