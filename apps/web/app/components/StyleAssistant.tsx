'use client';

import { MessageCircle, Mic, Send, Sparkles, Volume2, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getApiBaseUrl } from '../lib/api';
import { formatCurrency } from '../lib/utils';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number | null;
  isTrending?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  category?: { name?: string | null };
  theme?: { name?: string | null };
  images?: Array<{ url?: string | null }>;
};

type RecentProduct = {
  id: string;
  name: string;
  slug: string;
  image?: string;
  theme?: string;
  category?: string;
};

type ChatMessage = { role: 'user' | 'assistant'; text: string };

const API_BASE = getApiBaseUrl();
const RECENT_KEY = 'flyfree_recent_products';

export function StyleAssistant() {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [answerProducts, setAnswerProducts] = useState<Product[]>([]);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const welcomedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      setRecent(raw ? JSON.parse(raw) : []);
    } catch {
      setRecent([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || messages.length) return;
    setMessages([{ role: 'assistant', text: recent.length
      ? 'Welcome back. Want something similar to what you viewed, or are you shopping for a different mood?'
      : 'Hi, I am your Fly Free style assistant. Tell me what you want to wear and I will find a few options.' }]);
  }, [open, messages.length, recent.length]);

  useEffect(() => {
    if (!open) {
      welcomedRef.current = false;
      window.speechSynthesis?.cancel();
      return;
    }
    if (messages.length !== 1 || welcomedRef.current) return;
    welcomedRef.current = true;
    const timer = window.setTimeout(() => speak(messages[0].text), 250);
    return () => window.clearTimeout(timer);
  }, [open, messages]);

  useEffect(() => {
    if (!open || products.length > 0) return;
    let cancelled = false;

    async function loadProducts() {
      const response = await fetch(`${API_BASE}/catalog/products`, { cache: 'no-store' }).catch(() => null);
      if (!response?.ok || cancelled) return;
      const payload = await response.json().catch(() => null);
      const items = Array.isArray(payload) ? payload : payload?.data || [];
      if (!cancelled) setProducts(items.filter((item: Product) => item?.slug).slice(0, 18));
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [open, products.length]);

  const recommended = useMemo(() => {
    const recentThemes = new Set(recent.map((item) => item.theme).filter(Boolean));
    const recentCategories = new Set(recent.map((item) => item.category).filter(Boolean));
    const recentIds = new Set(recent.map((item) => item.id));

    return products
      .filter((product) => !recentIds.has(product.id))
      .sort((a, b) => {
        const aMatch = Number(recentThemes.has(a.theme?.name || '') || recentCategories.has(a.category?.name || ''));
        const bMatch = Number(recentThemes.has(b.theme?.name || '') || recentCategories.has(b.category?.name || ''));
        const aRank = aMatch * 3 + Number(Boolean(a.isTrending)) * 2 + Number(Boolean(a.isFeatured || a.isNewArrival));
        const bRank = bMatch * 3 + Number(Boolean(b.isTrending)) * 2 + Number(Boolean(b.isFeatured || b.isNewArrival));
        return bRank - aRank;
      })
      .slice(0, 4);
  }, [products, recent]);

  function answerQuestion(question: string) {
    const query = question.trim().toLowerCase();
    if (!query) return;
    const searchable = (product: Product) => `${product.name} ${product.category?.name || ''} ${product.theme?.name || ''}`.toLowerCase();
    const terms = query.split(/\s+/).filter((term) => term.length > 2 && !['show', 'find', 'want', 'with', 'for', 'the', 'are'].includes(term));
    const matches = products
      .filter((product) => terms.some((term) => searchable(product).includes(term)))
      .slice(0, 4);
    const picks = matches.length ? matches : recommended.slice(0, 4);
    let text = '';
    let nextQuestions: string[] = [];
    setThinking(true);
    if (query.includes('new') || query.includes('collection') || query.includes('latest')) {
      const newProducts = products.filter((product) => product.isNewArrival || product.isFeatured).slice(0, 3);
      setAnswerProducts(newProducts.length ? newProducts : picks);
      text = newProducts.length ? 'Here are the newest Fly Free picks.' : 'I do not see a new-drop flag yet, but these are the strongest current picks.';
      nextQuestions = ['Show me oversized styles', 'What goes well with this?', 'Help me choose a colour'];
    }
    if (!text && (query.includes('size') || query.includes('fit'))) {
      setAnswerProducts([]);
      text = 'For the best fit, open the product you like and check its size guide before adding it to your cart. If you are between sizes, choose the larger size for a relaxed fit.';
      nextQuestions = ['Show oversized styles', 'Help me choose a colour'];
    } else if (!text && (query.includes('support') || query.includes('help') || query.includes('order') || query.includes('delivery') || query.includes('return'))) {
      setAnswerProducts([]);
      text = 'I can help with products here. For order status, delivery, or returns, open Help & FAQs and we will take you to the right support details.';
      nextQuestions = ['Show me products', 'Open support'];
    } else if (picks.length) {
      setAnswerProducts(picks);
      text = `I found ${picks.length} option${picks.length === 1 ? '' : 's'} that fit that search. I have highlighted them below.`;
      nextQuestions = ['Show more like this', 'Check out the new collection'];
    } else {
      setAnswerProducts([]);
      text = 'Tell me a theme, fit, colour, or mood, like oversized black, anime, racing, or something relaxed.';
      nextQuestions = ['Show oversized styles', 'Show racing styles'];
    }
    setFollowUps(nextQuestions);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: 'user', text: question }, { role: 'assistant', text }]);
      setThinking(false);
      speak(text);
    }, 450);
  }

  function speak(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.lang = 'en-IN';
    utterance.rate = 0.96;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((current) => [...current, { role: 'assistant', text: 'Voice input is not available in this browser. You can type your request below.' }]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInput(transcript);
      answerQuestion(transcript);
      setInput('');
    };
    recognition.start();
  }

  const submitQuestion = (event: React.FormEvent) => {
    event.preventDefault();
    answerQuestion(input);
    setInput('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(144px+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition hover:shadow-[0_18px_42px_rgba(37,99,235,0.36)] md:bottom-6 md:right-6 md:h-14 md:w-14"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-tertiary))' }}
        aria-label="Open style assistant"
      >
        <MessageCircle size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <aside
            className="absolute bottom-0 right-0 flex max-h-[92svh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:bottom-4 md:right-4 md:rounded-2xl"
            style={{ color: 'var(--text-primary)' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b p-4" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <p className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }}>
                  <Sparkles size={14} /> Fly Free assist
                </p>
                <h2 className="mt-1 text-xl font-black">Find your next fit</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border" style={{ borderColor: 'var(--border-color)' }} aria-label="Close assistant">
                <X size={18} />
              </button>
            </div>

            <div className="scrollbar-clean space-y-5 overflow-y-auto p-4">
              <section className="rounded-lg border p-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                <div className="space-y-2">
                  {messages.slice(-4).map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`group max-w-[92%] rounded-lg px-3 py-2 text-sm font-bold ${message.role === 'user' ? 'ml-auto bg-black text-white' : 'bg-white'}`}>
                      <div className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 whitespace-pre-line">{renderAssistantText(message.text)}</span>
                        {message.role === 'assistant' && (
                          <button type="button" onClick={() => speak(message.text)} className="shrink-0 rounded p-1 text-black/45 transition hover:bg-black/5 hover:text-black" aria-label="Play answer aloud" title={speaking ? 'Speaking' : 'Play answer aloud'}>
                            <Volume2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex max-w-[92%] items-center gap-2 rounded-lg bg-white px-3 py-3" aria-live="polite">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-black/45" />
                      <span className="h-2 w-16 animate-pulse rounded-full bg-black/15" />
                      <span className="h-2 w-8 animate-pulse rounded-full bg-black/10" />
                      <span className="ml-1 text-xs font-bold text-black/45">Finding your best match...</span>
                    </div>
                  )}
                </div>
                <form onSubmit={submitQuestion} className="mt-3 flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
                  <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="What are you looking for?" className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" aria-label="Ask the style assistant" />
                  <button type="button" onClick={startVoice} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${listening ? 'bg-coral text-white' : ''}`} style={{ borderColor: 'var(--border-color)' }} aria-label={listening ? 'Listening' : 'Use voice input'} title={listening ? 'Listening' : 'Use voice input'}>
                    <Mic size={16} />
                  </button>
                  <button type="submit" disabled={!input.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white disabled:opacity-40" aria-label="Send question" title="Send question"><Send size={15} /></button>
                </form>
                {(listening || thinking || speaking) && (
                  <div className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide" style={{ color: 'var(--color-primary)' }} aria-live="polite">
                    <span className={`h-2 w-2 rounded-full ${listening ? 'animate-ping bg-coral' : 'animate-pulse bg-black/50'}`} />
                    {listening ? 'Listening to you' : thinking ? 'Thinking about your style' : 'Speaking your answer'}
                  </div>
                )}
              </section>

              <div className="flex flex-wrap gap-2">
                {['What are you looking for?', 'Check out the new collection', 'Show me oversized styles', 'What size should I choose?'].map((prompt) => (
                  <button key={prompt} type="button" onClick={() => answerQuestion(prompt)} className="rounded-full border px-3 py-2 text-xs font-black transition hover:bg-black hover:text-white" style={{ borderColor: 'var(--border-color)' }}>{prompt}</button>
                ))}
              </div>

              {followUps.length > 0 && (
                <section>
                  <p className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Keep exploring</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {followUps.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => answerQuestion(prompt)} className="rounded-full border px-3 py-2 text-xs font-black transition hover:bg-black hover:text-white" style={{ borderColor: 'var(--border-color)' }}>{prompt}</button>
                    ))}
                  </div>
                </section>
              )}

              {answerProducts.length > 0 && (
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Recommended for you</h3>
                    <Link href="/products" onClick={() => setOpen(false)} className="text-xs font-black uppercase" style={{ color: 'var(--color-primary)' }}>View all</Link>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {answerProducts.map((product) => (
                      <div key={product.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-lg border p-2" style={{ borderColor: 'var(--border-color)' }}>
                        <MediaThumb src={product.images?.[0]?.url || undefined} name={product.name} />
                        <span className="min-w-0">
                          <Link href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="block line-clamp-2 text-sm font-black hover:underline">{product.name}</Link>
                          <span className="mt-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{product.theme?.name || product.category?.name || 'Fly Free'} · {formatCurrency(Math.round(Number(product.price || 0) / 100))}</span>
                        </span>
                        <Link href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="rounded border px-2 py-1.5 text-[10px] font-black uppercase" style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}>View</Link>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {recent.length > 0 && (
                <section>
                  <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Recently viewed</h3>
                  <div className="mt-3 grid gap-2">
                    {recent.slice(0, 3).map((item) => (
                      <Link key={item.id} href={`/products/${item.slug}`} onClick={() => setOpen(false)} className="grid grid-cols-[56px_1fr] gap-3 rounded-lg border p-2 transition hover:bg-black/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                        <MediaThumb src={item.image} name={item.name} />
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-sm font-black">{item.name}</span>
                          <span className="mt-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{item.theme || item.category || 'Fly Free'}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-black uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {recent.length ? 'Based on your browsing' : 'Trending picks'}
                </h3>
                <div className="mt-3 grid gap-2">
                  {recommended.length ? recommended.map((product) => (
                    <Link key={product.id} href={`/products/${product.slug}`} onClick={() => setOpen(false)} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-lg border p-2 transition hover:bg-black/[0.02]" style={{ borderColor: 'var(--border-color)' }}>
                      <MediaThumb src={product.images?.[0]?.url || undefined} name={product.name} />
                      <span className="min-w-0">
                        <span className="line-clamp-1 text-sm font-black">{product.name}</span>
                        <span className="mt-1 block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{product.theme?.name || product.category?.name || 'Recommended'}</span>
                      </span>
                      <span className="text-sm font-black" style={{ color: 'var(--color-primary)' }}>{formatCurrency(Math.round(Number(product.price || 0) / 100))}</span>
                    </Link>
                  )) : (
                    <div className="rounded-lg border p-4 text-sm font-bold" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                      Open a few products and I will start building better picks.
                    </div>
                  )}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/products?sort=trending" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-3 text-center text-xs font-black uppercase" style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}>
                  Trending
                </Link>
                <Link href="/help-faq" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-3 text-center text-xs font-black uppercase" style={{ borderColor: 'var(--border-color)', color: 'var(--color-primary)' }}>
                  Need help
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function MediaThumb({ src, name }: { src?: string; name: string }) {
  return (
    <span className="block aspect-[4/5] overflow-hidden rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-lg font-black" style={{ color: 'var(--color-primary)' }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function renderAssistantText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong>
    : part);
}
