import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Zap } from 'lucide-react';

export function CodeGenerator() {
  const [code, setCode] = useState('');
  const [planType, setPlanType] = useState('');
  const [durationType, setDurationType] = useState('days');
  const [durationValue, setDurationValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleGenerate = async () => {
    if (!code || !planType || !durationValue) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    toast({
      title: 'Not implemented',
      description: 'Redeem code generation disabled',
      variant: 'destructive',
    });
    setIsGenerating(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Zap className="w-5 h-5" />
          Generate Redeem Code
        </CardTitle>
        <CardDescription>
          Create custom duration redeem codes for users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <div className="flex gap-2">
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SANXEN123"
                className="bg-input border-border text-foreground"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomCode}
                className="border-border"
              >
                Generate
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="plan-type">Plan Type</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration-type">Duration Type</Label>
            <Select value={durationType} onValueChange={setDurationType}>
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="months">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="duration-value">Duration Value</Label>
            <Input
              id="duration-value"
              type="number"
              value={durationValue}
              onChange={(e) => setDurationValue(e.target.value)}
              placeholder="30"
              className="bg-input border-border text-foreground"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !code || !planType || !durationValue}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isGenerating ? 'Generating...' : 'Generate Redeem Code'}
        </Button>
      </CardContent>
    </Card>
  );
}
