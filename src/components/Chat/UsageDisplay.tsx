
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Image, Video, Sparkles } from 'lucide-react';

interface UsageData {
  current_count: number;
  daily_limit: number;
  plan: string;
  remaining: number;
}

// Helper to check if data is valid usage response
function isValidUsageData(data: any): data is UsageData & { success: true } {
  return (
    data &&
    typeof data === "object" &&
    data.success === true &&
    typeof data.current_count === "number" &&
    typeof data.daily_limit === "number" &&
    typeof data.plan === "string" &&
    typeof data.remaining === "number"
  );
}

export function UsageDisplay() {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState<{
    image_generation?: UsageData;
    image_analysis?: UsageData;
    video_analysis?: UsageData;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const features = ['image_generation', 'image_analysis', 'video_analysis'];
      const usagePromises = features.map(async (feature) => {
        try {
          const data = await api.post('/usage/get', {
            userId: user.id,
            featureType: feature
          });
          return { feature, data };
        } catch (error) {
          console.error(`Error fetching ${feature} usage:`, error);
          return { feature, data: null };
        }
      });

      const results = await Promise.all(usagePromises);
      const newUsageData: any = {};
      
      results.forEach(({ feature, data }) => {
        if (isValidUsageData(data)) {
          newUsageData[feature] = {
            current_count: data.current_count,
            daily_limit: data.daily_limit,
            plan: data.plan,
            remaining: data.remaining,
          };
        }
      });

      setUsageData(newUsageData);
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'pro': return 'bg-blue-500';
      case 'plus': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'pro': return 'bg-blue-600 text-blue-100';
      case 'plus': return 'bg-purple-600 text-purple-100';
      default: return 'bg-gray-600 text-gray-100';
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">Daily Usage</CardTitle>
          {usageData.image_generation && (
            <Badge className="bg-secondary text-secondary-foreground border-0">
              {usageData.image_generation.plan?.toUpperCase() || 'FREE'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div className="mt-2">Loading usage data...</div>
          </div>
        ) : (
          <>
            {usageData.image_generation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Image Generation</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {usageData.image_generation.current_count}/{usageData.image_generation.daily_limit}
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage(
                    usageData.image_generation.current_count, 
                    usageData.image_generation.daily_limit
                  )}
                  className="h-2 bg-secondary"
                />
              </div>
            )}

            {usageData.image_analysis && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Image Analysis</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {usageData.image_analysis.current_count}/{usageData.image_analysis.daily_limit}
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage(
                    usageData.image_analysis.current_count, 
                    usageData.image_analysis.daily_limit
                  )}
                  className="h-2 bg-secondary"
                />
              </div>
            )}

            {usageData.video_analysis && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Video Analysis</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {usageData.video_analysis.current_count}/{usageData.video_analysis.daily_limit}
                  </span>
                </div>
                <Progress 
                  value={getProgressPercentage(
                    usageData.video_analysis.current_count, 
                    usageData.video_analysis.daily_limit
                  )}
                  className="h-2 bg-secondary"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
