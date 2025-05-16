
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart2, Users, CreditCard, Zap, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  const { user } = useAppContext();
  const router = useRouter();

  // If user is logged in, redirect to dashboard. 
  // Otherwise, this page (landing page) is shown.
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (user) { // Still show loading or blank while redirecting
    return <div className="flex min-h-screen items-center justify-center bg-background"><p>Loading...</p></div>;
  }

  const features = [
    {
      icon: BarChart2,
      title: "Insightful Dashboards",
      description: "Visualize income, expenses, pending dues, and AI-powered client prediction scores.",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Easily add, update, and manage client details and their transaction histories.",
      color: "text-accent"
    },
    {
      icon: CreditCard,
      title: "Streamlined Payments",
      description: "Initiate payment requests and send gateway links via SMS/Email effortlessly.",
      color: "text-green-500"
    },
    {
      icon: Zap,
      title: "Real-time Predictions",
      description: "Leverage GenAI for accurate transaction prediction scores for each client.",
      color: "text-purple-500"
    },
     {
      icon: ShieldCheck,
      title: "Secure & Reliable",
      description: "Built with security in mind to protect your financial data and client information.",
      color: "text-blue-500"
    }
  ];


  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="https://placehold.co/40x40.png" alt="PayWise Logo" width={40} height={40} className="rounded-lg" data-ai-hint="logo financial"/>
          <span className="text-2xl font-bold text-primary">PayWise</span>
        </Link>
        <nav className="space-x-2 sm:space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/signup"><UserPlus className="mr-2 h-4 w-4" />Sign Up</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <Badge variant="outline" className="mb-6 py-1 px-3 rounded-full text-sm border-primary text-primary">
            Smarter Payments, Wiser Decisions
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Manage Your Payments <span className="text-primary">Intelligently</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            PayWise offers a comprehensive suite to handle client payments, track financial health, and predict transaction outcomes with cutting-edge AI.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 shadow-lg transform hover:scale-105 transition-transform">
              <Link href="/signup">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6 shadow-lg transform hover:scale-105 transition-transform">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </main>

      <section id="features" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Why Choose PayWise?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Unlock powerful tools designed to simplify your financial workflow and provide actionable insights.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-card p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-start">
                <div className={`p-3 rounded-full bg-primary/10 mb-4 ${feature.color}`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-16 sm:py-24">
         <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">Ready to Transform Your Payment Management?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join hundreds of businesses streamlining their finances with PayWise.
            </p>
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-7 shadow-lg transform hover:scale-105 transition-transform">
              <Link href="/signup">Sign Up Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
         </div>
      </section>

      <footer className="py-8 bg-muted/50 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} PayWise. All rights reserved.
          <div className="mt-2">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link> &middot; <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
