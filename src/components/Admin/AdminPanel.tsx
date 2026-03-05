
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Gift, Copy, Users, Crown, Megaphone, Zap } from 'lucide-react';
import { AnnouncementManager } from './AnnouncementManager';
import { UserManager } from './UserManager';
import { CodeGenerator } from './CodeGenerator';

interface RedeemCode {
  id: string;
  code: string;
  plan_type: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string;
}

export function AdminPanel() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setCodes([]);
    setLoading(false);
  };

  const generateCode = async (planType: 'pro' | 'plus') => {
    if (!user) return;

    setIsGenerating(true);
    toast({
      title: 'Not implemented',
      description: 'Code generation is not available in this build',
      variant: 'destructive',
    });
    setIsGenerating(false);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            Admin Panel
          </h1>
          <p className="text-gray-400">Manage redeem codes, announcements, and users</p>
        </div>

        <Tabs defaultValue="codes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="codes" className="data-[state=active]:bg-gray-700">
              <Gift className="w-4 h-4 mr-2" />
              Redeem Codes
            </TabsTrigger>
            <TabsTrigger value="generator" className="data-[state=active]:bg-gray-700">
              <Zap className="w-4 h-4 mr-2" />
              Code Generator
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-gray-700">
              <Megaphone className="w-4 h-4 mr-2" />
              Announcements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="codes" className="space-y-6">
            {/* Code Generation */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    <Gift className="w-5 h-5" />
                    Generate Pro Code
                  </CardTitle>
                  <CardDescription>
                    Generate a redeem code for Pro plan access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => generateCode('pro')}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Pro Code'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Gift className="w-5 h-5" />
                    Generate Plus Code
                  </CardTitle>
                  <CardDescription>
                    Generate a redeem code for Plus plan access
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => generateCode('plus')}
                    disabled={isGenerating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Plus Code'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Codes List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Generated Codes ({codes.length})
                </CardTitle>
                <CardDescription>
                  All generated redeem codes and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {codes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="bg-gray-800 px-2 py-1 rounded text-green-400 font-mono">
                              {code.code}
                            </code>
                            <Badge 
                              variant={code.plan_type === 'pro' ? 'default' : 'secondary'}
                              className={
                                code.plan_type === 'pro' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-purple-600 text-white'
                              }
                            >
                              {code.plan_type.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant={code.is_used ? 'destructive' : 'default'}
                              className={
                                code.is_used 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-green-600 text-white'
                              }
                            >
                              {code.is_used ? 'Used' : 'Available'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-400">
                            Created: {new Date(code.created_at).toLocaleDateString()}
                            {code.is_used && code.used_at && (
                              <span className="ml-4">
                                Used: {new Date(code.used_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(code.code)}
                          variant="ghost"
                          size="sm"
                          className="ml-4"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {codes.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        No redeem codes generated yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>

          <TabsContent value="generator">
            <CodeGenerator />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
