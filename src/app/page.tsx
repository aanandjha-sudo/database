
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DatabaseZap } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you should use a secure authentication method.
    // The credentials are now stored in environment variables.
    if (username === process.env.NEXT_PUBLIC_DEFAULT_USER_NAME && password === process.env.NEXT_PUBLIC_DEFAULT_USER_PASSWORD) {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // A real app would use a session or token.
      // For this demo, we'll just redirect.
      // A robust solution would involve Firebase Auth.
      router.push('/dashboard');
    } else {
      setError('Invalid username or password');
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid username or password',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <DatabaseZap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Firebase Proxy Service</CardTitle>
          <CardDescription>Please log in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
           <div className="mt-4 text-center text-sm">
            <a href="/spark-plan" className="underline">
              Firebase Spark Plan Details
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

