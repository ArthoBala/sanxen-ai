
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Gift } from 'lucide-react';

interface RedeemResponse {
  success: boolean;
  message: string;
  plan?: string;
}

interface RedeemCodeFormProps {
  onPlanUpdated?: () => void;
}

export function RedeemCodeForm({ onPlanUpdated }: RedeemCodeFormProps) {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const redeemCode = async () => {
    if (!user || !code.trim()) return;

    setIsRedeeming(true);
    toast({
      title: 'Not implemented',
      description: 'Redeem code is disabled in this build',
      variant: 'destructive',
    });
    setIsRedeeming(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Gift className="w-5 h-5" />
          Redeem Code
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter a redeem code to upgrade your plan and get timed subscription access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="redeem-code" className="text-foreground">Redeem Code</Label>
          <Input
            id="redeem-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your redeem code"
            className="bg-input border-border text-foreground"
          />
        </div>
        <Button
          onClick={redeemCode}
          disabled={isRedeeming || !code.trim()}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
        </Button>
      </CardContent>
    </Card>
  );
}
