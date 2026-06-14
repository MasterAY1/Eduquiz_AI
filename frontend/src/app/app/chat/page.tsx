'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, FileText, Send, User, Bot, Loader2, Cpu } from 'lucide-react';
import { useChatSessions, useChatMessages, useCreateChatSession, useSendMessage } from '@/hooks/useChat';
import { useDocuments } from '@/hooks/useDocuments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: documents } = useDocuments();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data: messages, isLoading: messagesLoading } = useChatMessages(activeSessionId);
  
  const createSession = useCreateChatSession();
  const sendMessage = useSendMessage();

  const [inputMessage, setInputMessage] = useState('');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sendMessage.isPending]);

  // Set the first session as active if none is selected
  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;
    createSession.mutate(
      { title: newSessionTitle, document_id: selectedDocId },
      {
        onSuccess: (newSession) => {
          setActiveSessionId(newSession.id);
          setNewSessionTitle('');
          setSelectedDocId(null);
        },
      }
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSessionId || sendMessage.isPending) return;

    sendMessage.mutate(
      { sessionId: activeSessionId, content: inputMessage },
      {
        onSuccess: () => {
          setInputMessage('');
        },
      }
    );
  };

  return (
    <div className="flex h-full p-4 gap-4 overflow-hidden">
      {/* LEFT SIDEBAR: Sessions List */}
      <Card className="w-80 flex-shrink-0 flex flex-col h-full bg-surface/50 border-white/5 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="font-heading font-bold text-white text-lg">AI Tutor</h2>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-2">
            <Input
              placeholder="New chat title..."
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              className="h-9 text-sm"
            />
            {documents?.items && documents.items.length > 0 && (
              <select
                className="w-full h-9 rounded-lg border border-white/10 bg-black/40 text-sm text-slate-300 px-3 outline-none focus:border-emerald-500/50 transition-colors"
                value={selectedDocId || ''}
                onChange={(e) => setSelectedDocId(e.target.value || null)}
              >
                <option value="">No Document (General Chat)</option>
                {documents.items.filter((d: any) => d.analysis_status === 'indexed').map((doc: any) => (
                  <option key={doc.id} value={doc.id}>
                    📎 {doc.title}
                  </option>
                ))}
              </select>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full h-9 text-sm flex gap-2"
              disabled={!newSessionTitle.trim() || createSession.isPending}
            >
              {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              New Chat
            </Button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessionsLoading ? (
            <div className="p-4 text-center text-slate-400 text-sm">Loading sessions...</div>
          ) : sessions?.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No chat sessions yet.</div>
          ) : (
            sessions?.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={cn(
                  'w-full flex flex-col items-start p-3 rounded-xl transition-all duration-200 border text-left',
                  activeSessionId === session.id
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.2)]'
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'
                )}
              >
                <span className={cn("font-medium text-sm truncate w-full", activeSessionId === session.id ? "text-emerald-400" : "text-white")}>{session.title}</span>
                <div className="flex items-center gap-2 mt-1 w-full">
                  <span className="text-[10px] text-slate-400 truncate">
                    {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                  </span>
                  {session.document_id && (
                    <span className="ml-auto bg-sky-500/20 text-sky-400 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <FileText className="w-2.5 h-2.5" /> RAG
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* RIGHT MAIN AREA: Chat Window */}
      <Card className="flex-1 flex flex-col h-full bg-surface/50 border-white/5 backdrop-blur-md overflow-hidden relative">
        {!activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Cpu className="w-16 h-16 text-slate-500/30" />
            <p>Select a chat or start a new one to speak with the AI Tutor.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
              <div className="flex flex-col">
                <h3 className="font-semibold text-white">
                  {sessions?.find((s) => s.id === activeSessionId)?.title}
                </h3>
                {sessions?.find((s) => s.id === activeSessionId)?.document_id && (
                  <span className="text-xs text-sky-400 flex items-center gap-1 mt-0.5">
                    <FileText className="w-3 h-3" />
                    Bound to Document
                  </span>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messagesLoading && (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages?.map((msg) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-4 max-w-[85%]", isAi ? "mr-auto" : "ml-auto flex-row-reverse")}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg",
                        isAi 
                          ? "bg-gradient-to-br from-emerald-400 to-emerald-600 box-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)]" 
                          : "bg-slate-700 box-shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                      )}>
                        {isAi ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-slate-300" />}
                      </div>
                      <div className={cn(
                        "px-5 py-3 rounded-2xl shadow-lg border",
                        isAi
                          ? "bg-[#1E293B]/80 border-slate-700 text-slate-200"
                          : "bg-emerald-600/20 border-emerald-500/30 text-white"
                      )}>
                        {isAi ? (
                          <div className="prose prose-invert prose-emerald max-w-none text-sm
                            prose-headings:font-heading prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                            prose-p:leading-relaxed prose-p:mb-3
                            prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:text-emerald-300
                            prose-strong:text-white prose-strong:font-semibold
                            prose-code:text-emerald-300 prose-code:bg-emerald-950/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                            prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800
                            prose-ul:my-2 prose-li:my-0.5
                            [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                          ">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <span className="text-[10px] opacity-50 mt-2 block text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Optimistic Pending Message */}
              {sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="px-5 py-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-white shadow-lg">
                    <p className="text-sm whitespace-pre-wrap">{inputMessage}</p>
                    <span className="text-[10px] opacity-50 mt-2 block text-right">Sending...</span>
                  </div>
                </motion.div>
              )}

              {/* Typing Indicator */}
              {sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 max-w-[85%] mr-auto"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="px-5 py-4 rounded-2xl bg-[#1E293B]/80 border border-slate-700 text-slate-200 flex gap-1 items-center shadow-lg">
                    <motion.div className="w-2 h-2 bg-emerald-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-emerald-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-emerald-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <form onSubmit={handleSendMessage} className="flex gap-3 relative">
                <Input
                  className="flex-1 pr-12 bg-surface border-white/10 focus:border-emerald-500/50"
                  placeholder="Ask the AI Tutor a question..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={sendMessage.isPending}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-500 hover:bg-emerald-600"
                  disabled={!inputMessage.trim() || sendMessage.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
