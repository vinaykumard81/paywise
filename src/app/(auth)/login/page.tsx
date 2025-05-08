"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/AppContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { login } = useAppContext();
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password"); // Mock password

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email });
    router.push("/dashboard");
  };

  return (
    <Card className="w-full max-w-sm shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <LogIn className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
        <CardDescription>Enter your credentials to access PayWise Dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="h-12 text-base"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg bg-primary hover:bg-primary/90">
            <LogIn className="mr-2 h-5 w-5" /> Login
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-2">
        <Link href="#" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
