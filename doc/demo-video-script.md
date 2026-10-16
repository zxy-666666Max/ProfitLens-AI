# Demo Video Script — ProfitLens-AI Shop Health Checker

Target length: 2:30–3:00. Record at 1920x1080, 30fps. Screen recorder: OBS Studio.
All narration lines are in English (matches the submission language). If recording time
is tight, cut Scene 3 (API detail) — it is the most optional scene.

## Pre-recording checklist (do all of these BEFORE hitting Record)

1. Local app running: `npm run dev` in D:\Projects\ProfitLens-AI, dashboard open at http://localhost:3000.
2. LLM engine wired (if the AMD instance is live): `.env` has VLLM_BASE_URL + VLLM_MODEL, and `/api/health` shows `"mode": "llm"`. If the instance is down, record with mock engine and say "rule-based engine" instead of "GPU-accelerated LLM".
3. AMD terminal tab open: SSH/Jupyter terminal on the Anrui instance with two panes ready:
   - Pane A: `rocm-smi` (leave it running live).
   - Pane B: `tail -f /workspace/vllm_server.log` (or the vLLM startup log from boot).
4. Close all personal browser tabs. Dark theme everywhere for a clean look.
5. Have the 10-shop dropdown loaded (Abdullah's frontend: shop selector shows the shops from data/test-shops.json).

## Scene-by-scene script

### Scene 1 — Problem (0:00–0:20)
- VISUAL: plain slide or the README hero. Text on screen: "Small e-commerce sellers have no data team."
- NARRATION: "Millions of small online sellers drown in raw metrics — prices, reviews, refund rates — with no data team to tell them what it all means. Is my shop healthy, or quietly dying?"
- SHOT: static slide. One click transition, nothing fancy.

### Scene 2 — Product intro + dashboard walkthrough (0:20–1:00)
- VISUAL: the live dashboard at localhost:3000.
- NARRATION: "This is ProfitLens-AI, a Shop Health Checker. Pick a shop from the dropdown and get a full health report in seconds."
- SHOTS:
  1. (3s) Full page, cursor moves to the shop dropdown.
  2. (5s) Select a shop. Report card renders: overall score ring, verdict badge (healthy / watch / critical).
  3. (8s) Scroll slowly through the six dimension bars: price, reviews, sales trend, listings, service, activity. Let each bar animate in.
  4. (8s) Scroll to the summary paragraph and the recommendation list. Highlight the text with the mouse as you read it.
- NARRATION over shots 3–4: "Six weighted dimensions — price competitiveness, review quality and volume, sales trend, listing completeness, service, and activity — each scored 0 to 100 against the shop's own data."

### Scene 3 — Under the hood: the API call (1:00–1:20) [OPTIONAL, cut if short on time]
- VISUAL: split screen — browser DevTools Network tab on the left, dashboard on the right.
- SHOT: click the dropdown again, show the POST /api/check request payload (the ShopData JSON) and the response (HealthReport with engine field).
- NARRATION: "One POST to /api/check sends the shop's raw metrics; the response is a structured health report."

### Scene 4 — The AMD GPU story (1:20–2:10) — THE KEY SCENE, do not cut
- VISUAL: switch to the AMD Anrui terminal tab.
- NARRATION: "The natural-language layer runs on an AMD Radeon Pro W7900D on ROCm, served by vLLM — fully self-hosted, no external API."
- SHOTS (in this exact order):
  1. (5s) Pane A: `rocm-smi` running live. Point out GPU utilization and VRAM with the cursor. Text overlay: "AMD Radeon Pro W7900D · ROCm".
  2. (6s) Pane B: scroll up through the vLLM startup log — show the model loading lines and "Uvicorn running on http://0.0.0.0:8000".
  3. (8s) Back to the dashboard, click "Analyze". Then IMMEDIATELY cut back to rocm-smi for 3 seconds — GPU spikes. (Record this take 2–3 times if needed; pick the take with the visible spike.)
  4. (8s) Show a raw curl to http://<instance>:8000/v1/chat/completions returning the model's answer, then cut back to the dashboard summary which is the same LLM output. Text overlay: "Qwen3-4B via vLLM, OpenAI-compatible API".
- NARRATION over shots 3–4: "Every report's summary and recommendations are generated live by Qwen3-4B running on the AMD GPU. When the GPU endpoint is unavailable, the app transparently falls back to a built-in rule-based engine — same scores, degraded prose — so it never breaks."

### Scene 5 — Architecture + results (2:10–2:40)
- VISUAL: architecture diagram slide (copy from README) + grading results slide.
- NARRATION: "Next.js frontend, a scoring API implementing a published rubric, and a self-hosted LLM on AMD ROCm. Our scorer matches the organizer's answer key on all ten test shops."
- SHOTS: one slide showing the architecture, then one showing the 10/10 grading result from `npx tsx scripts/grade.ts`.

### Scene 6 — Close (2:40–2:50)
- VISUAL: final slide — repo URL + team + "Built on AMD".
- NARRATION: "ProfitLens-AI — shop health analysis on AMD. Repo link below. Thanks for watching."

## Recording tips

- Mouse: slow and deliberate, never fast-flick.
- Pause 1s before every click so editors have cut points.
- If the GPU spike in Scene 4 shot 3 is not visible (vLLM caches), run one warm-up chat completion beforehand, then idle the GPU 60s before recording so the new request shows a fresh spike.
- Total file under 100MB for the lablab.ai upload; if over, export at CRF 23.
