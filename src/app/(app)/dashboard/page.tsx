
"use client";

import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { IndianRupee, TrendingUp, TrendingDown, AlertTriangle, Users, FileText } from 'lucide-react'; // Replaced DollarSign
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"; // Ensure ChartTooltipContent is imported if used standalone

const chartConfig = {
  income: { label: "Income", color: "hsl(var(--chart-1))" },
  expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
  pending: { label: "Pending", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const predictionScoreRanges = [
  { range: '0-20 (Very Low Risk)', color: 'hsl(var(--chart-1))' }, 
  { range: '21-40 (Low Risk)', color: 'hsl(var(--chart-5))' }, 
  { range: '41-60 (Medium Risk)', color: 'hsl(var(--chart-4))' }, 
  { range: '61-80 (High Risk)', color: 'hsl(var(--chart-2))' }, 
  { range: '81-100 (Very High Risk)', color: 'hsl(var(--destructive))' }, 
];

export default function DashboardPage() {
  const { clients, payments, isLoadingAI } = useAppContext();

  const stats = useMemo(() => {
    const totalIncome = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalExpenses = totalIncome * 0.3; 

    const pendingDues = payments
      .filter(p => p.status === 'link_sent' || p.status === 'pending_link') 
      .reduce((sum, p) => sum + p.amount, 0);
    
    const averagePredictionScore = clients.length > 0 
      ? clients.reduce((sum, c) => sum + (c.predictionScore || 0), 0) / clients.length
      : 0;

    return { totalIncome, totalExpenses, pendingDues, averagePredictionScore };
  }, [payments, clients]);

  const monthlyData = useMemo(() => {
    const dataMap = new Map<string, { name: string, income: number, expenses: number }>();
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
      if (!dataMap.has(month)) {
        dataMap.set(month, { name: month, income: 0, expenses: 0 });
      }
      if (p.status === 'paid') {
        dataMap.get(month)!.income += p.amount;
        dataMap.get(month)!.expenses += p.amount * 0.3; 
      }
    });
    const currentMonth = new Date().getMonth();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < 6; i++) { 
      const monthIdx = (currentMonth - i + 12) % 12;
      const monthName = monthNames[monthIdx];
      if (!dataMap.has(monthName)) {
        dataMap.set(monthName, { name: monthName, income: 0, expenses: 0 });
      }
    }
    return Array.from(dataMap.values()).sort((a,b) => monthNames.indexOf(a.name) - monthNames.indexOf(b.name));
  }, [payments]);

  const predictionScoreDistribution = useMemo(() => {
    const distribution = predictionScoreRanges.map(r => ({ name: r.range, value: 0, color: r.color }));
    clients.forEach(client => {
      const score = client.predictionScore || 0;
      if (score <= 20) distribution[0].value++;
      else if (score <= 40) distribution[1].value++;
      else if (score <= 60) distribution[2].value++;
      else if (score <= 80) distribution[3].value++;
      else distribution[4].value++;
    });
    return distribution.filter(d => d.value > 0);
  }, [clients]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <IndianRupee className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+10.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Dues</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.pendingDues.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{payments.filter(p => p.status === 'link_sent' || p.status === 'pending_link').length} pending payments</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Prediction Score</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePredictionScore.toFixed(0)} / 100</div>
            <p className="text-xs text-muted-foreground">{isLoadingAI ? "Updating..." : "Based on AI analysis"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Income & Expenses Overview</CardTitle>
            <CardDescription>Monthly trends in income and expenses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <BarChart data={monthlyData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <Tooltip content={<ChartTooltipContent />} cursor={false} />
                <Legend />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Client Prediction Score Distribution</CardTitle>
            <CardDescription>Breakdown of clients by AI-powered risk scores.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            {predictionScoreDistribution.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Pie 
                      data={predictionScoreDistribution} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={120} 
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {predictionScoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                     <Legend wrapperStyle={{fontSize: "12px"}}/>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-2" />
                <p>No client data available for prediction score distribution.</p>
                <p className="text-sm">Add clients to see this chart.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 md:grid-cols-1">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest payments and client updates.</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 && clients.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="mx-auto h-12 w-12 mb-2" />
                <p>No recent activity.</p>
                <p className="text-sm">Payments and client actions will appear here.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {payments.slice(0, 3).map(payment => (
                  <li key={payment.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                    <div>
                      <p className="font-medium text-foreground">Payment {payment.status === 'paid' ? 'Received' : (payment.status === 'link_sent' ? 'Link Sent' : 'Initiated')}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.clientName} - ₹{payment.amount} for "{payment.description}"
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
                {clients.slice(0, 2).map(client => (
                   <li key={client.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                    <div>
                      <p className="font-medium text-foreground">Client {client.paymentHistory === "New client, no payment history yet." ? "Added" : "Updated"}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.name} - {client.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(client.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    