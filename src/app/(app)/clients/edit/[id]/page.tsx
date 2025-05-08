"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import type { ClientFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { getClientById, updateClient } = useAppContext();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = getClientById(clientId);
    if (client) {
      setName(client.name);
      setEmail(client.email);
      setPhone(client.phone);
      setIsLoading(false);
    } else {
      // Handle case where client is not found, e.g., redirect or show error
      router.push('/clients'); 
    }
  }, [clientId, getClientById, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getClientById(clientId);
    if (client) {
      const updatedData: ClientFormData = { name, email, phone };
      await updateClient({ ...client, ...updatedData });
      router.push(`/clients/${clientId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p>Loading client data...</p>
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
              <Button type="button" variant="outline" onClick={() => router.back()} className="h-11">
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 h-11">
                <Save className="mr-2 h-5 w-5" /> Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
