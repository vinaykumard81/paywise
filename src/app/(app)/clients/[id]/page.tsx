"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, CalendarDays, DollarSign, ListChecks, ShieldAlert, Brain, Edit, Trash2, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const { getClientById, deleteClient, refreshClientAIInfo, isLoadingAI, getPaymentsByClientId } = useAppContext();
  
  const client = getClientById(clientId);
  const clientPayments = client ? getPaymentsByClientId(client.id) : [];

  useEffect(() => {
    if (client && (client.predictionScore === undefined || client.paymentSummary === undefined)) {
      refreshClientAIInfo(clientId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, clientId]); // refreshClientAIInfo removed to prevent loop

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
        <FileText className="w-24 h-24 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Client Not Found</h1>
        <p className="text-muted-foreground mb-4">The client you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push('/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      deleteClient(clientId);
      router.push('/clients');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'link_sent': return 'text-blue-500';
      case 'failed': return 'text-red-500';
      case 'overdue': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };
  
  const getRiskColor = (score?: number) => {
    if (score === undefined) return 'bg-gray-500';
    if (score <= 20) return 'bg-green-500';
    if (score <= 40) return 'bg-lime-500';
    if (score <= 60) return 'bg-yellow-500';
    if (score <= 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push('/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.push(`/clients/edit/${clientId}`)} aria-label="Edit Client">
             <Edit className="mr-2 h-4 w-4" /> Edit
           </Button>
           <Button variant="destructive" onClick={handleDelete} aria-label="Delete Client">
             <Trash2 className="mr-2 h-4 w-4" /> Delete
           </Button>
        </div>
      </div>

      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={`https://picsum.photos/seed/${client.email}/100/100`} alt={client.name} data-ai-hint="profile avatar"/>
              <AvatarFallback className="text-2xl">{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl font-bold text-foreground">{client.name}</CardTitle>
              <CardDescription className="text-base text-muted-foreground">Client since {new Date(client.createdAt).toLocaleDateString()}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">{client.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">{client.phone}</span>
            </div>
             <div className="flex items-center space-x-3">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Joined: {new Date(client.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
               <Button variant="outline" size="sm" onClick={() => refreshClientAIInfo(clientId)} disabled={isLoadingAI}>
                 <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                 {isLoadingAI ? 'Refreshing...' : 'Refresh AI'}
               </Button>
            </div>
            
            {isLoadingAI && !client.predictionScore ? (
              <>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="predictionScore" className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-accent"/>Prediction Score</Label>
                    <span className={`font-bold text-lg ${getRiskColor(client.predictionScore)?.replace('bg-', 'text-')}`}>{client.predictionScore?.toFixed(0) || 'N/A'} / 100</span>
                  </div>
                  <Progress value={client.predictionScore || 0} className="w-full h-3 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:via-yellow-400 [&>div]:to-red-500" 
                    style={{ '--tw-gradient-stops': `var(--${getRiskColor(client.predictionScore)?.replace('bg-','')}--tw-color1, ${getRiskColor(client.predictionScore)}), var(--${getRiskColor(client.predictionScore)?.replace('bg-','')}--tw-color2, ${getRiskColor(client.predictionScore)})` } as React.CSSProperties}
                  />
                  {client.riskFactors && (
                    <p className="text-xs text-muted-foreground">Key Risk Factors: {client.riskFactors}</p>
                  )}
                </div>
                <Separator />
                <div>
                  <Label className="flex items-center gap-2 mb-1"><Brain className="h-5 w-5 text-accent"/>Payment Summary</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed p-3 bg-secondary/30 rounded-md">
                    {client.paymentSummary || 'No summary available yet. Refresh AI insights.'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary"/>Transactions</CardTitle>
            <CardDescription>History of payments and transactions for this client.</CardDescription>
          </CardHeader>
          <CardContent>
            {client.transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="mx-auto h-12 w-12 mb-2" />
                <p>No transactions recorded for this client yet.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={tx.description}>{tx.description}</TableCell>
                        <TableCell className="text-right font-medium">${tx.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={tx.status === 'paid' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'} 
                                 className={`${getStatusColor(tx.status)} capitalize`}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary"/>Payment Requests</CardTitle>
            <CardDescription>History of payment requests sent to this client.</CardDescription>
          </CardHeader>
          <CardContent>
            {clientPayments.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-2" />
                <p>No payment requests found for this client.</p>
                <Button asChild variant="link" className="text-primary">
                    <Link href="/payments">Initiate a new payment</Link>
                </Button>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={payment.description}>{payment.description}</TableCell>
                        <TableCell className="text-right font-medium">${payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={payment.status === 'paid' ? 'default' : payment.status === 'failed' ? 'destructive' : 'secondary'} 
                                 className={`${getStatusColor(payment.status)} capitalize`}>
                            {payment.status.replace('_', ' ')}
                          </Badge>
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
    </div>
  );
}
