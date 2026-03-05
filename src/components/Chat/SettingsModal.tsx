
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageDisplay } from './UsageDisplay';
import { RedeemCodeForm } from '../Admin/RedeemCodeForm';
import { AdminPanel } from '../Admin/AdminPanel';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Gift, Crown, BarChart3 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const handlePlanUpdated = () => {
    // Refresh the usage display when plan is updated
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl text-foreground">
            <Settings className="w-6 h-6" />
            Settings & Usage
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your account, view usage, and access admin features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <Tabs defaultValue="usage" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary border-border">
              <TabsTrigger value="usage" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <BarChart3 className="w-4 h-4" />
                Usage & Plans
              </TabsTrigger>
              <TabsTrigger value="redeem" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                <Gift className="w-4 h-4" />
                Redeem Code
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  <Crown className="w-4 h-4" />
                  Admin Panel
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="usage" className="space-y-6 mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <UsageDisplay />
                </div>
                
                <div className="space-y-6">
                  <div className="text-sm text-gray-300 space-y-4">
                    <h4 className="font-semibold text-lg text-foreground mb-4">Plan Features</h4>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div className="p-4 bg-secondary rounded-lg border border-border">
                        <div className="font-medium text-foreground mb-2">Free Plan</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>• 5 image generations per day</div>
                          <div>• 10 image analyses per day</div>
                          <div>• 3 video analyses per day</div>
                        </div>
                      </div>
                      <div className="p-4 bg-secondary rounded-lg border border-border">
                        <div className="font-medium text-foreground mb-2">Pro Plan</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>• 10 image generations per day</div>
                          <div>• 20 image analyses per day</div>
                          <div>• 10 video analyses per day</div>
                        </div>
                      </div>
                      <div className="p-4 bg-secondary rounded-lg border border-border">
                        <div className="font-medium text-foreground mb-2">Plus Plan</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>• 20 image generations per day</div>
                          <div>• 30 image analyses per day</div>
                          <div>• 20 video analyses per day</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-4 p-3 bg-secondary rounded border border-border">
                      <strong className="text-foreground">Note:</strong> Smart answers are unlimited for all plans. Usage resets daily at midnight.
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="redeem" className="mt-8">
              <div className="max-w-md mx-auto">
                <RedeemCodeForm onPlanUpdated={handlePlanUpdated} />
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="mt-8">
                <div className="max-h-[60vh] overflow-y-auto">
                  <AdminPanel />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
