'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, X, ShieldCheck, Sparkles } from 'lucide-react';
import { RoadRecord } from '@/lib/roadDatabase';
import { useAuditContext } from '@/context/AuditContext';
import { TRANSLATIONS } from '@/lib/translations';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  matchedRoad?: RoadRecord | null;
  timestamp: string;
}

function parseInlineMarkdown(text: string, isUser: boolean): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong
          key={i}
          className={isUser ? 'font-bold text-white' : 'font-bold text-slate-950'}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className={`font-mono px-1 py-0.5 rounded text-[10px] ${
            isUser ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedMessage({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const bulletText = trimmed.replace(/^[-•*]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5 ml-1">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  isUser ? 'bg-white' : 'bg-blue-600'
                }`}
              />
              <span className="flex-1">{parseInlineMarkdown(bulletText, isUser)}</span>
            </div>
          );
        }
        return (
          <p key={idx}>
            {parseInlineMarkdown(line, isUser)}
          </p>
        );
      })}
    </div>
  );
}

let chatMsgSeq = 0;
function createMsgId(prefix: string) {
  chatMsgSeq += 1;
  return `${prefix}-${chatMsgSeq}`;
}

const SAMPLE_QUESTIONS = [
  'Who was the constructor for SV Road?',
  'Who built Colaba Causeway?',
  'Is Veer Nariman Road under warranty?',
  'Contractor for Shahid Bhagat Singh Marg?',
];

export function ChatbotModal() {
  const { lang } = useAuditContext();
  const t = TRANSLATIONS[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Namaste! I am the **BMC PRAVAH Road Copilot** powered by Mumbai\'s official road audit dataset. Ask me about any road (even with spelling typos like *"who built sv rod"* or *"contractor for colaba causway"*), and I will identify the contractor, ₹0 warranty status, and maintenance record.',
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = lang === 'mr'
    ? [
        'एस. व्ही. रोडचा कंत्राटदार कोण आहे?',
        'कुलाबा कॉजवे कोणी बांधला?',
        'वीर नरिमन रोड वॉरंटीमध्ये आहे का?',
      ]
    : SAMPLE_QUESTIONS;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const currentTimeStr = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());

    const userMsg: ChatMessage = {
      id: createMsgId('usr'),
      role: 'user',
      content: textToSend,
      timestamp: currentTimeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: createMsgId('ai'),
        role: 'assistant',
        content: data.reply || 'No information found for this road.',
        matchedRoad: data.matchedRoad,
        timestamp: currentTimeStr,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createMsgId('ai-err'),
          role: 'assistant',
          content: 'Sorry, I encountered an issue retrieving the road contractor details. Please try again.',
          timestamp: currentTimeStr,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2.5 rounded-full shadow-lg shadow-emerald-950/25 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
          aria-label="Open AI Road Contractor Chatbot"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-tight">{t.askAiBtn}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-stone-950/50 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white p-0.5 shrink-0 border border-stone-700">
                  <Image
                    src="/image.png"
                    alt="BMC Seal"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm text-white">
                      {lang === 'mr' ? 'बीएमसी प्रवाह सहाय्यक' : 'BMC PRAVAH Copilot'}
                    </h3>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                      OFFICIAL
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 block">
                    {lang === 'mr' ? 'मुंबई रस्ता कंत्राटदार व हमी चौकशी' : 'Mumbai Road Contractor & DLP Lookup'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
                aria-label="Close Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Sample Prompts Bar */}
            <div className="bg-stone-100/90 px-3 py-2 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[10px] text-stone-500 font-mono shrink-0">{lang === 'mr' ? 'उदा:' : 'Try:'}</span>
              {sampleQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="whitespace-nowrap text-[10px] bg-white hover:bg-stone-50 text-stone-700 px-3 py-1 rounded-full border border-stone-200 shadow-2xs transition-colors shrink-0 font-medium"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-emerald-800 text-white rounded-br-xs'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs'
                    }`}
                  >
                    <FormattedMessage content={m.content} isUser={m.role === 'user'} />

                    {/* Matched road preview card inside assistant bubble */}
                    {m.matchedRoad && (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 rounded-xl bg-emerald-50/60 p-2.5 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-stone-900">
                          <span>{m.matchedRoad.name}</span>
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                            {t.wardPrefix} {m.matchedRoad.ward_code}
                          </span>
                        </div>
                        <div className="text-stone-600">
                          {t.contractorPrefix}:{' '}
                          <strong className="text-emerald-950">{m.matchedRoad.contractor_name}</strong>
                        </div>
                        {m.matchedRoad.under_dlp && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.dlpActiveBadge}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-stone-400 font-mono mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-stone-500 text-xs p-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-700 animate-ping" />
                  <span>Searching Mumbai road database &amp; audit records...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'mr' ? 'कोणत्याही रस्त्याबद्दल विचारा (उदा. एस. व्ही. रोड)...' : 'Ask who built any road (e.g. who built sv rod)...'}
                className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
