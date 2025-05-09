
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Client, ClientFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2, Eye, RefreshCw, FileText, Users, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ClientForm: React.FC<{ 
  client?: Client; 
  onSave: (clientData: ClientFormData, id?: string) => Promise<void>; 
  onClose: () => void;
  isLoading: boolean;
}> = ({ client, onSave, onClose, isLoading }) => {
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');

  useEffect(() => {
    if (client) {
      setName(client.name);
      setEmail(client.email);
      setPhone(client.phone);
    } else {
      setName('');
      setEmail('');
      setPhone('');
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, email, phone }, client?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={isLoading} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? (editingClient ? 'Saving...' : 'Adding...') : 'Save Client'}</Button>
      </DialogFooter>
    </form>
  );
};
// To satisfy the form, we need a way to know if it's an edit or add operation for the loading text.
// This is a simple way, but could be more robust.
let editingClient: Client | undefined = undefined;

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, refreshClientAIInfo, isLoading, isLoadingAI } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  //editingClient is now a local state for the modal trigger, not for the form content itself
  const [currentEditingClient, setCurrentEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveClient = async (clientData: ClientFormData, id?: string) => {
    if (id) {
      await updateClient(id, clientData);
    } else {
      await addClient(clientData);
    }
    setIsModalOpen(false);
    setCurrentEditingClient(undefined);
    editingClient = undefined; // Reset global hack
  };

  const openAddModal = () => {
    setCurrentEditingClient(undefined);
    editingClient = undefined; // For form's loading text
    setIsModalOpen(true);
  };

  const openEditModal = (clientObj: Client) => {
    setCurrentEditingClient(clientObj);
    editingClient = clientObj; // For form's loading text
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      await deleteClient(clientId);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskBadgeVariant = (score?: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score === undefined) return "outline";
    if (score <= 20) return "default"; 
    if (score <= 60) return "secondary"; 
    return "destructive";
  };
  
  const getRiskBadgeText = (score?: number): string => {
    if (score === undefined) return "N/A";
    if (score <= 20) return "Very Low";
    if (score <= 40) return "Low";
    if (score <= 60) return "Medium";
    if (score <= 80) return "High";
    return "Very High";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Clients</h1>
        <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
          setIsModalOpen(isOpen);
          if (!isOpen) {
            setCurrentEditingClient(undefined);
            editingClient = undefined;
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              <PlusCircle className="mr-2 h-5 w-5" /> {isLoading && !currentEditingClient ? 'Loading...' : 'Add New Client'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{currentEditingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              <DialogDescription>
                {currentEditingClient ? 'Update the details of your client.' : 'Enter the details for the new client.'}
              </DialogDescription>
            </DialogHeader>
            <ClientForm 
              client={currentEditingClient} 
              onSave={handleSaveClient} 
              onClose={() => { setIsModalOpen(false); setCurrentEditingClient(undefined); editingClient = undefined;}} 
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-xl">Client List</CardTitle>
            <Input 
              placeholder="Search clients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && clients.length === 0 ? (
             <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Clients Found</h3>
              <p className="mb-4">
                {searchTerm ? "Try adjusting your search term." : "Get started by adding your first client."}
              </p>
              {!searchTerm && (
                 <Button onClick={openAddModal} disabled={isLoading}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Client
                 </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Prediction Score</TableHead>
                    <TableHead className="text-center">Risk Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-center">
                        {client.predictionScore !== undefined ? client.predictionScore.toFixed(0) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getRiskBadgeVariant(client.predictionScore)}>
                          {getRiskBadgeText(client.predictionScore)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading || isLoadingAI}>
                              <MoreHorizontal className="h-5 w-5" />
                              <span className="sr-only">Client Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/clients/${client.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(client)} className="flex items-center" disabled={isLoading}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => refreshClientAIInfo(client.id)} disabled={isLoadingAI || isLoading} className="flex items-center">
                              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAI ? 'animate-spin' : ''}`} /> 
                              {isLoadingAI ? 'Refreshing...' : 'Refresh AI'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center" disabled={isLoading}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
