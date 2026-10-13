// GET /api/health - simple probe so the frontend (and us) can see
// whether the backend is running and which engine it will use.

export async function GET() {
  return Response.json({
    status: "ok",
    mode: process.env.VLLM_BASE_URL ? "llm" : "mock",
  });
}
