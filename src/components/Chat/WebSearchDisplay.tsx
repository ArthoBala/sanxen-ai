import { Globe, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WebSearchDisplayProps {
  searchResults: string;
  isVisible: boolean;
}

export function WebSearchDisplay({ searchResults, isVisible }: WebSearchDisplayProps) {
  if (!isVisible || !searchResults) return null;

  const parseSearchResults = (results: string) => {
    const sections: { title: string; content: string; url?: string }[] = [];
    const lines = results.split('\n').filter(line => line.trim());
    
    let currentSection: { title: string; content: string; url?: string } | null = null;
    
    lines.forEach(line => {
      if (line.startsWith('**') && line.endsWith('**:')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/\*\*/g, '').replace(':', ''),
          content: '',
        };
      } else if (line.startsWith('**') && line.includes('**:')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const [title, ...contentParts] = line.split('**:');
        currentSection = {
          title: title.replace(/\*\*/g, ''),
          content: contentParts.join('').trim(),
        };
        if (currentSection.content.startsWith('http')) {
          currentSection.url = currentSection.content;
        }
      } else if (currentSection) {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const sections = parseSearchResults(searchResults);

  return (
    <Card className="p-4 mb-4 bg-muted/30 border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Web Search Results</span>
      </div>
      
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div key={index} className="space-y-1">
            <div className="font-medium text-sm text-foreground">{section.title}</div>
            <div className="text-sm text-muted-foreground">
              {section.url ? (
                <a 
                  href={section.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {section.content || section.url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                section.content
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}