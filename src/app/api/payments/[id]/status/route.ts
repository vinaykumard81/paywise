
import { NextResponse, type NextRequest } from 'next/server';
import type { UpdatePaymentStatusPayload, Transaction } from '@/types';
import { serverPayments, serverClients, findPaymentById, formatPaymentHistoryForAI, refreshClientAIInsights } from '@/lib/api-utils';

interface Params { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { status } = await request.json() as UpdatePaymentStatusPayload;
    if (!status) {
      return NextResponse.json({ success: false, error: 'Missing status in payload' }, { status: 400 });
    }

    const paymentIndex = serverPayments.findIndex(p => p.id === params.id);
    if (paymentIndex === -1) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
    }

    const payment = serverPayments[paymentIndex];
    payment.status = status;
    serverPayments[paymentIndex] = payment;

    // If payment is 'paid' or 'failed', add a transaction to the client and refresh AI
    if (status === 'paid' || status === 'failed') {
      const clientIndex = serverClients.findIndex(c => c.id === payment.clientId);
      if (clientIndex !== -1) {
        const client = serverClients[clientIndex];
        const newTransaction: Transaction = {
          id: `txn_${Date.now()}`,
          amount: payment.amount,
          date: new Date().toISOString(),
          status: status, // 'paid' or 'failed'
          description: `Payment for request: ${payment.description}`,
        };
        client.transactions.push(newTransaction);
        client.paymentHistory = formatPaymentHistoryForAI(client.transactions);
        
        // Refresh AI insights for the client
        try {
            const aiData = await refreshClientAIInsights(client);
            serverClients[clientIndex] = { ...client, ...aiData };
        } catch (aiError) {
            console.warn(`AI insights update failed for client ${client.id} after payment status update: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
        }
      }
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error in PUT /api/payments/${params.id}/status:`, error);
    return NextResponse.json({ success: false, error: `Failed to update payment status: ${errorMessage}` }, { status: 500 });
  }
}
