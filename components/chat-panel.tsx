"use client";

import { useEffect, useRef, useState } from "react";
import { sendChat, type ChatMessage } from "@/lib/api";
import type { ShopData } from "@/lib/types";

type Msg = ChatMessage & { engine?: "llm" | "mock" };

const SUGGESTIONS = [
  "How is my shop doing overall?",
  "Why are my sales changing?",
  "What should I fix first?",
  "Is my pricing competitive?",
];

export default function ChatPanel({ shop }: { shop: ShopData }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await sendChat(
        shop,
        next.map(({ role, content }) => ({ role, content }))
      );
      setMessages([...next, { role: "assistant", content: res.reply, engine: res.engine }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry, I couldn't get an answer. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-[420px] flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ask me anything about {shop.name}. Try one of these:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              <div
                className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  m.role === "user"
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "bg-zinc-100 dark:bg-zinc-900"
                }`}
              >
                {m.content}
              </div>
              {m.engine === "mock" && (
                <p className="mt-1 text-xs text-zinc-400">Rule-based answer (AI model not connected)</p>
              )}
            </div>
          </div>
        ))}

        {sending && <p className="text-sm text-zinc-500 dark:text-zinc-400">Thinking...</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-900"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about sales, pricing, reviews..."
          maxLength={1000}
          className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Send
        </button>
      </form>
    </div>
  );
}