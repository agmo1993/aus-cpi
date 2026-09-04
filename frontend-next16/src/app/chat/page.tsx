"use client";

/**
 * /chat — Cloudflare Workers AI + Postgres tool prototype
 * Full-height ChatGPT / Claude-style shell under the sticky TopNav.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerParts } from "@/components/chat";
import { cn } from "@/lib/utils";
import type { AnswerPart } from "@/lib/chat/schema";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: AnswerPart[];
  asOfMonth?: string;
  error?: boolean;
}

const SUGGESTED = [
  {
    label: "Latest CPI",
    prompt: "What is the latest headline CPI?",
    description: "Headline monthly inflation and annual change",
  },
  {
    label: "Top movers this month",
    prompt: "What are the top CPI movers this month?",
    description: "Biggest category rises and falls",
  },
  {
    label: "Electricity Sydney",
    prompt: "Show me electricity prices in Sydney",
    description: "City series for electricity costs",
  },
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function AusCpiMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
        className
      )}
      aria-hidden
    >
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}

export default function ChatPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = `${next}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const send = useCallback(
    async (prompt: string) => {
      const text = prompt.trim();
      if (!text || loading) return;

      setErrorBanner(null);
      setInput("");
      const userTurn: ChatTurn = {
        id: newId(),
        role: "user",
        content: text,
      };
      const nextTurns = [...turns, userTurn];
      setTurns(nextTurns);
      setLoading(true);
      scrollToBottom();

      const history = nextTurns.map((t) => ({
        role: t.role,
        content: t.content,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const raw = await res.text();
        let data: {
          prose?: string;
          parts?: AnswerPart[];
          asOfMonth?: string;
          error?: string;
        } | null = null;
        try {
          data = JSON.parse(raw) as {
            prose?: string;
            parts?: AnswerPart[];
            asOfMonth?: string;
            error?: string;
          };
        } catch {
          const timeoutLike =
            res.status === 504 ||
            raw.includes("FUNCTION_INVOCATION_TIMEOUT") ||
            raw.includes("An error occurred");
          const msg = timeoutLike
            ? "That question took too long on the server. Try a simpler ask (one city or one series), or try again."
            : !res.ok
              ? res.status === 503
                ? "Chat is not configured. Add Cloudflare credentials to .env.local."
                : res.status === 502
                  ? "Workers AI error — daily quota may be exhausted."
                  : "Chat request failed."
              : "Chat returned an unexpected response.";
          setErrorBanner(msg);
          setTurns((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              content: msg,
              error: true,
            },
          ]);
          return;
        }

        if (!res.ok) {
          const msg =
            data.error ||
            (res.status === 503
              ? "Chat is not configured. Add Cloudflare credentials to .env.local."
              : res.status === 502
                ? "Workers AI error — daily quota may be exhausted."
                : "Chat request failed.");
          setErrorBanner(msg);
          setTurns((prev) => [
            ...prev,
            {
              id: newId(),
              role: "assistant",
              content: msg,
              error: true,
            },
          ]);
          return;
        }

        setTurns((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: data.prose || "",
            parts: data.parts || [],
            asOfMonth: data.asOfMonth,
          },
        ]);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Network error talking to chat.";
        setErrorBanner(msg);
        setTurns((prev) => [
          ...prev,
          { id: newId(), role: "assistant", content: msg, error: true },
        ]);
      } finally {
        setLoading(false);
        scrollToBottom();
        textareaRef.current?.focus();
      }
    },
    [loading, turns, scrollToBottom]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const empty = turns.length === 0 && !loading;

  return (
    <div className="fixed inset-x-0 bottom-0 top-[72px] z-20 flex flex-col bg-background">
      {/* Thread */}
      <div
        ref={threadRef}
        className="flex-1 overflow-y-auto"
        aria-live="polite"
        aria-busy={loading || undefined}
      >
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-6">
          {errorBanner && (
            <div
              role="alert"
              className="mt-4 shrink-0 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorBanner}
            </div>
          )}

          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" aria-hidden />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ask about Australian CPI
                </h1>
                <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
                  Numbers come from the AusCPI database. AI picks tools and
                  writes short prose — try a suggestion below.
                </p>
              </div>

              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {SUGGESTED.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    disabled={loading}
                    onClick={() => void send(s.prompt)}
                    className={cn(
                      "rounded-2xl border bg-card p-4 text-left shadow-sm transition-colors",
                      "hover:border-primary/30 hover:bg-accent/60",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:pointer-events-none disabled:opacity-50"
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">
                      {s.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 py-6 sm:py-8">
              {turns.map((turn) =>
                turn.role === "user" ? (
                  <div key={turn.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-3xl bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground sm:max-w-[75%]">
                      <p className="whitespace-pre-wrap">{turn.content}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    key={turn.id}
                    className={cn(
                      "flex gap-3",
                      turn.error && "rounded-2xl border border-destructive/30 bg-destructive/5 p-3"
                    )}
                  >
                    <AusCpiMark className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      {turn.asOfMonth && !turn.error && (
                        <p className="mb-1.5 text-xs text-muted-foreground">
                          As of {turn.asOfMonth}
                        </p>
                      )}
                      {turn.content && (
                        <div
                          className={cn(
                            "prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-foreground",
                            turn.error && "text-destructive"
                          )}
                        >
                          {turn.content}
                        </div>
                      )}
                      {turn.parts && <AnswerParts parts={turn.parts} />}
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <AusCpiMark />
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden
                    />
                    Thinking…
                  </span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Sticky composer */}
      <div className="shrink-0 border-t border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <form
          onSubmit={onSubmit}
          className="mx-auto w-full max-w-3xl px-4 pb-4 pt-3 sm:px-6 sm:pb-5"
        >
          <div className="relative flex items-end rounded-3xl border bg-card shadow-[0_0_15px_rgba(0,0,0,0.06)] focus-within:ring-1 focus-within:ring-ring">
            <label htmlFor="chat-message" className="sr-only">
              Chat message
            </label>
            <textarea
              id="chat-message"
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about Australian CPI…"
              disabled={loading}
              rows={1}
              aria-label="Chat message"
              autoComplete="off"
              className={cn(
                "max-h-[200px] min-h-[52px] w-full resize-none bg-transparent",
                "rounded-3xl py-3.5 pl-4 pr-14 text-sm leading-relaxed",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="absolute bottom-2 right-2 h-9 w-9 rounded-full"
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Enter to send · Shift+Enter for a new line
          </p>
        </form>
      </div>
    </div>
  );
}
