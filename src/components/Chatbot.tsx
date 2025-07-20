'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrainCircuit, Send, Compass, BookOpen, Camera, ArrowLeft } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { getChatbotResponse } from '@/app/actions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';

type ChatbotProps = {
  isOpen: boolean;
  onClose: () => void;
  locationName: string | null;
};

const suggestionChips = [
    { label: "周邊景點", query: "這附近有什麼推薦的景點嗎？", icon: Compass },
    { label: "歷史故事", query: "跟我說一個這裡的歷史故事。", icon: BookOpen },
    { label: "拍照建議", query: "這裡有什麼適合拍照的地點嗎？", icon: Camera },
]

export const Chatbot = ({ isOpen, onClose, locationName }: ChatbotProps) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && locationName) {
      setMessages([
        {
          role: 'bot',
          content: `歡迎來到智能向導！我在這裡為您介紹「${locationName}」的歷史、文化和隱藏景點。有什麼想了解的嗎？`,
          timestamp: new Date().toISOString(),
        }
      ]);
    }
  }, [isOpen, locationName]);

  React.useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (query?: string) => {
    const userQuery = query || input;
    if (!userQuery.trim() || isLoading || !locationName) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: userQuery,
      timestamp: new Date().toISOString(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setIsLoading(true);

    try {
        const historyForAI = currentMessages.map(m => ({
            role: m.role === 'bot' ? 'model' as const : 'user' as const,
            content: m.content
        }));

        // We only want the history for the AI, not the latest user query.
        historyForAI.pop(); 

      const result = await getChatbotResponse({
        locationName,
        history: historyForAI,
        query: userQuery,
      });

      if (result && result.response) {
        const botMessage: ChatMessage = {
          role: 'bot',
          content: result.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        role: 'bot',
        content: '抱歉，我好像遇到了一點問題。請稍後再試一次。',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground p-4">
      <header className="flex items-center justify-between pb-4 border-b border-border">
        <div className='flex items-center gap-3'>
            <Button variant="ghost" size="icon" onClick={onClose}>
                <ArrowLeft />
            </Button>
            <div className="flex items-center gap-3">
            <div className="bg-accent text-accent-foreground p-2 rounded-full">
                <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
                <h2 className="font-headline text-xl font-bold text-primary">AI智能向導</h2>
                <p className="text-sm text-muted-foreground">發現周圍的秘密</p>
            </div>
            </div>
        </div>
      </header>
      
      <ScrollArea className="flex-1 my-4" ref={scrollAreaRef}>
        <div className="px-4 space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={cn("flex items-end gap-2", msg.role === 'user' ? "justify-end" : "justify-start")}>
               {msg.role === 'bot' && <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0" />}
                <div className={cn(
                    "max-w-[80%] rounded-2xl p-3 text-sm",
                    msg.role === 'user' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn("text-xs mt-2", msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true, locale: zhTW })}
                    </p>
                </div>
            </div>
          ))}
           {isLoading && (
             <div className="flex items-end gap-2 justify-start">
               <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0" />
               <div className="max-w-[80%] rounded-2xl p-3 text-sm bg-muted rounded-bl-none">
                 <div className="flex items-center gap-2">
                    <Skeleton className="w-2 h-2 rounded-full animate-bounce delay-0" />
                    <Skeleton className="w-2 h-2 rounded-full animate-bounce delay-150" />
                    <Skeleton className="w-2 h-2 rounded-full animate-bounce delay-300" />
                 </div>
               </div>
             </div>
           )}
        </div>
      </ScrollArea>
      
      <footer className="pt-4 border-t border-border">
        <div className="flex gap-2 mb-3">
            {suggestionChips.map(chip => (
                <Button key={chip.label} variant="outline" size="sm" className="rounded-full gap-2" onClick={() => handleSendMessage(chip.query)} disabled={isLoading}>
                    <chip.icon className="w-4 h-4" />
                    {chip.label}
                </Button>
            ))}
        </div>
        <div className="flex items-center gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="詢問這個區域的任何事情..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button size="icon" onClick={() => handleSendMessage()} disabled={isLoading || !input.trim()}>
            <Send />
          </Button>
        </div>
      </footer>
    </div>
  );
};
