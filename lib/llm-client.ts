type Part =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string | Part[];
}

function config(vision: boolean) {
  const key = process.env.QWEN_API_KEY;
  const base = process.env.QWEN_BASE_URL;
  if (key && base) {
    return {
      url: `${base.replace(/\/+$/, "")}/chat/completions`,
      headers: { Authorization: `Bearer ${key}` } as Record<string, string>,
      model: vision ? process.env.QWEN_VISION_MODEL : process.env.QWEN_MODEL,
      extra: { enable_thinking: false },
    };
  }
  const vllm = process.env.VLLM_BASE_URL;
  if (vllm) {
    return {
      url: `${vllm.replace(/\/+$/, "")}/v1/chat/completions`,
      headers: {} as Record<string, string>,
      model: vision
        ? (process.env.VLLM_VISION_MODEL ?? process.env.VLLM_MODEL)
        : (process.env.VLLM_MODEL ?? "Qwen/Qwen3-4B"),
      extra: { chat_template_kwargs: { enable_thinking: false } },
    };
  }
  return null;
}

export function llmConfigured(vision = false) {
  return Boolean(config(vision)?.model);
}

export async function chatCompletion(
  messages: LlmMessage[],
  opts: { vision?: boolean; maxTokens?: number; temperature?: number } = {}
): Promise<string | null> {
  const cfg = config(Boolean(opts.vision));
  if (!cfg?.model) return null;

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cfg.headers },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? 700,
        ...cfg.extra,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error("LLM error", res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "";
    return raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim() || null;
  } catch (err) {
    console.error("LLM request failed", err);
    return null;
  }
}