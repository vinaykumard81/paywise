'use server';
/**
 * @fileOverview Generates a summary of a client's payment history, highlighting trends and potential issues.
 *
 * - generatePaymentSummary - A function that generates the payment summary.
 * - PaymentSummaryInput - The input type for the generatePaymentSummary function.
 * - PaymentSummaryOutput - The return type for the generatePaymentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PaymentSummaryInputSchema = z.object({
  clientId: z.string().describe('The ID of the client.'),
  paymentHistory: z
    .string()
    .describe(
      'A string containing the payment history of the client. Should include dates, amounts, and status of payments.'
    ),
});
export type PaymentSummaryInput = z.infer<typeof PaymentSummaryInputSchema>;

const PaymentSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the client payment history, highlighting trends and potential issues.'),
});
export type PaymentSummaryOutput = z.infer<typeof PaymentSummaryOutputSchema>;

export async function generatePaymentSummary(input: PaymentSummaryInput): Promise<PaymentSummaryOutput> {
  return paymentSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'paymentSummaryPrompt',
  input: {schema: PaymentSummaryInputSchema},
  output: {schema: PaymentSummaryOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing payment history for clients.

  Given the following payment history, generate a concise summary highlighting key trends,
  payment behavior, and any potential issues or anomalies.

  Payment History:
  {{paymentHistory}}
  `,
});

const paymentSummaryFlow = ai.defineFlow(
  {
    name: 'paymentSummaryFlow',
    inputSchema: PaymentSummaryInputSchema,
    outputSchema: PaymentSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
