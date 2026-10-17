# ProfitLens AI | Hackathon Demo Video Script
**Target duration: 2 minutes**

## Scene 1: The Problem (0:00–0:12)

**Visual:** Show scattered receipts, invoices, and a small-business dashboard.

**Narrator 1:**

"Small shop owners deal with sales, expenses, and inventory every day, but their records can be scattered and difficult to analyze. We built ProfitLens AI to turn everyday business data into clearer decisions."

## Scene 2: Introducing ProfitLens AI (0:12–0:22)

**Visual:** Show the logo, dashboard, and key metrics.

**Narrator 1:**

"ProfitLens AI is an AI-powered business intelligence assistant that helps small shop owners understand their business without needing advanced analytics skills."

## Scene 3: Upload and Analyze (0:22–0:35)

**Visual:** Upload a supported receipt or invoice. Show processing and the extracted information.

**Narrator 2:**

"Users upload supported business documents, and our processing pipeline extracts relevant information and organizes it for analysis."

## Scene 4: Business Insights (0:35–0:47)

**Visual:** Show sales and expense charts, profit metrics, and product insights.

**Narrator 2:**

"The dashboard brings sales, expenses, profit trends, and product performance together. When enough data is available, it can also help identify potential inventory issues."

## Scene 5: AI Chat Assistant (0:47–0:58)

**Visual:** Ask, "Which day had the lowest profit?" Show the actual answer and supporting figures.

**Narrator 1:**

"Users can ask business questions in natural language and get answers based on their available data, making business analytics easier and more accessible."

## Scene 6: AMD GPU Integration and Live Inference (0:58–1:48)

### Shot 1: Verify the GPU (0:58–1:04)

**Visual:** Run `rocm-smi` on the AMD ROCm environment. Show the GPU model and available telemetry.

**Voiceover:**

"Our inference server runs in an AMD ROCm environment. We begin by checking the GPU and its current state."

### Shot 2: Load the Model (1:04–1:11)

**Visual:** Show actual vLLM startup logs, the Qwen3-4B model loading, and the server starting on port 8000.

**Voiceover:**

"We serve Qwen3-4B using vLLM, providing an API endpoint for language model inference."

### Shot 3: Trigger Business Analysis (1:11–1:20)

**Visual:** Select a shop and click Analyze. Show the request and the resulting report.

**Voiceover:**

"Next, we trigger a business health analysis from ProfitLens AI and show the resulting report."

### Shot 4: Show GPU Activity (1:20–1:28)

**Visual:** Show actual GPU telemetry captured during inference. If available, compare baseline and active readings.

**Voiceover:**

"We inspect live GPU telemetry to demonstrate hardware activity during the inference workflow."

### Shot 5: Test the Model API (1:28–1:40)

**Visual:** Run a real request against `localhost:8000/v1/chat/completions`. Show the model identifier and generated response.

**Voiceover:**

"We also call the model's chat completions API directly and verify that Qwen3-4B returns a response."

### Shot 6: Connect the Evidence (1:40–1:48)

**Visual:** Show the business report beside the inference logs or GPU telemetry.

**Voiceover:**

"This brings together our application workflow, model inference, and AMD GPU infrastructure."

## Scene 7: Closing (1:48–2:00)

**Visual:** Return to the dashboard, logo, and tagline.

**Narrator 1:**

"ProfitLens AI turns scattered business records into actionable insights. Less guesswork. More insight."

**On-screen text:**

**PROFITLENS AI**

Upload. Understand. Improve.