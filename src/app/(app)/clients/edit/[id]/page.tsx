
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import type { ClientFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { getClientById, updateClient, isLoading, fetchClients } = useAppContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);

  const populateForm = useCallback(() => {
    const client = getClientById(clientId);
    if (client) {
      setName(client.name);
      setEmail(client.email);
      setPhone(client.phone);
      setIsPageLoading(false);
    } else {
      // If client not found in context, try fetching again (e.g. direct navigation)
      // then attempt to populate. This might indicate a need for a dedicated fetchClientById.
      fetchClients().then(() => {
        const fetchedClient = getClientById(clientId);
        if (fetchedClient) {
          setName(fetchedClient.name);
          setEmail(fetchedClient.email);
          setPhone(fetchedClient.phone);
        } else {
          // If still not found, redirect
          router.push('/clients');
        }
        setIsPageLoading(false);
      });
    }
  }, [clientId, getClientById, router, fetchClients]);


  useEffect(() => {
    populateForm();
  }, [clientId, populateForm]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: ClientFormData = { name, email, phone };
    await updateClient(clientId, updatedData); // Pass clientId and data separately
    router.push(`/clients/${clientId}`);
  };

  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-24" />
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-11 w-full" />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Skeleton className="h-11 w-24" />
              <Skeleton className="h-11 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Client</CardTitle>
          <CardDescription>Update the details for {name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="h-11"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required  className="h-11"/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required  className="h-11"/>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="h-11" disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 h-11" disabled={isLoading}>
                {isLoading ? 'Saving...' : <><Save className="mr-2 h-5 w-5" /> Save Changes</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
