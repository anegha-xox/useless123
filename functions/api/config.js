export async function onRequestGet(context) {
  const env = context.env || {};
  const groqKey = env.GROQ_API_KEY || "";
  const keyPreview = groqKey.length > 12 ? `${groqKey.slice(0, 8)}...${groqKey.slice(-4)}` : (groqKey ? "Configured" : "Not configured");

  return new Response(JSON.stringify({
    status: "success",
    has_key: Boolean(groqKey),
    key_preview: keyPreview,
    provider: "Groq (Cloudflare Edge)",
    default_model: env.GROQ_MODEL || "qwen/qwen3.8-27b",
    default_base_url: "https://api.groq.com/openai/v1",
    recommended_models: [
      { id: "qwen/qwen3.8-27b", provider: "Groq", type: "Fast LLM / Reasoning", recommended: true },
      { id: "openai/gpt-oss-120b", provider: "Groq", type: "High-Intelligence LLM" },
      { id: "meta/llama-3.2-11b-vision-instruct", provider: "NVIDIA NIM", type: "Vision + Text" }
    ]
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
