
export type Transaction = {
  id: string;
  amount: number;
  date: string; // ISO string for date
  status: 'pending' | 'paid' | 'failed' | 'overdue';
  description: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentHistory: string; // Formatted string for AI
  transactions: Transaction[];
  predictionScore?: number;
  riskFactors?: string;
  paymentSummary?: string;
  createdAt: string; // ISO string for date
};

export type Payment = {
  id: string;
  clientId: string;
  clientName: string; // Denormalized for easier display
  amount: number;
  description: string;
  status: 'pending_link' | 'link_sent' | 'paid' | 'failed' | 'expired';
  paymentLinkUrl?: string;
  createdAt: string; // ISO string for date
  dueDate: string; // ISO string for date
  communicationMethod: 'sms' | 'email' | 'both';
};

// For form inputs on the client-side
export type ClientFormData = Pick<Client, 'name' | 'email' | 'phone'>;
export type PaymentFormData = Pick<Payment, 'clientId' | 'amount' | 'description' | 'dueDate' | 'communicationMethod'>;

// For API request payloads (might be slightly different from forms)
export type CreateClientPayload = ClientFormData;
export type UpdateClientPayload = Partial<ClientFormData>;

export type CreatePaymentPayload = PaymentFormData;
export type UpdatePaymentStatusPayload = { status: Payment['status'] };

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
