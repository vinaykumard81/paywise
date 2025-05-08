
"use client";

import type { Client, Payment, Transaction, ClientFormData, PaymentFormData } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { paymentPrediction, PaymentPredictionInput } from '@/ai/flows/payment-prediction';
import { generatePaymentSummary, PaymentSummaryInput } from '@/ai/flows/payment-summary';
import { createPaymentLink, PaymentLinkRequest } from '@/services/payment-gateway';
import { sendSMS } from '@/services/sms';
import { sendEmail } from '@/services/email';
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  clients: Client[];
  addClient: (clientData: ClientFormData) => Promise<void>;
  updateClient: (updatedClient: Client) => Promise<void>;
  deleteClient: (clientId: string) => void;
  getClientById: (clientId: string) => Client | undefined;
  payments: Payment[];
  requestPayment: (paymentData: PaymentFormData) => Promise<void>;
  updatePaymentStatus: (paymentId: string, status: Payment['status']) => Promise<void>;
  getPaymentsByClientId: (clientId: string) => Payment[];
  user: { name: string; email: string } | null;
  login: (credentials: { email: string; }) => void;
  signup: (details: { name: string; email: string; }) => void;
  logout: () => void;
  isLoadingAI: boolean;
  refreshClientAIInfo: (clientId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  // Mock login
  useEffect(() => {
    // Auto-login a mock user for development
    setUser({ name: "Demo User", email: "demo@example.com" });
  }, []);

  const formatPaymentHistoryForAI = (transactions: Transaction[]): string => {
    if (!transactions || transactions.length === 0) return "No payment history.";
    return transactions
      .map(t => `Date: ${new Date(t.date).toLocaleDateString()}, Amount: ${t.amount}, Status: ${t.status}, Desc: ${t.description}`)
      .join('\n');
  };

  const refreshClientAIInfo = useCallback(async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    setIsLoadingAI(true);
    try {
      const predictionInput: PaymentPredictionInput = {
        clientId: client.id,
        paymentHistory: client.paymentHistory,
        transactionAmount: client.transactions.reduce((sum, t) => sum + (t.status === 'pending' || t.status === 'overdue' ? t.amount : 0), 0) || 100, // Example: current due amount or a typical transaction amount
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Example: next month
        clientDetails: `Client since ${new Date(client.createdAt).toLocaleDateString()}. Email: ${client.email}, Phone: ${client.phone}`,
      };
      const predictionResult = await paymentPrediction(predictionInput);

      const summaryInput: PaymentSummaryInput = {
        clientId: client.id,
        paymentHistory: client.paymentHistory,
      };
      const summaryResult = await generatePaymentSummary(summaryInput);

      setClients(prevClients =>
        prevClients.map(c =>
          c.id === clientId
            ? {
                ...c,
                predictionScore: predictionResult.predictionScore,
                riskFactors: predictionResult.riskFactors,
                paymentSummary: summaryResult.summary,
              }
            : c
        )
      );
      toast({ title: "AI Insights Updated", description: `Successfully updated AI insights for ${client.name}.` });
    } catch (error) {
      console.error("Error updating AI info:", error);
      toast({ title: "AI Update Failed", description: "Could not update AI insights.", variant: "destructive" });
    } finally {
      setIsLoadingAI(false);
    }
  }, [clients, toast]);


  const addClient = async (clientData: ClientFormData) => {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(), // Simple ID generation
      createdAt: new Date().toISOString(),
      transactions: [],
      paymentHistory: "New client, no payment history yet.",
    };
    setClients(prev => [...prev, newClient]);
    toast({ title: "Client Added", description: `${newClient.name} has been added.` });
    await refreshClientAIInfo(newClient.id);
  };

  const updateClient = async (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    toast({ title: "Client Updated", description: `${updatedClient.name}'s details have been updated.` });
    await refreshClientAIInfo(updatedClient.id);
  };
  
  const deleteClient = (clientId: string) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    toast({ title: "Client Deleted", description: `Client has been removed.` });
  };

  const getClientById = (clientId: string) => clients.find(c => c.id === clientId);
  
  const getPaymentsByClientId = (clientId: string) => payments.filter(p => p.clientId === clientId);

  const requestPayment = async (paymentData: PaymentFormData) => {
    const client = clients.find(c => c.id === paymentData.clientId);
    if (!client) {
      toast({ title: "Payment Request Failed", description: "Client not found.", variant: "destructive" });
      return;
    }

    const paymentLinkRequest: PaymentLinkRequest = {
      amount: paymentData.amount,
      description: paymentData.description,
      customerId: paymentData.clientId,
    };

    try {
      const paymentLink = await createPaymentLink(paymentLinkRequest);
      const newPayment: Payment = {
        ...paymentData,
        id: Date.now().toString(),
        clientName: client.name,
        createdAt: new Date().toISOString(),
        status: 'link_sent',
        paymentLinkUrl: paymentLink.url,
      };
      setPayments(prev => [...prev, newPayment]);
      
      const message = `Dear ${client.name}, please complete your payment of $${newPayment.amount} for "${newPayment.description}" using this link: ${newPayment.paymentLinkUrl}`;
      
      if (newPayment.communicationMethod === 'sms' || newPayment.communicationMethod === 'both') {
        await sendSMS(client.phone, message);
      }
      if (newPayment.communicationMethod === 'email' || newPayment.communicationMethod === 'both') {
        await sendEmail({ to: client.email, subject: `Payment Request: ${newPayment.description}`, body: `<p>${message}</p>` });
      }
      
      toast({ title: "Payment Link Sent", description: `Link sent to ${client.name} for $${newPayment.amount}.` });

    } catch (error) {
      console.error("Error creating payment link or sending notification:", error);
      toast({ title: "Payment Request Failed", description: "Could not process payment request.", variant: "destructive" });
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: Payment['status']) => {
    let affectedClientId: string | null = null;
    setPayments(prevPayments =>
      prevPayments.map(p => {
        if (p.id === paymentId) {
          affectedClientId = p.clientId;
          return { ...p, status };
        }
        return p;
      })
    );

    if (affectedClientId && (status === 'paid' || status === 'failed')) {
      // Add a transaction to the client
      const payment = payments.find(p => p.id === paymentId);
      if (payment) {
        const newTransaction: Transaction = {
          id: `txn-${Date.now()}`,
          amount: payment.amount,
          date: new Date().toISOString(),
          status: status === 'paid' ? 'paid' : 'failed',
          description: `Payment for: ${payment.description}`,
        };
        
        setClients(prevClients => prevClients.map(c => {
          if (c.id === payment.clientId) {
            const updatedTransactions = [...c.transactions, newTransaction];
            return {
              ...c,
              transactions: updatedTransactions,
              paymentHistory: formatPaymentHistoryForAI(updatedTransactions),
            };
          }
          return c;
        }));
        await refreshClientAIInfo(payment.clientId);
      }
    }
    toast({ title: "Payment Status Updated", description: `Status for payment ID ${paymentId} changed to ${status}.` });
  };

  // Mock auth functions
  const login = (credentials: { email: string; }) => {
    setUser({ name: "Mock User", email: credentials.email }); // Simple mock
    toast({ title: "Logged In", description: "Welcome back!"});
  };
  const signup = (details: { name: string; email: string; }) => {
    setUser(details);
    toast({ title: "Signed Up", description: `Welcome, ${details.name}!`});
  };
  const logout = () => {
    setUser(null);
    toast({ title: "Logged Out" });
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        addClient,
        updateClient,
        deleteClient,
        getClientById,
        payments,
        requestPayment,
        updatePaymentStatus,
        getPaymentsByClientId,
        user,
        login,
        signup,
        logout,
        isLoadingAI,
        refreshClientAIInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
