
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
    
    console.log('[API /api/payments POST] Received payload:', JSON.stringify(payload));
    console.log('[API /api/payments POST] Current serverClients count:', serverClients.length);
    console.log('[API /api/payments POST] Searching for clientId:', payload.clientId);

    const client = findClientById(payload.clientId);

    if (!client) {
      console.error('[API /api/payments POST] Client not found for ID:', payload.clientId);
      console.log('[API /api/payments POST] Available client IDs:', serverClients.map(c => c.id));
      return NextResponse.json({ success: false, error: 'Client not found. Please ensure the client exists and is selected correctly.' }, { status: 404 });
    }
    
    console.log('[API /api/payments POST] Found client:', client.name);

    const paymentLinkRequest: PaymentLinkRequest = {
      amount: payload.amount,
      description: payload.description,
      customerId: payload.clientId, 
    };

    const paymentLinkResponse = await createPaymentLink(paymentLinkRequest);

    const newPayment: Payment = {
      ...payload,
      id: `payment_${Date.now().toString()}`,
      clientName: client.name,
      createdAt: new Date().toISOString(),
      status: 'link_sent', 
      paymentLinkUrl: paymentLinkResponse.url,
    };
    serverPayments.push(newPayment);

    const message = `Dear ${client.name}, please complete your payment of ₹${newPayment.amount} for "${newPayment.description}" using this link: ${newPayment.paymentLinkUrl} Due: ${new Date(newPayment.dueDate).toLocaleDateString()}`;
    
    let smsSent = false;
    let emailSent = false;

    if (payload.communicationMethod === 'sms' || payload.communicationMethod === 'both') {
      try {
        await sendSMS(client.phone, message);
        smsSent = true;
      } catch (smsError) {
        console.error(`[API /api/payments POST] Failed to send SMS to ${client.phone}:`, smsError);
      }
    }
    if (payload.communicationMethod === 'email' || payload.communicationMethod === 'both') {
      try {
        await sendEmail({ 
          to: client.email, 
          subject: `Payment Request: ${newPayment.description}`, 
          body: `<p>${message}</p><p>If you have any questions, please contact us.</p>`,
          fromName: "PayWise Team"
        });
        emailSent = true;
      } catch (emailError) {
         console.error(`[API /api/payments POST] Failed to send Email to ${client.email}:`, emailError);
      }
    }
    
    let notificationMessage = `Payment link created for ${client.name}.`;
    if (payload.communicationMethod === 'both') {
        notificationMessage += ` ${smsSent ? 'SMS sent.' : 'SMS failed.'} ${emailSent ? 'Email sent.' : 'Email failed.'}`;
    } else if (payload.communicationMethod === 'sms') {
        notificationMessage += ` ${smsSent ? 'SMS sent.' : 'SMS failed.'}`;
    } else if (payload.communicationMethod === 'email') {
        notificationMessage += ` ${emailSent ? 'Email sent.' : 'Email failed.'}`;
    }


    return NextResponse.json({ success: true, data: newPayment, message: notificationMessage }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[API /api/payments POST] Error in payment request:", error);
    return NextResponse.json({ success: false, error: `Failed to create payment request: ${errorMessage}` }, { status: 500 });
  }
}

