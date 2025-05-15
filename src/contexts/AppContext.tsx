
"use client";

import type { Client, Payment, ClientFormData, PaymentFormData, ApiResponse } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  clients: Client[];
  addClient: (clientData: ClientFormData) => Promise<void>;
  updateClient: (clientId: string, updatedData: Partial<ClientFormData>) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  getClientById: (clientId: string) => Client | undefined; 
  payments: Payment[];
  requestPayment: (paymentData: PaymentFormData) => Promise<void>;
  updatePaymentStatus: (paymentId: string, status: Payment['status']) => Promise<void>;
  getPaymentsByClientId: (clientId: string) => Payment[]; 
  user: { name: string; email: string } | null;
  login: (credentials: { email: string; }) => void;
  signup: (details: { name: string; email: string; }) => void;
  logout: () => void;
  isLoading: boolean; 
  isLoadingAI: boolean; 
  refreshClientAIInfo: (clientId: string) => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchPayments: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true); 
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
        toast({ title: "Error Fetching Clients", description: result.error || "Failed to fetch clients.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to fetch clients due to a network issue.", variant: "destructive" });
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
        toast({ title: "Error Fetching Payments", description: result.error || "Failed to fetch payments.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to fetch payments due to a network issue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    // Attempt to retrieve user from localStorage on initial load
    const storedUser = localStorage.getItem('paywiseUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('paywiseUser'); // Clear invalid storage
      }
    } else {
      // For demo purposes, if no stored user, set a default mock user.
      // In a real app, you'd likely redirect to login or show a logged-out state.
      // login({ email: "demo@example.com", name: "Demo User"}); // Auto-login for demo
    }
    fetchClients();
    fetchPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchClients, fetchPayments removed from deps to prevent re-fetch on their identity change

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
      toast({ title: "Network Error", description: "Could not update AI insights due to a network issue.", variant: "destructive" });
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
        toast({ title: "Add Client Failed", description: result.error || "Failed to add client.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to add client due to a network issue.", variant: "destructive" });
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
        toast({ title: "Update Client Failed", description: result.error || "Failed to update client.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to update client due to a network issue.", variant: "destructive" });
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
        setPayments(prev => prev.filter(p => p.clientId !== clientId)); // Also remove payments associated with the client
        toast({ title: "Client Deleted", description: `Client has been removed.` });
      } else {
        toast({ title: "Delete Client Failed", description: result.error || "Failed to delete client.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to delete client due to a network issue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getClientById = (clientId: string) => clients.find(c => c.id === clientId);
  
  const getPaymentsByClientId = (clientId: string) => payments.filter(p => p.clientId === clientId);

  const requestPayment = async (paymentData: PaymentFormData) => {
    if (!paymentData.clientId) {
      toast({
        title: "Client Not Selected",
        description: "Please select a client before requesting payment.",
        variant: "destructive",
      });
      return;
    }
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
        toast({ title: "Payment Link Sent", description: result.message || `Link sent for ₹${result.data.amount}.` });
      } else {
        toast({ title: "Payment Request Failed", description: result.error || "Could not process payment request.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating payment link or sending notification:", error);
      toast({ title: "Network Error", description: "Could not process payment request due to a network issue.", variant: "destructive" });
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
        if (status === 'paid' || status === 'failed') {
           // AI insights are updated on the server; refetch client to get latest.
          const changedPayment = result.data;
          const clientToUpdate = clients.find(c => c.id === changedPayment.clientId);
          if (clientToUpdate) {
            await refreshClientAIInfo(clientToUpdate.id); // This will fetch and update the specific client
          } else {
            await fetchClients(); // Fallback to fetching all clients if specific one isn't readily available
          }
        }
        toast({ title: "Payment Status Updated", description: `Status for payment ID ${paymentId} changed to ${status}.` });
      } else {
        toast({ title: "Update Payment Failed", description: result.error || "Failed to update payment status.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to update payment status due to a network issue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const login = (credentials: { email: string; name?: string }) => { // name is optional, can be added
    const userData = { name: credentials.name || "Demo User", email: credentials.email };
    setUser(userData);
    localStorage.setItem('paywiseUser', JSON.stringify(userData));
    toast({ title: "Logged In", description: `Welcome back, ${userData.name}!`});
  };

  const signup = (details: { name: string; email: string; }) => {
    setUser(details);
    localStorage.setItem('paywiseUser', JSON.stringify(details));
    toast({ title: "Signed Up", description: `Welcome, ${details.name}!`});
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('paywiseUser');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    // No explicit redirect here, AppLayout will handle redirect to /login
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

