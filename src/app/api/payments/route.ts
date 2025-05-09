
import { NextResponse, type NextRequest } from 'next/server';
import type { Payment, CreatePaymentPayload } from '@/types';
import { serverPayments, findClientById, serverClients } from '@/lib/api-utils';
import { createPaymentLink, PaymentLinkRequest } from '@/services/payment-gateway';
import { sendSMS } from '@/services/sms';
import { sendEmail } from '@/services/email';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: serverPayments });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Failed to fetch payments: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as CreatePaymentPayload;
    const client = findClientById(payload.clientId);

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const paymentLinkRequest: PaymentLinkRequest = {
      amount: payload.amount,
      description: payload.description,
      customerId: payload.clientId, // In a real scenario, this might be a gateway-specific customer ID
    };

    const paymentLinkResponse = await createPaymentLink(paymentLinkRequest);

    const newPayment: Payment = {
      ...payload,
      id: `payment_${Date.now().toString()}`,
      clientName: client.name,
      createdAt: new Date().toISOString(),
      status: 'link_sent', // Initial status after link generation
      paymentLinkUrl: paymentLinkResponse.url,
    };
    serverPayments.push(newPayment);

    const message = `Dear ${client.name}, please complete your payment of ₹${newPayment.amount} for "${newPayment.description}" using this link: ${newPayment.paymentLinkUrl}`;
    
    // Send notifications (these will use actual services if API keys are in .env)
    if (payload.communicationMethod === 'sms' || payload.communicationMethod === 'both') {
      await sendSMS(client.phone, message);
    }
    if (payload.communicationMethod === 'email' || payload.communicationMethod === 'both') {
      await sendEmail({ to: client.email, subject: `Payment Request: ${newPayment.description}`, body: `<p>${message}</p>` });
    }

    return NextResponse.json({ success: true, data: newPayment }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in POST /api/payments:", error);
    return NextResponse.json({ success: false, error: `Failed to create payment request: ${errorMessage}` }, { status: 500 });
  }
}
