import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users, Crown, RotateCcw } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  created_at: string;
  is_admin?: boolean;
}

export function UserManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if current user is the super admin
  const isSuperAdmin = user?.email === 'arthobala383@gmail.com';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setUsers([]);
    setLoading(false);
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    setActionLoading(`plan-${userId}`);
    toast({ title: 'Not implemented', description: 'User plan update disabled', variant: 'destructive' });
    setActionLoading(null);
  };

  const resetUserUsage = async (userId: string, featureType?: string) => {
    setActionLoading(`reset-${userId}`);
    toast({ title: 'Not implemented', description: 'Reset usage disabled', variant: 'destructive' });
    setActionLoading(null);
  };

  const toggleAdminRole = async (userId: string, makeAdmin: boolean) => {
    setActionLoading(`admin-${userId}`);
    toast({ title: 'Not implemented', description: 'Admin role toggle disabled', variant: 'destructive' });
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5" />
          User Management ({users.length})
        </CardTitle>
        <CardDescription>
          Manage user plans, usage limits, and admin roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600">
                <TableHead className="text-gray-300">User</TableHead>
                <TableHead className="text-gray-300">Plan</TableHead>
                <TableHead className="text-gray-300">Role</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-gray-600">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-white">
                        {user.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.plan || 'free'}
                      onValueChange={(value) => updateUserPlan(user.id, value)}
                      disabled={actionLoading === `plan-${user.id}`}
                    >
                      <SelectTrigger className="w-24 bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="plus">Plus</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.is_admin && (
                        <Badge className="bg-yellow-600 text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, !user.is_admin)}
                          disabled={actionLoading === `admin-${user.id}`}
                          className="text-xs"
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetUserUsage(user.id)}
                        disabled={actionLoading === `reset-${user.id}`}
                        className="text-orange-400 hover:text-orange-300"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset Usage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
