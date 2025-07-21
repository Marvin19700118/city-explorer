
'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { SendHorizonal, Bot, User, Sparkles } from 'lucide-react';
import type { Message } from '@/lib/types';
import { getChatbotResponse } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


type ChatbotProps = {
  isOpen: boolean;
  onClose: () => void;
  locationName: string | null;
};

const suggestedPrompts = [
    "這裡有什麼好吃的？",
    "推薦一些拍照景點",
    "介紹一下這裡的歷史",
    "有沒有什麼有趣的小知識？",
];

export const Chatbot = ({ isOpen, onClose, locationName }: ChatbotProps) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && locationName) {
      setMessages([
        {
          role: 'model',
          content: `你好！我是你的在地導遊「城市探險家」。我們現在在${locationName}，有什麼想問的嗎？`,
        },
      ]);
    } else {
        setMessages([]);
    }
  }, [isOpen, locationName]);

  React.useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
        const scrollableNode = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollableNode) {
            scrollableNode.scrollTo({
                top: scrollableNode.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
  }, [messages]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = (messageContent || input).trim();
    if (!content || !locationName) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyForAI = newMessages.map(({ role, content }) => ({ role, content }));
      
      const response = await getChatbotResponse(locationName, content, historyForAI);
      
      const botMessage: Message = { role: 'model', content: response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
       toast({
        title: "AI 響應錯誤",
        description: "抱歉，我在回答時遇到了問題，請稍後再試。",
        variant: "destructive"
       });
       // remove the user message if AI fails
       setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="top" className="h-[75vh] max-h-[75vh] flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2 font-headline text-primary">
            <Sparkles />
            AI 智能問答
          </SheetTitle>
          <SheetDescription>
            你的在地導遊，目前在 {locationName || '未知地點'}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'model' && (
                  <Avatar className="h-8 w-8 bg-primary/20 text-primary">
                    <AvatarFallback>
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs rounded-lg px-4 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                 {msg.role === 'user' && (
                  <Avatar className="h-8 w-8 bg-accent/80 text-accent-foreground">
                    <AvatarFallback>
                      <User size={20} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8 bg-primary/20 text-primary">
                    <AvatarFallback>
                      <Bot size={20} />
                    </AvatarFallback>
                  </Avatar>
                   <div className="max-w-xs rounded-lg px-4 py-2 text-sm bg-muted flex items-center gap-2">
                       <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-0"></span>
                       <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></span>
                       <span className="w-2 h-2 bg-primary rounded-full animate-pulse delay-300"></span>
                   </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t space-y-2 bg-background">
            <div className="flex flex-wrap gap-2 justify-center">
                {suggestedPrompts.map(prompt => (
                    <Button key={prompt} size="sm" variant="outline" onClick={() => handleSendMessage(prompt)} disabled={isLoading}>
                        {prompt}
                    </Button>
                ))}
            </div>
            <div className="flex items-center gap-2 p-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="在這裡輸入你的問題..."
                disabled={isLoading}
              />
              <Button onClick={() => handleSendMessage()} disabled={!input.trim() || isLoading} size="icon">
                <SendHorizonal />
              </Button>
            </div>
        </div>

      </SheetContent>
    </Sheet>
  );
};
