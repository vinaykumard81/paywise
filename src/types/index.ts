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
  clientName: string;
  amount: number;
  description: string;
  status: 'pending_link' | 'link_sent' | 'paid' | 'failed' | 'expired';
  paymentLinkUrl?: string;
  createdAt: string; // ISO string for date
  dueDate: string; // ISO string for date
  communicationMethod: 'sms' | 'email' | 'both';
};

// For form inputs
export type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'transactions' | 'paymentHistory' | 'predictionScore' | 'riskFactors' | 'paymentSummary'>;
export type PaymentFormData = Omit<Payment, 'id' | 'createdAt' | 'status' | 'paymentLinkUrl' | 'clientName'>;
