/**
 * Represents the information needed to create a payment link.
 */
export interface PaymentLinkRequest {
  /**
   * The amount to be paid.
   */
  amount: number;
  /**
   * A description of the payment.
   */
  description: string;
  /**
   * The customer ID.
   */
  customerId: string;
}

/**
 * Represents a payment link.
 */
export interface PaymentLink {
  /**
   * The URL of the payment link.
   */
  url: string;
}

/**
 * Asynchronously creates a payment link.
 *
 * @param paymentLinkRequest The payment link request.
 * @returns A promise that resolves to a PaymentLink object.
 */
export async function createPaymentLink(paymentLinkRequest: PaymentLinkRequest): Promise<PaymentLink> {
  // TODO: Implement this by calling a Payment Gateway API.

  return {
    url: 'https://example.com/payment-link',
  };
}
