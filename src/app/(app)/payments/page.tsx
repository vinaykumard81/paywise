
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { PaymentFormData, Client, Payment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Send, IndianRupee, Filter, ClipboardList, Link as LinkIcon, CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'; // Replaced DollarSign
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

const PaymentRequestForm: React.FC<{ 
  clients: Client[]; 
  onSave: (paymentData: PaymentFormData) => Promise<void>; 
  onClose: () => void;
  isLoading: boolean;
}> = ({ clients, onSave, onClose, isLoading }) => {
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 1 week from now
  const [communicationMethod, setCommunicationMethod] = useState<'sms' | 'email' | 'both'>('both');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast({
        title: "Client Required",
        description: "Please select a client to request payment from.",
        variant: "destructive",
      });
      return;
    }
    if (!dueDate) {
      toast({
        title: "Due Date Required",
        description: "Please select a due date for the payment.",
        variant: "destructive",
      });
      return;
    }
    await onSave({ 
      clientId, 
      amount: parseFloat(amount), 
      description, 
      dueDate: dueDate.toISOString(),
      communicationMethod,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="client">Client</Label>
        <Select onValueChange={setClientId} value={clientId} required disabled={isLoading}>
          <SelectTrigger id="client">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01" disabled={isLoading}/>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isLoading}/>
      </div>
      <div>
        <Label htmlFor="dueDate">Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
            />
          </PopoverContent>
        </Popover>
      </div>
       <div>
        <Label htmlFor="communicationMethod">Send Via</Label>
        <Select onValueChange={(value: 'sms' | 'email' | 'both') => setCommunicationMethod(value)} value={communicationMethod} required disabled={isLoading}>
          <SelectTrigger id="communicationMethod">
            <SelectValue placeholder="Select communication method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email Only</SelectItem>
            <SelectItem value="sms">SMS Only</SelectItem>
            <SelectItem value="both">Email & SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Payment Request'}
        </Button>
      </DialogFooter>
    </form>
  );
};


const PaymentStatusIcon = ({ status }: { status: Payment['status']}) => {
  switch (status) {
    case 'pending_link': return <Clock className="h-4 w-4 text-yellow-500" title="Pending Link Creation"/>;
    case 'link_sent': return <LinkIcon className="h-4 w-4 text-blue-500" title="Link Sent"/>;
    case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" title="Paid"/>;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" title="Failed"/>;
    case 'expired': return <AlertCircle className="h-4 w-4 text-orange-500" title="Expired"/>;
    default: return null;
  }
};

export default function PaymentsPage() {
  const { clients, payments, requestPayment, updatePaymentStatus, isLoading } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Payment['status'] | 'all'>('all');
  const [simulatingPaymentId, setSimulatingPaymentId] = useState<string | null>(null);


  const handleSavePaymentRequest = async (paymentData: PaymentFormData) => {
    await requestPayment(paymentData);
    setIsModalOpen(false);
  };
  
  const simulatePayment = async (paymentId: string, outcome: 'paid' | 'failed') => {
    setSimulatingPaymentId(paymentId);
    await updatePaymentStatus(paymentId, outcome);
    setSimulatingPaymentId(null);
  };

  const filteredPayments = payments.filter(payment => 
    filterStatus === 'all' || payment.status === filterStatus
  ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusOptions: {value: Payment['status'] | 'all', label: string}[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending_link', label: 'Pending Link' },
    { value: 'link_sent', label: 'Link Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'expired', label: 'Expired' },
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments Management</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90" disabled={clients.length === 0 || isLoading}>
              <Send className="mr-2 h-5 w-5" /> Request Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>New Payment Request</DialogTitle>
              <DialogDescription>
                Send a payment link to a client via SMS and/or Email.
              </DialogDescription>
            </DialogHeader>
            {clients.length > 0 ? (
              <PaymentRequestForm 
                clients={clients} 
                onSave={handleSavePaymentRequest} 
                onClose={() => setIsModalOpen(false)} 
                isLoading={isLoading}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No clients available. Please add a client first.</p>
                <Button asChild variant="link" className="mt-2 text-primary">
                  <a href="/clients">Go to Clients</a>
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-lg">
         <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <CardTitle className="text-xl flex items-center"><ClipboardList className="mr-2 h-6 w-6 text-primary"/>Payment History</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground"/>
              <Select onValueChange={(value: Payment['status'] | 'all') => setFilterStatus(value)} value={filterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription>View and manage all payment requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && payments.length === 0 ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => ( <Skeleton key={i} className="h-12 w-full" /> ))}
            </div>
          ) : filteredPayments.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
              <IndianRupee className="mx-auto h-16 w-16 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Payments Found</h3>
              <p className="mb-4">
                {filterStatus !== 'all' ? "No payments match the current filter." : "Get started by requesting a payment."}
              </p>
              {!clients.length && (
                 <p className="text-sm">You need to add clients before you can request payments.</p>
              )}
              {clients.length > 0 && (
                <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90" disabled={isLoading}>
                    <Send className="mr-2 h-5 w-5" /> Request Payment
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{payment.clientName}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={payment.description}>{payment.description}</TableCell>
                    <TableCell className="text-right">₹{payment.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'} 
                            className={`capitalize flex items-center justify-center gap-1 w-28 mx-auto`}>
                         <PaymentStatusIcon status={payment.status} />
                        {payment.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(payment.dueDate), "PP")}</TableCell>
                    <TableCell>{format(new Date(payment.createdAt), "PPp")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {payment.status === 'link_sent' && (
                        <>
                          <Button 
                            variant="outline" size="sm" 
                            onClick={() => simulatePayment(payment.id, 'paid')} 
                            className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                            disabled={isLoading && simulatingPaymentId === payment.id}
                          >
                            {isLoading && simulatingPaymentId === payment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Paid'}
                          </Button>
                          <Button 
                            variant="outline" size="sm" 
                            onClick={() => simulatePayment(payment.id, 'failed')} 
                            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={isLoading && simulatingPaymentId === payment.id}
                          >
                             {isLoading && simulatingPaymentId === payment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Failed'}
                          </Button>
                        </>
                      )}
                      {payment.paymentLinkUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={payment.paymentLinkUrl} target="_blank" rel="noopener noreferrer" title="Open Payment Link">
                            <LinkIcon className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
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

    