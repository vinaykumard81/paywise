"use client";

import React, { useState } from 'react';
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
  DialogClose,
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

const ClientForm: React.FC<{ 
  client?: Client; 
  onSave: (clientData: ClientFormData, id?: string) => void; 
  onClose: () => void;
}> = ({ client, onSave, onClose }) => {
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  const [phone, setPhone] = useState(client?.phone || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, phone }, client?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Client</Button>
      </DialogFooter>
    </form>
  );
};

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, refreshClientAIInfo, isLoadingAI } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveClient = async (clientData: ClientFormData, id?: string) => {
    if (id) {
      const existingClient = clients.find(c => c.id === id);
      if (existingClient) {
        await updateClient({ ...existingClient, ...clientData });
      }
    } else {
      await addClient(clientData);
    }
    setIsModalOpen(false);
    setEditingClient(undefined);
  };

  const openAddModal = () => {
    setEditingClient(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteClient(clientId);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskBadgeVariant = (score?: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score === undefined) return "outline";
    if (score <= 20) return "default"; // Teal like
    if (score <= 60) return "secondary"; // Orange like
    return "destructive"; // Red
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
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              <DialogDescription>
                {editingClient ? 'Update the details of your client.' : 'Enter the details for the new client.'}
              </DialogDescription>
            </DialogHeader>
            <ClientForm 
              client={editingClient} 
              onSave={handleSaveClient} 
              onClose={() => { setIsModalOpen(false); setEditingClient(undefined); }} 
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
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Clients Found</h3>
              <p className="mb-4">
                {searchTerm ? "Try adjusting your search term." : "Get started by adding your first client."}
              </p>
              {!searchTerm && (
                 <Button onClick={openAddModal}>
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
                            <Button variant="ghost" size="icon">
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
                            <DropdownMenuItem onClick={() => openEditModal(client)} className="flex items-center">
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => refreshClientAIInfo(client.id)} disabled={isLoadingAI} className="flex items-center">
                              <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAI ? 'animate-spin' : ''}`} /> 
                              {isLoadingAI ? 'Refreshing...' : 'Refresh AI'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center">
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
