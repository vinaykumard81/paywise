
import type { Client, Payment, Transaction, ClientFormData } from '@/types';
import { paymentPrediction, PaymentPredictionInput } from '@/ai/flows/payment-prediction';
import { generatePaymentSummary, PaymentSummaryInput } from '@/ai/flows/payment-summary';

// In-memory data stores (reset on server restart)
export let serverClients: Client[] = [];
export let serverPayments: Payment[] = [];

export function formatPaymentHistoryForAI(transactions: Transaction[]): string {
  if (!transactions || transactions.length === 0) return "No payment history.";
  return transactions
    .map(t => `Date: ${new Date(t.date).toLocaleDateString()}, Amount: ${t.amount}, Status: ${t.status}, Desc: ${t.description}`)
    .join('\n');
};

export async function refreshClientAIInsights(client: Client): Promise<Partial<Client>> {
  if (!client) throw new Error("Client not found for AI refresh.");

  try {
    const predictionInput: PaymentPredictionInput = {
      clientId: client.id,
      paymentHistory: client.paymentHistory,
      transactionAmount: client.transactions.reduce((sum, t) => sum + (t.status === 'pending' || t.status === 'overdue' ? t.amount : 0), 0) || 100,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      clientDetails: `Client since ${new Date(client.createdAt).toLocaleDateString()}. Email: ${client.email}, Phone: ${client.phone}`,
    };
    const predictionResult = await paymentPrediction(predictionInput);

    const summaryInput: PaymentSummaryInput = {
      clientId: client.id,
      paymentHistory: client.paymentHistory,
    };
    const summaryResult = await generatePaymentSummary(summaryInput);

    return {
      predictionScore: predictionResult.predictionScore,
      riskFactors: predictionResult.riskFactors,
      paymentSummary: summaryResult.summary,
    };
  } catch (error) {
    console.error(`Error refreshing AI insights for client ${client.id}:`, error);
    // Depending on desired error handling, you might want to throw or return a specific error state
    throw new Error(`Failed to refresh AI insights: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function findClientById(clientId: string): Client | undefined {
  return serverClients.find(c => c.id === clientId);
}

export function addClientToServer(clientData: ClientFormData): Client {
  const newClient: Client = {
    ...clientData,
    id: `client_${Date.now().toString()}`,
    createdAt: new Date().toISOString(),
    transactions: [],
    paymentHistory: "New client, no payment history yet.",
    // AI fields will be populated by refreshClientAIInsights
  };
  serverClients.push(newClient);
  return newClient;
}

export function updateClientOnServer(clientId: string, updates: Partial<ClientFormData>): Client | null {
  const clientIndex = serverClients.findIndex(c => c.id === clientId);
  if (clientIndex === -1) return null;

  serverClients[clientIndex] = { ...serverClients[clientIndex], ...updates };
  return serverClients[clientIndex];
}

export function deleteClientFromServer(clientId: string): boolean {
  const initialLength = serverClients.length;
  serverClients = serverClients.filter(c => c.id !== clientId);
  return serverClients.length < initialLength;
}

export function findPaymentById(paymentId: string): Payment | undefined {
  return serverPayments.find(p => p.id === paymentId);
}
