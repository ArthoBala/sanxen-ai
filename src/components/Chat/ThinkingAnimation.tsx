
interface ThinkingAnimationProps {
  className?: string;
}

export function ThinkingAnimation({ className = "" }: ThinkingAnimationProps) {
  return (
    <div className={`flex justify-start w-full ${className}`}>
      <div className="flex items-start gap-3 max-w-[85%]">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/80 to-purple-600/80 shadow-lg shadow-blue-500/20 flex items-center justify-center">
          <span className="text-white text-xs font-medium">AI</span>
        </div>
        <div className="px-4 py-3 rounded-3xl border border-border/50 bg-gradient-to-br from-muted/70 via-muted/40 to-muted/70 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '120ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '240ms' }}></div>
            </div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Thinking</span>
          </div>
        </div>
      </div>
    </div>
  );
}
