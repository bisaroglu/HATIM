import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type FormEvent,
} from 'react'
import axios from 'axios'
import { askAiAssistant } from '@/services/ai.service'

// ─── Tipler ────────────────────────────────────────────────────────────────────

type Role = 'user' | 'ai'

interface Message {
  id:   string
  role: Role
  text: string
}

// ─── İkon bileşenleri (inline SVG — harici bağımlılık yok) ────────────────────

function BotIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2v1h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2z" />
      <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
      <path d="M9 15s1 1.5 3 1.5 3-1.5 3-1.5" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22 11 13 2 9l20-7z" />
    </svg>
  )
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
    </svg>
  )
}

// ─── Yazıyor animasyonu ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="Asistan yanıt hazırlıyor"
      className="flex items-center gap-1 px-1"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gold animate-dot-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

// ─── Tek mesaj balonu ─────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  return (
    <div
      className={[
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row',
      ].join(' ')}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        className={[
          'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-sm',
          isUser
            ? 'bg-gold-dim text-gold-text'
            : 'bg-dark-surface-high text-gold border border-dark-outline dark:bg-dark-surface-high dark:border-dark-outline',
          'bg-slate-100 dark:bg-dark-surface-high',
        ].join(' ')}
      >
        {isUser ? '👤' : <BotIcon className="h-4 w-4" />}
      </div>

      {/* Balonu */}
      <div
        className={[
          'max-w-[75%] rounded-xl px-4 py-3 font-sans text-body-md leading-relaxed',
          isUser
            ? [
                'bg-gold-dim text-gold-text rounded-tr-sm',
                'dark:bg-gold dark:text-gold-text',
              ].join(' ')
            : [
                'bg-slate-100 text-slate-800 rounded-tl-sm',
                'dark:bg-dark-surface dark:text-dark-text dark:border dark:border-dark-outline',
              ].join(' '),
        ].join(' ')}
      >
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
      </div>
    </div>
  )
}

// ─── Boş ekran ────────────────────────────────────────────────────────────────

function EmptyState() {
  const suggestions = [
    'Hatim nedir, nasıl katılabilirim?',
    'Cüz tamamladığımda ne yapmalıyım?',
    'Birden fazla hatimde yer alabilir miyim?',
    'Hatim oluşturmak için giriş yapmam gerekiyor mu?',
  ]

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 py-12 px-4">
      {/* İkon */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-20 w-20 rounded-2xl flex items-center justify-center bg-gold/10 dark:bg-gold/5 border border-gold/20 dark:border-gold/10">
          <BotIcon className="h-10 w-10 text-gold-deep dark:text-gold" />
          <SparkleIcon className="absolute -top-2 -right-2 h-5 w-5 text-gold-dim dark:text-gold animate-dot-pulse" />
        </div>
        <div>
          <h2 className="font-serif text-headline-md text-slate-900 dark:text-dark-text">
            AI Asistanı
          </h2>
          <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted mt-1 max-w-sm">
            Hatim, cüz ve okuma planınız hakkında sorularınızı yanıtlamak için buradayım.
          </p>
        </div>
      </div>

      {/* Öneri kartları */}
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((s) => (
          <SuggestionCard key={s} text={s} />
        ))}
      </div>
    </div>
  )
}

function SuggestionCard({ text, onClick }: { text: string; onClick?: (t: string) => void }) {
  // onClick prop'u dışarıdan enjekte edilecek — EmptyState'den kullanılmıyor
  // ama doğrudan buton olarak tasarlandı
  return (
    <button
      type="button"
      onClick={() => onClick?.(text)}
      className={[
        'text-left px-4 py-3 rounded-lg font-sans text-sm',
        'border border-light-outline dark:border-dark-outline',
        'bg-white dark:bg-dark-surface',
        'text-slate-600 dark:text-dark-text-muted',
        'hover:border-gold/50 hover:text-slate-900 dark:hover:text-dark-text dark:hover:border-gold/40',
        'hover:bg-slate-50 dark:hover:bg-dark-surface-high',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
      ].join(' ')}
    >
      {text}
    </button>
  )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function AiChatPage() {
  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const inputAreaRef    = useRef<HTMLFormElement>(null)

  // Yeni mesaj gelince otomatik kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Textarea auto-resize
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
      resizeTextarea()
    },
    [resizeTextarea],
  )

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      setError(null)
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'

      const userMsg: Message = {
        id:   crypto.randomUUID(),
        role: 'user',
        text: trimmed,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsLoading(true)

      try {
        const reply = await askAiAssistant(trimmed)
        const aiMsg: Message = {
          id:   crypto.randomUUID(),
          role: 'ai',
          text: reply,
        }
        setMessages((prev) => [...prev, aiMsg])
      } catch (err: unknown) {
        // Sunucudan gelen ProblemDetails yanıtı varsa title'ını göster,
        // yoksa jenerik ağ hata mesajına dön.
        if (axios.isAxiosError(err)) {
          const serverTitle = err.response?.data?.title as string | undefined
          setError(serverTitle ?? 'Asistana ulaşılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.')
        } else {
          setError('Asistana ulaşılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.')
        }
      } finally {
        setIsLoading(false)
        // Gönder sonrası input odağını koru
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    },
    [isLoading],
  )

  const handleFormSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      sendMessage(input)
    },
    [input, sendMessage],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage(input)
      }
    },
    [input, sendMessage],
  )

  const handleSuggestionClick = useCallback(
    (text: string) => {
      setInput(text)
      textareaRef.current?.focus()
    },
    [],
  )

  const isEmpty = messages.length === 0

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col">

      {/* ── Sayfa başlığı ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 dark:border-dark-outline bg-white dark:bg-dark-bg sticky top-16 z-30">
        <div className="container py-5 md:py-6">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="h-10 w-10 rounded-lg flex items-center justify-center bg-gold/10 dark:bg-gold/5 border border-gold/20 dark:border-gold/10 flex-shrink-0"
            >
              <BotIcon className="h-5 w-5 text-gold-deep dark:text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text">
                AI Asistanı
              </h1>
              <p className="font-sans text-sm text-slate-500 dark:text-dark-text-muted mt-0.5">
                Gemini AI ile güçlendirilmiş hatim rehberi
              </p>
            </div>

            {/* Temizle butonu */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => { setMessages([]); setError(null) }}
                className={[
                  'ml-auto font-sans text-label-md uppercase tracking-widest',
                  'text-slate-400 dark:text-dark-text-muted/60',
                  'hover:text-slate-700 dark:hover:text-dark-text-muted',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1',
                ].join(' ')}
                aria-label="Sohbeti temizle"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mesaj alanı ───────────────────────────────────────────────────── */}
      <div
        role="log"
        aria-label="Sohbet geçmişi"
        aria-live="polite"
        className="flex-1 overflow-y-auto"
      >
        <div className="container max-w-3xl py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-8 py-8 px-4">
              {/* İkon + başlık */}
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative h-20 w-20 rounded-2xl flex items-center justify-center bg-gold/10 dark:bg-gold/5 border border-gold/20 dark:border-gold/10">
                  <BotIcon className="h-10 w-10 text-gold-deep dark:text-gold" />
                  <SparkleIcon className="absolute -top-2 -right-2 h-5 w-5 text-gold-dim dark:text-gold animate-dot-pulse" />
                </div>
                <div>
                  <h2 className="font-serif text-headline-md text-slate-900 dark:text-dark-text">
                    Nasıl yardımcı olabilirim?
                  </h2>
                  <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted mt-1 max-w-sm">
                    Hatim, cüz ve okuma planınız hakkında sorularınızı yanıtlamak için buradayım.
                  </p>
                </div>
              </div>

              {/* Öneri kartları */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Hatim nedir, nasıl katılabilirim?',
                  'Cüz tamamladığımda ne yapmalıyım?',
                  'Birden fazla hatimde yer alabilir miyim?',
                  'Hatim oluşturmak için giriş yapmam gerekiyor mu?',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className={[
                      'text-left px-4 py-3 rounded-lg font-sans text-sm',
                      'border border-light-outline dark:border-dark-outline',
                      'bg-white dark:bg-dark-surface',
                      'text-slate-600 dark:text-dark-text-muted',
                      'hover:border-gold/50 hover:text-slate-900 dark:hover:text-dark-text dark:hover:border-gold/40',
                      'hover:bg-slate-50 dark:hover:bg-dark-surface-high',
                      'transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              {/* Yazıyor göstergesi */}
              {isLoading && (
                <div className="flex gap-3 animate-fade-in">
                  <div
                    aria-hidden="true"
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-dark-surface-high border border-light-outline dark:border-dark-outline"
                  >
                    <BotIcon className="h-4 w-4 text-gold-deep dark:text-gold" />
                  </div>
                  <div className="max-w-[75%] rounded-xl rounded-tl-sm px-4 py-3 bg-slate-100 dark:bg-dark-surface dark:border dark:border-dark-outline">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* ── Hata bandı ────────────────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className={[
            'border-t border-red-200 bg-red-50 dark:border-error/30 dark:bg-error/10',
            'px-4 py-3',
          ].join(' ')}
        >
          <div className="container max-w-3xl flex items-start justify-between gap-3">
            <p className="font-sans text-sm text-red-700 dark:text-error">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Hatayı kapat"
              className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-error/60 dark:hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Input alanı ───────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 dark:border-dark-outline bg-white/80 dark:bg-dark-bg/80 backdrop-blur-nav sticky bottom-0 z-20">
        <div className="container max-w-3xl py-4">
          <form
            ref={inputAreaRef}
            onSubmit={handleFormSubmit}
            className={[
              'flex items-end gap-3 rounded-xl px-4 py-3',
              'border border-light-outline dark:border-dark-outline',
              'bg-white dark:bg-dark-surface',
              'transition-all duration-150',
              'focus-within:border-gold/60 dark:focus-within:border-gold/40',
              'focus-within:shadow-gold-glow dark:focus-within:shadow-none',
            ].join(' ')}
          >
            <label htmlFor="ai-input" className="sr-only">Mesajınızı yazın</label>
            <textarea
              ref={textareaRef}
              id="ai-input"
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Bir şeyler sorun…"
              autoComplete="off"
              className={[
                'flex-1 resize-none bg-transparent font-sans text-body-md',
                'text-slate-900 dark:text-dark-text',
                'placeholder:text-slate-400 dark:placeholder:text-dark-text-muted/50',
                'focus-visible:outline-none',
                'disabled:opacity-50',
                'leading-relaxed',
              ].join(' ')}
              style={{ maxHeight: '160px' }}
              aria-label="Mesaj girin"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Mesajı gönder"
              className={[
                'flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
                'transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
                'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface',
                input.trim() && !isLoading
                  ? 'bg-gold-dim text-gold-text hover:bg-gold dark:bg-gold dark:text-gold-text dark:hover:bg-gold-light'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-dark-surface-high dark:text-dark-text-muted/40',
              ].join(' ')}
            >
              {isLoading ? (
                <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <SendIcon className="h-4 w-4" />
              )}
            </button>
          </form>

          <p className="font-sans text-label-md text-slate-400 dark:text-dark-text-muted/40 text-center mt-2">
            Enter → gönder &nbsp;·&nbsp; Shift+Enter → yeni satır
          </p>
        </div>
      </div>

    </div>
  )
}
