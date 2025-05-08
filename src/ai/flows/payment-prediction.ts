'use server';
/**
 * @fileOverview Payment prediction AI agent.
 *
 * - paymentPrediction - A function that calculates the transaction prediction score for a client.
 * - PaymentPredictionInput - The input type for the paymentPrediction function.
 * - PaymentPredictionOutput - The return type for the paymentPrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PaymentPredictionInputSchema = z.object({
  clientId: z.string().describe('The ID of the client.'),
  paymentHistory: z.string().describe('The payment history of the client.'),
  transactionAmount: z.number().describe('The amount of the transaction.'),
  dueDate: z.string().describe('The due date of the payment.'),
  clientDetails: z.string().describe('Other relevant details about the client.'),
});
export type PaymentPredictionInput = z.infer<typeof PaymentPredictionInputSchema>;

const PaymentPredictionOutputSchema = z.object({
  predictionScore: z.number().describe('The prediction score for the transaction.'),
  riskFactors: z.string().describe('The risk factors associated with the transaction.'),
});
export type PaymentPredictionOutput = z.infer<typeof PaymentPredictionOutputSchema>;

export async function paymentPrediction(input: PaymentPredictionInput): Promise<PaymentPredictionOutput> {
  return paymentPredictionFlow(input);
}

const paymentPredictionPrompt = ai.definePrompt({
  name: 'paymentPredictionPrompt',
  input: {schema: PaymentPredictionInputSchema},
  output: {schema: PaymentPredictionOutputSchema},
  prompt: `You are an expert in predicting payment behavior. Analyze the following data to predict the likelihood of a client defaulting or delaying payments.

Client ID: {{{clientId}}}
Payment History: {{{paymentHistory}}}
Transaction Amount: {{{transactionAmount}}}
Due Date: {{{dueDate}}}
Client Details: {{{clientDetails}}}

Based on this information, provide a prediction score (0-100, where 0 is very unlikely to default and 100 is very likely to default) and list the key risk factors influencing your prediction.

Prediction Score: {{predictionScore}}
Risk Factors: {{riskFactors}}`,
});

const paymentPredictionFlow = ai.defineFlow(
  {
    name: 'paymentPredictionFlow',
    inputSchema: PaymentPredictionInputSchema,
    outputSchema: PaymentPredictionOutputSchema,
  },
  async input => {
    const {output} = await paymentPredictionPrompt(input);
    return output!;
  }
);
