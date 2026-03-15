'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChatBoxProps {
  tripContext: string;
  destination: string;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy message'}
      className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: `Hi! I'm your travel assistant for this trip. I've read your full itinerary and I'm here to help. You can ask me to:

- **Refine** any part of the itinerary
- **Suggest alternatives** for activities, restaurants, or hotels
- **Answer questions** about the destination
- **Adjust** plans based on your preferences

What would you like to know?`,
};

export function ChatBox({ tripContext, destination }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          tripContext,
        }),
      });

      if (!response.ok || !response.body) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                setMessages(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + delta,
                  };
                  return updated;
                });
              }
            } catch {
              // skip unparseable chunks
            }
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I encountered a network error. Please try again.',
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span aria-hidden="true">💬</span>
          Chat with AI Travel Assistant
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            Ask about {destination}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`relative group max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-500 text-white rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  }`}>
                    {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                      <TypingIndicator />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {msg.content.split('\n').map((line, li) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={li} className="font-semibold">{line.slice(2, -2)}</p>;
                          }
                          if (line.startsWith('- ') || line.startsWith('• ')) {
                            return (
                              <p key={li} className="pl-2">
                                <span aria-hidden="true">• </span>{line.slice(2)}
                              </p>
                            );
                          }
                          // Handle inline **bold** within lines
                          const parts = line.split(/(\*\*[^*]+\*\*)/g);
                          return (
                            <p key={li} className={line === '' ? 'h-2' : ''}>
                              {parts.map((part, pi) =>
                                part.startsWith('**') && part.endsWith('**')
                                  ? <strong key={pi}>{part.slice(2, -2)}</strong>
                                  : part
                              )}
                            </p>
                          );
                        })}
                      </div>
                    )}
                    {msg.content && (
                      <CopyButton text={msg.content} />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t p-4 bg-background">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label htmlFor="chat-input" className="sr-only">
                Message to travel assistant
              </label>
              <Textarea
                id="chat-input"
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your trip... (Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-[120px] resize-none text-sm"
                disabled={isStreaming}
                aria-label="Chat message input"
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="h-11 w-11 bg-sky-500 hover:bg-sky-600 text-white shrink-0 rounded-xl"
              aria-label="Send message"
            >
              {isStreaming ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Shift+Enter for new line
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
