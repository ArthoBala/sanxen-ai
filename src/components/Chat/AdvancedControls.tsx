import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Brain, Search, Settings2, X } from 'lucide-react';

interface AdvancedControlsProps {
  enableReasoning: boolean;
  enableSearch: boolean;
  onReasoningToggle: (enabled: boolean) => void;
  onSearchToggle: (enabled: boolean) => void;
}

export function AdvancedControls({ 
  enableReasoning, 
  enableSearch, 
  onReasoningToggle, 
  onSearchToggle 
}: AdvancedControlsProps) {
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="relative">
      {showControls ? (
        <div className="flex flex-col space-y-3 p-4 bg-muted/50 rounded-xl border border-border animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Advanced AI Features
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowControls(false)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-primary" />
                <Label htmlFor="reasoning-toggle" className="text-sm">
                  Advanced Reasoning
                </Label>
              </div>
              <Switch
                id="reasoning-toggle"
                checked={enableReasoning}
                onCheckedChange={onReasoningToggle}
              />
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Use OpenAI's o3-mini for step-by-step logical analysis
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-primary" />
                <Label htmlFor="search-toggle" className="text-sm">
                  Deep Web Search
                </Label>
              </div>
              <Switch
                id="search-toggle"
                checked={enableSearch}
                onCheckedChange={onSearchToggle}
              />
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Search the web for the latest information and insights
            </p>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setShowControls(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings2 className="w-4 h-4" />
          AI Features
          {(enableReasoning || enableSearch) && (
            <div className="flex gap-1">
              {enableReasoning && <Brain className="w-3 h-3 text-primary" />}
              {enableSearch && <Search className="w-3 h-3 text-primary" />}
            </div>
          )}
        </Button>
      )}
    </div>
  );
}