
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Code, 
  PenTool, 
  Camera, 
  BookOpen, 
  Zap,
  Sparkles,
  Heart,
  Coffee,
  Rocket
} from "lucide-react";

interface ExamplesModalProps {
  open: boolean;
  onClose: () => void;
}

const exampleCategories = [
  {
    title: "Creative Writing",
    icon: PenTool,
    color: "from-purple-500 to-pink-500",
    examples: [
      "Write a short story about a time traveler who gets stuck in the Renaissance",
      "Create a poem about the beauty of coding at midnight",
      "Draft a letter from a future version of myself",
      "Write a dialogue between AI and humanity"
    ]
  },
  {
    title: "Code & Programming",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    examples: [
      "Explain recursion using a real-world analogy",
      "Create a simple Python script for organizing files",
      "What are the best practices for React component optimization?",
      "Help me debug this JavaScript function"
    ]
  },
  {
    title: "Image Generation",
    icon: Camera,
    color: "from-green-500 to-emerald-500",
    examples: [
      "A cyberpunk city at sunset with neon lights reflecting on wet streets",
      "A peaceful meadow with wildflowers and a gentle stream",
      "A steampunk workshop filled with brass gears and inventions",
      "A cozy coffee shop on a rainy day with warm lighting"
    ]
  },
  {
    title: "Learning & Education",
    icon: BookOpen,
    color: "from-orange-500 to-red-500",
    examples: [
      "Explain quantum physics in simple terms",
      "What are the main causes of climate change?",
      "Teach me about the history of artificial intelligence",
      "How does photosynthesis work?"
    ]
  },
  {
    title: "Creative Ideas",
    icon: Lightbulb,
    color: "from-yellow-500 to-orange-500",
    examples: [
      "Give me 10 unique app ideas for productivity",
      "What are some creative ways to reduce plastic waste?",
      "Help me plan a themed birthday party",
      "Suggest improvements for my morning routine"
    ]
  },
  {
    title: "Fun & Entertainment",
    icon: Sparkles,
    color: "from-pink-500 to-purple-500",
    examples: [
      "Tell me a joke about programming",
      "Create a riddle for me to solve",
      "What would happen if gravity suddenly reversed?",
      "Write a movie plot in exactly 50 words"
    ]
  }
];

export function ExamplesModal({ open, onClose }: ExamplesModalProps) {
  const handleExampleClick = (example: string) => {
    // Copy to clipboard for easy use
    navigator.clipboard.writeText(example);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-gradient-to-br from-slate-900/95 to-blue-900/95 backdrop-blur-lg text-white border border-blue-500/30 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-6 border-b border-blue-400/20">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-sky-200 to-blue-200 bg-clip-text text-transparent flex items-center gap-3">
            <Rocket className="w-6 h-6 text-sky-400" />
            Explore Examples
            <Coffee className="w-5 h-5 text-yellow-400 ml-2" />
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-8 py-4">
            {exampleCategories.map((category, categoryIndex) => {
              const IconComponent = category.icon;
              return (
                <div key={categoryIndex} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-3xl bg-gradient-to-r ${category.color} shadow-lg`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {category.title}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.examples.map((example, exampleIndex) => (
                      <Button
                        key={exampleIndex}
                        variant="ghost"
                        className="h-auto p-4 text-left justify-start bg-gradient-to-r from-slate-800/40 to-slate-700/40 hover:from-slate-700/60 hover:to-slate-600/60 border border-slate-600/30 hover:border-slate-500/50 rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                        onClick={() => handleExampleClick(example)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <Heart className="w-4 h-4 text-pink-400 mt-1 group-hover:text-pink-300 transition-colors flex-shrink-0" />
                          <span className="text-slate-200 group-hover:text-white transition-colors text-sm leading-relaxed">
                            {example}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
            
            <div className="text-center py-6 border-t border-slate-600/30 rounded-3xl">
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Click any example to copy it to your clipboard!</span>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
