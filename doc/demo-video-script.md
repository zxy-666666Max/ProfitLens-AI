# Demo Video Script — ProfitLens-AI Shop Health Checker

Target length: 3:00–3:30. Record at 1920x1080, 30fps. Screen recorder: OBS Studio.
All narration lines are in English (matches the submission language).
If recording time is tight, cut Scene 3 (API detail) and Scene 6 (CSV import) —
Scene 7 (AMD GPU story) is THE key scene and must NOT be cut.

## Pre-recording checklist (do all of these BEFORE hitting Record)

1. Local app running: `npm run dev` in D:\Projects\ProfitLens-AI, open at http://localhost:3000.
2. Register a REAL non-demo account beforehand (clean localStorage, fresh login on camera).
   This account is used for the personal-flow scenes (register → upload → report → inventory → chat).
3. LLM engine wired (if the AMD instance is live): `.env` has VLLM_BASE_URL + VLLM_MODEL, and
   `/api/health` shows `"mode": "llm"`. If the instance is down, record with mock engine and say
   "rule-based engine" instead of "GPU-accelerated LLM".
4. AMD terminal tab open: SSH/Jupyter terminal on the Anrui instance with two panes ready:
   - Pane A: `rocm-smi` (leave it running live).
   - Pane B: `tail -f /workspace/vllm_server.log` (or the vLLM startup log from boot).
5. Close all personal browser tabs. Dark theme everywhere for a clean look.
6. Demo account logged out for now (Scene 2 uses the test-shops dropdown; re-login as demo there).
7. Have ready on desktop: two receipt PNG files (<10MB each) and one products CSV
   (columns: name, price, stock, sold30d).

## Scene-by-scene script

### Scene 1 — Problem (0:00–0:20)
- VISUAL: plain slide or the README hero. Text on screen: "Small e-commerce sellers have no data team."
- NARRATION: "Millions of small online sellers drown in raw metrics — prices, reviews, refund
  rates — with no data team to tell them what it all means. Is my shop healthy, or quietly dying?"
- SHOT: static slide. One click transition, nothing fancy.

### Scene 2 — Product intro + dashboard walkthrough (0:20–1:00)
- VISUAL: the live dashboard at localhost:3000, demo account, test-shops dropdown.
- NARRATION: "This is ProfitLens-AI, a Shop Health Checker. Pick a shop from the dropdown and
  get a full health report in seconds."
- SHOTS:
  1. (3s) Full page, cursor moves to the shop dropdown.
  2. (5s) Select a shop. Report card renders: overall score ring, verdict badge (healthy / watch / critical).
  3. (8s) Scroll slowly through the six dimension bars: price, reviews, sales trend, listings,
     service, activity. Let each bar animate in.
  4. (8s) Scroll to the summary paragraph and the recommendation list. Highlight the text with
     the mouse as you read it.
- NARRATION over shots 3–4: "Six weighted dimensions — price competitiveness, review quality
  and volume, sales trend, listing completeness, service, and activity — each scored 0 to 100
  against the shop's own data."

### Scene 3 — Under the hood: the API call (1:00–1:15) [OPTIONAL, cut if short on time]
- VISUAL: split screen — browser DevTools Network tab on the left, dashboard on the right.
- SHOT: click the dropdown again, show the POST /api/report request payload (the ShopData JSON)
  and the response (HealthReport with engine field).
- NARRATION: "One POST to /api/report sends the shop's raw metrics; the response is a
  structured health report."

### Scene 4 — Your own shop: register, upload, report (1:15–1:55)
- VISUAL: back to localhost:3000, now as a fresh user.
- NARRATION: "Every seller can bring their own shop. Register an account, upload a couple of
  receipts, and the report is yours."
- SHOTS (in this exact order):
  1. (8s) Register page: type email + shop name + password (use the pre-created throwaway
     credentials — never a real password on camera). Submit, land on the dashboard.
  2. (5s) Click "Upload" in the nav. Show the tips list briefly.
  3. (8s) Drag the two receipt PNGs onto the dropzone. File list appears. Click
     "Upload receipts". Wait for "2 receipts uploaded." and the "View your health report" link.
  4. (8s) Click the link — the health report renders for this account's own shop.
- OVERLAY on shot 4: "Each account sees only its own shop — data stays in the browser,
  nothing shared."
- NARRATION over shots 3–4: "Receipts are uploaded and the account's own shop data is saved —
  each account only ever sees its own shop."

### Scene 5 — Inventory insights (1:55–2:30)
- VISUAL: same registered account, now on the /inventory page.
- NARRATION: "Beyond the report, ProfitLens ranks what to reorder."
- SHOTS:
  1. (6s) Add a product manually through the form (type name, price, stock, sold30d, submit).
  2. (5s) Click "Import CSV", pick the products CSV. Show "Imported N product(s)." note.
  3. (6s) Show the four metric cards: Products, Units in stock, Needs reorder, Slow movers.
  4. (10s) Click through the filter chips: All → Needs reorder → Slow movers → Best sellers.
     Let the status badges show: Out of stock (red), Reorder soon (amber), Slow mover (blue),
     Healthy (green).
- OVERLAY on shot 4: "Days-left estimate per product."
- NARRATION over shot 4: "Every product gets a days-left estimate and a status — so restocking
  decisions take seconds, not spreadsheets."

### Scene 6 — Chat with your shop (2:30–2:50)
- VISUAL: same account, chat page.
- NARRATION: "And you can just ask."
- SHOTS:
  1. (10s) Type: "Which products should I reorder first, and why?" Send. Let the answer stream in.
     Then ask: "What's my weakest dimension?" Show that answer too.
- OVERLAY: "Engine: LLM" (or "rule-based" if recording with the mock engine).
- NARRATION: "Answers are grounded in your shop's own numbers — reorder order, weak dimensions,
  pricing — not generic advice."

### Scene 7 — The AMD GPU story (2:50–3:20) — THE KEY SCENE, do not cut
- VISUAL: switch to the AMD Anrui terminal tab.
- NARRATION: "The natural-language layer runs on an AMD Radeon Pro W7900D on ROCm, served by
  vLLM — fully self-hosted, no external API."
- SHOTS (in this exact order):
  1. (5s) Pane A: `rocm-smi` running live. Point out GPU utilization and VRAM with the cursor.
     Text overlay: "AMD Radeon Pro W7900D · ROCm".
  2. (6s) Pane B: scroll up through the vLLM startup log — model loading lines and
     "Uvicorn running on http://0.0.0.0:8000".
  3. (8s) Back to the dashboard/chat, send a message. Then IMMEDIATELY cut back to rocm-smi
     for 3 seconds — GPU spikes. (Record this take 2–3 times if needed; pick the take with
     the visible spike.)
  4. (8s) Show a raw curl to http://<instance>:8000/v1/chat/completions returning the model's
     answer, then cut back to the dashboard chat showing the same output. Text overlay:
     "Qwen3-4B via vLLM, OpenAI-compatible API".
- NARRATION over shots 3–4: "Every chat answer is generated live by Qwen3-4B running on the
  AMD GPU. When the GPU endpoint is unavailable, the app transparently falls back to a built-in
  rule-based engine — same scores, degraded prose — so it never breaks."

### Scene 8 — Architecture + results (3:20–3:40)
- VISUAL: architecture diagram slide (copy from README) + grading results slide.
- NARRATION: "Next.js frontend, a scoring API implementing a published rubric, and a
  self-hosted LLM on AMD ROCm. Our scorer matches the organizer's answer key on all ten
  test shops."
- SHOTS: one slide showing the architecture, then one showing the 10/10 grading result
  from `npx tsx scripts/grade.ts`.

### Scene 9 — Close (3:40–3:50)
- VISUAL: final slide — repo URL + team + "Built on AMD".
- NARRATION: "ProfitLens-AI — shop health analysis on AMD. Repo link below. Thanks for watching."

## Recording tips

- Mouse: slow and deliberate, never fast-flick.
- Pause 1s before every click so editors have cut points.
- Scenes 4, 5 and 6 must be recorded in ONE continuous session with the same registered
  account — the inventory and chat build on that account's data.
- Register the account BEFORE recording (throwaway password). Never type a real password on camera.
- If the GPU spike in Scene 7 shot 3 is not visible (vLLM caches), run one warm-up chat
  completion beforehand, then idle the GPU 60s before recording so the new request shows a
  fresh spike.
- Total file under 100MB for the lablab.ai upload; if over, export at CRF 23.
