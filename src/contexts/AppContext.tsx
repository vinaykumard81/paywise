
"use client";

import type { Client, Payment, ClientFormData, PaymentFormData, ApiResponse } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  clients: Client[];
  addClient: (clientData: ClientFormData) => Promise<void>;
  updateClient: (clientId: string, updatedData: Partial<ClientFormData>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined; // Will now find from local cache
  payments: Payment[];
  requestPayment: (paymentData: PaymentFormData) => Promise<void>;
  updatePaymentStatus: (paymentId: string, status: Payment['status']) => Promise<void>;
  getPaymentsByClientId: (clientId: string) => Payment[]; // Will now find from local cache
  user: { name: string; email: string } | null;
  login: (credentials: { email: string; }) => void;
  signup: (details: { name: string; email: string; }) => void;
  logout: () => void;
  isLoading: boolean; // Generic loading for API calls
  isLoadingAI: boolean; // Specific for AI refresh operations
  refreshClientAIInfo: (clientId: string) => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchPayments: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial data load and general ops
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clients');
      const result: ApiResponse<Client[]> = await response.json();
      if (result.success && result.data) {
        setClients(result.data);
      } else {
        toast({ title: "Error", description: result.error || "Failed to fetch clients.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch clients.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments');
      const result: ApiResponse<Payment[]> = await response.json();
      if (result.success && result.data) {
        setPayments(result.data);
      } else {
        toast({ title: "Error", description: result.error || "Failed to fetch payments.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch payments.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    setUser({ name: "Demo User", email: "demo@example.com" }); // Mock login
    fetchClients();
    fetchPayments();
  }, [fetchClients, fetchPayments]);

  const refreshClientAIInfo = useCallback(async (clientId: string) => {
    setIsLoadingAI(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/refresh-ai`, { method: 'POST' });
      const result: ApiResponse<Client> = await response.json();
      if (result.success && result.data) {
        setClients(prev => prev.map(c => c.id === clientId ? result.data! : c));
        toast({ title: "AI Insights Updated", description: `Successfully updated AI insights for ${result.data.name}.` });
      } else {
        toast({ title: "AI Update Failed", description: result.error || "Could not update AI insights.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error refreshing AI info:", error);
      toast({ title: "AI Update Failed", description: "Could not update AI insights.", variant: "destructive" });
    } finally {
      setIsLoadingAI(false);
    }
  }, [toast]);

  const addClient = async (clientData: ClientFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      const result: ApiResponse<Client> = await response.json();
      if (result.success && result.data) {
        setClients(prev => [...prev, result.data!]);
        toast({ title: "Client Added", description: `${result.data.name} has been added.` });
      } else {
        toast({ title: "Error", description: result.error || "Failed to add client.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to add client.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (clientId: string, updatedData: Partial<ClientFormData>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const result: ApiResponse<Client> = await response.json();
      if (result.success && result.data) {
        setClients(prev => prev.map(c => c.id === clientId ? result.data! : c));
        toast({ title: "Client Updated", description: `${result.data.name}'s details have been updated.` });
      } else {
        toast({ title: "Error", description: result.error || "Failed to update client.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update client.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteClient = async (clientId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      const result: ApiResponse<null> = await response.json();
      if (result.success) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        toast({ title: "Client Deleted", description: `Client has been removed.` });
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete client.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete client.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getClientById = (clientId: string) => clients.find(c => c.id === clientId);
  
  const getPaymentsByClientId = (clientId: string) => payments.filter(p => p.clientId === clientId);

  const requestPayment = async (paymentData: PaymentFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      const result: ApiResponse<Payment> = await response.json();
      if (result.success && result.data) {
        setPayments(prev => [...prev, result.data!]);
        toast({ title: "Payment Link Sent", description: `Link sent to ${result.data.clientName} for ₹${result.data.amount}.` });
      } else {
        toast({ title: "Payment Request Failed", description: result.error || "Could not process payment request.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating payment link or sending notification:", error);
      toast({ title: "Payment Request Failed", description: "Could not process payment request.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: Payment['status']) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result: ApiResponse<Payment> = await response.json();
      if (result.success && result.data) {
        setPayments(prev => prev.map(p => p.id === paymentId ? result.data! : p));
        // If a payment status changes, client's transactions and AI data might have changed too.
        // Fetching clients again to reflect these server-side changes.
        await fetchClients(); 
        toast({ title: "Payment Status Updated", description: `Status for payment ID ${paymentId} changed to ${status}.` });
      } else {
        toast({ title: "Error", description: result.error || "Failed to update payment status.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update payment status.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const login = (credentials: { email: string; }) => {
    setUser({ name: "Mock User", email: credentials.email });
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
        isLoading,
        isLoadingAI,
        refreshClientAIInfo,
        fetchClients,
        fetchPayments,
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
