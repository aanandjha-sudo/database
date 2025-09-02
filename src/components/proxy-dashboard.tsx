"use client";

import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, Info, Loader2, KeyRound, Copy } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ProxyDashboardProps {
  initialActiveProjectId: string | null;
  error: string | null;
}

const apiExamples = {
  getDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_FIREBASE_ID_TOKEN>'
  },
  body: JSON.stringify({
    operation: 'getDoc',
    path: ['users', 'someUserId']
  })
});`,
  addDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_FIREBASE_ID_TOKEN>'
  },
  body: JSON.stringify({
    operation: 'addDoc',
    path: ['posts'], // Path to a collection
    payload: { 
      title: 'New Post', 
      content: 'Hello World!' 
    }
  })
});`,
  setDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_FIREBASE_ID_TOKEN>'
  },
  body: JSON.stringify({
    operation: 'setDoc',
    path: ['users', 'someUserId'], // Path to a document
    payload: { 
      name: 'John Doe', 
      email: 'john.doe@example.com' 
    }
  })
});`,
  updateDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_FIREBASE_ID_TOKEN>'
  },
  body: JSON.stringify({
    operation: 'updateDoc',
    path: ['users', 'someUserId'], // Path to a document
    payload: { 
      lastLogin: new Date().toISOString()
    }
  })
});`,
  deleteDoc: `fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_FIREBASE_ID_TOKEN>'
  },
  body: JSON.stringify({
    operation: 'deleteDoc',
    path: ['users', 'someUserId'] // Path to a document
  })
});`
};

export function ProxyDashboard({ initialActiveProjectId, error }: ProxyDashboardProps) {
  const [activeProjectId, setActiveProjectId] = useState(initialActiveProjectId);
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSwitchProject = async () => {
    if (!adminSecret) {
      toast({
        variant: 'destructive',
        title: 'Missing Secret',
        description: 'Please enter the admin secret key.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/switch-project', {
        method: 'POST',
        headers: {
          'X-Admin-Secret': adminSecret,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to switch project');
      }
      setActiveProjectId(data.activeProjectId);
      toast({
        title: 'Project Switched',
        description: `Active project is now: ${data.activeProjectId}`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error Switching Project',
        description: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
    });
  };
  
  const isServiceActive = activeProjectId && !error;

  return (
    <div className="space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            Service Status
            {isServiceActive ? (
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle className="mr-2 h-4 w-4" /> Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="mr-2 h-4 w-4" /> Inactive
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Current status and configuration of the proxy service.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Active Storage Project ID:</span>
            {isServiceActive ? (
              <span className="font-mono font-bold text-accent">{activeProjectId}</span>
            ) : (
              <span className="font-mono font-bold text-destructive-foreground bg-destructive px-2 py-1 rounded-md">Not Available</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible>
            <AccordionItem value="admin-panel" className="border-b-0">
              <AccordionTrigger className="px-6 py-4 text-lg font-headline">
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Admin Panel
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter the admin secret key to perform administrative actions.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="password"
                      placeholder="Enter Admin Secret Key"
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      className="flex-grow"
                    />
                    <Button onClick={handleSwitchProject} disabled={isLoading || !isServiceActive}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Switch Project
                    </Button>
                  </div>
                   {!isServiceActive && <p className="text-xs text-destructive">Admin actions are disabled because the service is inactive.</p>}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">API Usage</CardTitle>
          <CardDescription>
            Example requests for interacting with the `/api/proxy` endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="getDoc">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="getDoc">getDoc</TabsTrigger>
              <TabsTrigger value="addDoc">addDoc</TabsTrigger>
              <TabsTrigger value="setDoc">setDoc</TabsTrigger>
              <TabsTrigger value="updateDoc">updateDoc</TabsTrigger>
              <TabsTrigger value="deleteDoc">deleteDoc</TabsTrigger>
            </TabsList>
            {Object.entries(apiExamples).map(([key, code]) => (
              <TabsContent key={key} value={key}>
                <div className="relative mt-4 rounded-md bg-muted/50 p-4 font-code text-sm">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-7 w-7"
                          onClick={() => copyToClipboard(code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy code</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <pre className="overflow-x-auto whitespace-pre-wrap">{code}</pre>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
