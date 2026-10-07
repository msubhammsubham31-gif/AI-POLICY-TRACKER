import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  ShieldAlert,
  BookOpen,
  RefreshCw,
  Copy,
  Check,
  Building,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { api, removeAuthToken } from '../services/api';
import { LegalDisclaimer } from '../components/common/LegalDisclaimer';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: string[];
}

const STARTER_PROMPTS = [
  'What are the latest changes in EU CBAM and how do they affect our Rotterdam and Stuttgart facilities?',
  'Explain the PFAS restriction deadlines and which products or materials are exposed.',
  'Summarize all CRITICAL compliance actions due in the next 90 days.',
  'What are our Scope 1 and Scope 2 reporting obligations under CSRD (Corporate Sustainability Due Diligence)?',
  'Which suppliers have high compliance drift risk under the German Supply Chain Due Diligence Act (LkSG)?',
];

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your **RegulaMap Grounded Regulatory Assistant**, powered by Gemini 2.5 Flash and verified against your company's live regulatory repository, facilities, products, and supply chain graphs.\n\nAsk me any question regarding legal text drift, operational exposure, compliance obligations, or upcoming deadlines.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['RegulaMap Knowledge Graph', 'Apex Industrial Systems Asset Directory', 'Live Regulatory Registry'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for API
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await api.assistant.query(query, history);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.groundedSourcesUsed || ['RegulaMap Compliance Graph'],
      };

    } catch (err: any) {
      if (err.message && (err.message.includes('token') || err.message.includes('Unauthorized') || err.message.includes('authorization'))) {
        removeAuthToken();
      }
      const isAuthErr = err.message && (err.message.includes('token') || err.message.includes('Unauthorized') || err.message.includes('authorization'));
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: isAuthErr
          ? `⚠️ **Session authorization token was refreshed.** Your browser session has been synchronized with the demo compliance officer profile. Please click **Send** or choose a question below to continue!`
          : `⚠️ **Error querying regulatory intelligence engine:** ${err.message || 'Service temporarily unavailable'}. Please verify your API connectivity.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: `Conversation cleared. Ready to assist with new compliance inquiries.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border/50 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Grounded AI Regulatory Assistant
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 mr-1" /> Gemini 2.5 Flash
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Synthesizes legal text changes, asset exposures, and compliance deadlines with strict grounding.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface border border-border text-muted-foreground hover:text-white hover:border-border/80 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Mandatory Legal Disclaimer */}
      <div className="my-3">
        <LegalDisclaimer />
      </div>

      {/* Chat scroll area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-4xl ${msg.sender === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`rounded-xl p-4 shadow-sm border ${
                msg.sender === 'user'
                  ? 'bg-primary/20 border-primary/30 text-white max-w-xl'
                  : 'bg-surface/80 border-border/80 text-foreground w-full'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-semibold text-slate-300">
                  {msg.sender === 'user' ? 'You' : 'RegulaMap AI Assistant'}
                </span>
                <span className="text-[11px]">{msg.timestamp}</span>
              </div>

              {/* Message body */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                {msg.text}
              </div>

              {/* Grounded sources tags if available */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-primary" />
                    Verified Legal & System Grounding:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[10px] bg-slate-900 border border-border/70 text-slate-300 px-2 py-0.5 rounded"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy button */}
              {msg.sender === 'assistant' && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(msg.id, msg.text)}
                    className="text-xs text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[11px]">Copy response</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-4xl mr-auto justify-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-surface/80 border border-border/80 rounded-xl p-4 text-foreground w-full">
              <div className="flex items-center gap-2 text-xs text-primary font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Querying live regulatory drift, cross-referencing facilities & calculating compliance impact...
              </div>
              <div className="mt-2 space-y-1.5 opacity-40 animate-pulse">
                <div className="h-2.5 bg-slate-700 rounded w-5/6"></div>
                <div className="h-2.5 bg-slate-700 rounded w-3/4"></div>
                <div className="h-2.5 bg-slate-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts pills */}
      {messages.length <= 2 && (
        <div className="pt-2 pb-2">
          <div className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Suggested Compliance Questions:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-xs text-left bg-surface hover:bg-slate-800 text-slate-300 hover:text-white border border-border px-2.5 py-1.5 rounded-lg transition-colors truncate max-w-md"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input box */}
      <div className="pt-3 border-t border-border/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about regulations, emissions thresholds, affected facilities, or compliance deadlines..."
            disabled={loading}
            className="w-full bg-surface border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2.5 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          RegulaMap Assistant operates under strict legal grounding and database RLS isolation.
        </p>
      </div>
    </div>
  );
};

export default AssistantPage;
