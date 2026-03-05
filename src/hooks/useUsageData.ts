
import { useState, useEffect } from "react";
import { api } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";

export interface UsageData {
  current_count: number;
  daily_limit: number;
  plan: string;
  remaining: number;
}

interface UsageState {
  loading: boolean;
  usage: {
    image_generation?: UsageData | null;
    image_analysis?: UsageData | null;
    video_analysis?: UsageData | null;
  };
  error: string | null;
}

// Helper function to validate UsageData
function isUsageData(obj: any): obj is UsageData {
  return (
    obj &&
    typeof obj === "object" &&
    obj.success === true && // must indicate success
    typeof obj.current_count === "number" &&
    typeof obj.daily_limit === "number" &&
    typeof obj.plan === "string" &&
    typeof obj.remaining === "number"
  );
}

// Helper to check for error shape { success: false, message: string }
function isErrorObject(obj: any): obj is { success: false; message: string } {
  return (
    obj &&
    typeof obj === "object" &&
    obj.success === false &&
    typeof obj.message === "string"
  );
}

export function useUsageData() {
  const { user } = useAuth();
  const [state, setState] = useState<UsageState>({
    loading: true,
    usage: {},
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ loading: false, usage: {}, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true }));

    const fetchUsage = async () => {
      try {
        const features = ["image_generation", "image_analysis", "video_analysis"];
        const usage: UsageState["usage"] = {};
        let anyError: string | null = null;

        for (const feature of features) {
          try {
            const data = await api.post("/usage/get", {
              userId: user.id,
              featureType: feature,
            });
            if (isUsageData(data)) {
              const { current_count, daily_limit, plan, remaining } = data;
              usage[feature as keyof UsageState["usage"]] = {
                current_count,
                daily_limit,
                plan,
                remaining,
              };
            } else if (isErrorObject(data)) {
              usage[feature as keyof UsageState["usage"]] = null;
              anyError = String(data.message);
            } else {
              usage[feature as keyof UsageState["usage"]] = null;
              anyError = "Unexpected usage data shape or empty response";
            }
          } catch (error: any) {
            usage[feature as keyof UsageState["usage"]] = null;
            anyError = error?.message || "Unknown error";
          }
        }

        setState({ loading: false, usage, error: anyError });
      } catch (err: any) {
        setState({ loading: false, usage: {}, error: err.message || "Unknown error" });
      }
    };

    fetchUsage();
  }, [user]);

  return state;
}
