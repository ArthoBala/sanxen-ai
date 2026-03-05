import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const parseMarkdown = (text: string) => {
    const elements: (string | React.ReactElement)[] = [];
    let i = 0;
    let current = '';
    let elementKey = Math.random().toString(36).substr(2, 9);

    const getNextKey = () => {
      elementKey = Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      return elementKey;
    };

    const flushText = () => {
      if (current) {
        elements.push(current);
        current = '';
      }
    };

    const isEscaped = (pos: number) => {
      let backslashes = 0;
      let checkPos = pos - 1;
      while (checkPos >= 0 && text[checkPos] === '\\') {
        backslashes++;
        checkPos--;
      }
      return backslashes % 2 === 1;
    };

    // Process the text line by line for block-level elements
    const lines = text.split('\n');
    let lineIndex = 0;
    
    while (lineIndex < lines.length) {
      let line = lines[lineIndex];
      
      // Handle headings (# ## ### #### ##### ######)
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushText();
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const sizeClasses = [
          'text-3xl font-bold',
          'text-2xl font-bold',
          'text-xl font-semibold',
          'text-lg font-semibold',
          'text-base font-medium',
          'text-sm font-medium'
        ];
        elements.push(
          <h1 key={getNextKey()} className={`${sizeClasses[level - 1]} text-zinc-100 mt-6 mb-3`}>
            {parseInlineMarkdown(headingText)}
          </h1>
        );
        lineIndex++;
        continue;
      }
      
      // Handle blockquotes (> text)
      if (line.startsWith('> ')) {
        flushText();
        const quoteLines: string[] = [];
        while (lineIndex < lines.length && lines[lineIndex].startsWith('> ')) {
          quoteLines.push(lines[lineIndex].substring(2));
          lineIndex++;
        }
        elements.push(
          <blockquote key={getNextKey()} className="border-l-4 border-zinc-500 pl-4 py-2 my-4 bg-zinc-800/50 rounded-r-lg">
            <div className="text-zinc-300 italic">
              {parseInlineMarkdown(quoteLines.join('\n'))}
            </div>
          </blockquote>
        );
        continue;
      }
      
      // Handle unordered lists (- or * item)
      if (line.match(/^[-*]\s/) || line.match(/^\s+[-*]\s/)) {
        flushText();
        const listItems: { content: string; level: number }[] = [];
        
        while (lineIndex < lines.length && (lines[lineIndex].match(/^[-*]\s/) || lines[lineIndex].match(/^\s+[-*]\s/) || lines[lineIndex].trim() === '')) {
          if (lines[lineIndex].trim() !== '') {
            const match = lines[lineIndex].match(/^(\s*)[-*]\s(.+)$/);
            if (match) {
              const level = Math.floor(match[1].length / 2);
              listItems.push({ content: match[2], level });
            }
          }
          lineIndex++;
        }
        
        if (listItems.length > 0) {
          elements.push(
            <ul key={getNextKey()} className="list-disc list-inside space-y-1 my-3 ml-4">
              {listItems.map((item, idx) => (
                <li key={`${getNextKey()}-${idx}`} className="text-zinc-200" style={{ marginLeft: `${item.level * 1}rem` }}>
                  {parseInlineMarkdown(item.content)}
                </li>
              ))}
            </ul>
          );
        }
        continue;
      }
      
      // Handle ordered lists (1. 2. 3. item)
      if (line.match(/^\d+\.\s/)) {
        flushText();
        const listItems: { content: string; num: number }[] = [];
        
        while (lineIndex < lines.length && (lines[lineIndex].match(/^\d+\.\s/) || lines[lineIndex].trim() === '')) {
          if (lines[lineIndex].trim() !== '') {
            const match = lines[lineIndex].match(/^(\d+)\.\s(.+)$/);
            if (match) {
              listItems.push({ content: match[2], num: parseInt(match[1]) });
            }
          }
          lineIndex++;
        }
        
        if (listItems.length > 0) {
          elements.push(
            <ol key={getNextKey()} className="list-decimal list-inside space-y-1 my-3 ml-4">
              {listItems.map((item, idx) => (
                <li key={`${getNextKey()}-${idx}`} className="text-zinc-200">
                  {parseInlineMarkdown(item.content)}
                </li>
              ))}
            </ol>
          );
        }
        continue;
      }
      
      // Handle tables
      if (line.includes('|')) {
        const tableLines: string[] = [];
        while (lineIndex < lines.length && lines[lineIndex].includes('|')) {
          tableLines.push(lines[lineIndex]);
          lineIndex++;
        }
        
        if (tableLines.length >= 2) {
          // Check if second line is separator (---|---|---)
          const isSeparator = tableLines[1].replace(/[^-|]/g, '').length > 0;
          
          if (isSeparator) {
            const headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);
            const rows = tableLines.slice(2).map(row => 
              row.split('|').map(cell => cell.trim()).filter(cell => cell)
            );
            
            elements.push(
              <div key={getNextKey()} className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-zinc-600">
                  <thead>
                    <tr className="bg-zinc-800">
                      {headers.map((header, idx) => (
                        <th key={idx} className="border border-zinc-600 px-4 py-2 text-left text-zinc-200 font-semibold">
                          {parseInlineMarkdown(header)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="border border-zinc-600 px-4 py-2 text-zinc-300">
                            {parseInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }
        }
      }
      
      // Handle horizontal rule (--- or *** or ___)
      if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        flushText();
        elements.push(<hr key={getNextKey()} className="my-6 border-zinc-600" />);
        lineIndex++;
        continue;
      }
      
      // Handle code blocks ```
      if (line.startsWith('```')) {
        flushText();
        const language = line.substring(3).trim();
        const codeLines: string[] = [];
        lineIndex++;
        
        while (lineIndex < lines.length && !lines[lineIndex].startsWith('```')) {
          codeLines.push(lines[lineIndex]);
          lineIndex++;
        }
        
        const code = codeLines.join('\n');
        elements.push(
          <div key={getNextKey()} className="my-4 group">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
              <div className="flex justify-between items-center px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                <span className="text-zinc-400 text-xs font-medium">
                  {language || 'Code'}
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="text-zinc-400 hover:text-white text-xs px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded-md transition-colors duration-200"
                >
                  Copy
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-cyan-300 text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
                  {code}
                </pre>
              </div>
            </div>
          </div>
        );
        lineIndex++; // Skip the closing ```
        continue;
      }
      
      // Process inline elements for regular text
      if (line.trim() !== '') {
        flushText();
        elements.push(<p key={getNextKey()} className="text-zinc-200 my-2">{parseInlineMarkdown(line)}</p>);
      } else {
        // Empty line - add spacing
        if (elements.length > 0 && lineIndex < lines.length - 1) {
          elements.push(<div key={getNextKey()} className="h-2" />);
        }
      }
      
      lineIndex++;
    }

    flushText();
    return elements;
  };
  
  // Parse inline markdown (bold, italic, links, inline code, etc.)
  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    let i = 0;
    let current = '';
    let elementKey = Math.random().toString(36).substr(2, 9);

    const getNextKey = () => {
      elementKey = Math.random().toString(36).substr(2, 9) + '-' + Date.now();
      return elementKey;
    };

    const flushText = () => {
      if (current) {
        result.push(current);
        current = '';
      }
    };

    const isEscaped = (pos: number) => {
      let backslashes = 0;
      let checkPos = pos - 1;
      while (checkPos >= 0 && text[checkPos] === '\\') {
        backslashes++;
        checkPos--;
      }
      return backslashes % 2 === 1;
    };

    while (i < text.length) {
      // Handle inline code `
      if (text[i] === '`' && !isEscaped(i)) {
        flushText();
        const start = i + 1;
        let end = start;
        
        while (end < text.length && (text[end] !== '`' || isEscaped(end))) {
          end++;
        }
        
        if (end < text.length) {
          const code = text.substring(start, end);
          result.push(
            <code key={getNextKey()} className="bg-zinc-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-sm border border-zinc-600">
              {code}
            </code>
          );
          i = end + 1;
          continue;
        }
      }

      // Handle links [text](url)
      if (text[i] === '[' && !isEscaped(i)) {
        const linkMatch = text.substring(i).match(/^\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          flushText();
          const linkText = linkMatch[1];
          const linkUrl = linkMatch[2];
          result.push(
            <a key={getNextKey()} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
              {linkText}
            </a>
          );
          i += linkMatch[0].length;
          continue;
        }
      }

      // Handle ***bold italic***
      if (text.substring(i, i + 3) === '***' && !isEscaped(i)) {
        flushText();
        const start = i + 3;
        const end = text.indexOf('***', start);
        
        if (end !== -1 && !isEscaped(end)) {
          const content = text.substring(start, end);
          result.push(
            <strong key={getNextKey()} className="font-bold">
              <em className="italic text-yellow-200">{parseInlineMarkdown(content)}</em>
            </strong>
          );
          i = end + 3;
          continue;
        }
      }

      // Handle **bold**
      if (text.substring(i, i + 2) === '**' && !isEscaped(i)) {
        flushText();
        const start = i + 2;
        const end = text.indexOf('**', start);
        
        if (end !== -1 && !isEscaped(end)) {
          const content = text.substring(start, end);
          result.push(
            <strong key={getNextKey()} className="font-bold text-yellow-200">
              {parseInlineMarkdown(content)}
            </strong>
          );
          i = end + 2;
          continue;
        }
      }

      // Handle *italic*
      if (text[i] === '*' && !isEscaped(i) && text.substring(i, i + 2) !== '**') {
        flushText();
        const start = i + 1;
        let end = start;
        
        while (end < text.length) {
          if (text[end] === '*' && !isEscaped(end) && text.substring(end, end + 2) !== '**') {
            break;
          }
          end++;
        }
        
        if (end < text.length) {
          const content = text.substring(start, end);
          result.push(
            <em key={getNextKey()} className="italic text-blue-200">
              {parseInlineMarkdown(content)}
            </em>
          );
          i = end + 1;
          continue;
        }
      }

      // Handle __bold__
      if (text.substring(i, i + 2) === '__' && !isEscaped(i)) {
        flushText();
        const start = i + 2;
        const end = text.indexOf('__', start);
        
        if (end !== -1 && !isEscaped(end)) {
          const content = text.substring(start, end);
          result.push(
            <strong key={getNextKey()} className="font-bold text-yellow-200">
              {parseInlineMarkdown(content)}
            </strong>
          );
          i = end + 2;
          continue;
        }
      }

      // Handle _italic_
      if (text[i] === '_' && !isEscaped(i) && text.substring(i, i + 2) !== '__') {
        flushText();
        const start = i + 1;
        let end = start;
        
        while (end < text.length) {
          if (text[end] === '_' && !isEscaped(end) && text.substring(end, end + 2) !== '__') {
            break;
          }
          end++;
        }
        
        if (end < text.length) {
          const content = text.substring(start, end);
          result.push(
            <em key={getNextKey()} className="italic text-blue-200">
              {parseInlineMarkdown(content)}
            </em>
          );
          i = end + 1;
          continue;
        }
      }

      // Handle ~~strikethrough~~
      if (text.substring(i, i + 2) === '~~' && !isEscaped(i)) {
        flushText();
        const start = i + 2;
        const end = text.indexOf('~~', start);
        
        if (end !== -1 && !isEscaped(end)) {
          const content = text.substring(start, end);
          result.push(
            <span key={getNextKey()} className="line-through text-gray-400">
              {parseInlineMarkdown(content)}
            </span>
          );
          i = end + 2;
          continue;
        }
      }

      // Handle escaped characters
      if (text[i] === '\\' && i + 1 < text.length) {
        const nextChar = text[i + 1];
        if (['*', '_', '~', '`', '\\', '!', '@', '#', '$', '%', '^', '&', '(', ')', '<', '>', '[', ']'].includes(nextChar)) {
          current += nextChar;
          i += 2;
          continue;
        }
      }

      // Regular character
      current += text[i];
      i++;
    }

    flushText();
    return result;
  };

  return (
    <div className="message-content space-y-1">
      {parseMarkdown(content)}
    </div>
  );
}