export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json().catch(() => ({}));
    const apiKey = (data.api_key || "").trim() || env.GROQ_API_KEY || "";
    const model = (data.model || "").trim() || env.GROQ_MODEL || "qwen/qwen3.8-27b";
    let baseUrl = (data.base_url || "").trim();

    if (!baseUrl) {
      if (apiKey.startsWith("nvapi-")) {
        baseUrl = "https://integrate.api.nvidia.com/v1";
      } else {
        baseUrl = "https://api.groq.com/openai/v1";
      }
    }

    if (!apiKey) {
      return new Response(JSON.stringify({
        status: "error",
        error_type: "AuthError",
        message: "No API Key provided. Configure GROQ_API_KEY in Cloudflare Pages or paste in modal."
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    let messages = data.messages;
    if (!messages) {
      if (data.image) {
        messages = [{
          role: "user",
          content: [
            { type: "text", text: data.prompt || "Analyze this image and describe what you observe." },
            { type: "image_url", image_url: { url: data.image } }
          ]
        }];
      } else {
        messages = [{
          role: "user",
          content: data.prompt || "Hello! Confirm you are running on Cloudflare Edge."
        }];
      }
    }

    const t0 = Date.now();
    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

    const apiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: parseFloat(data.temperature ?? 0.7),
        max_tokens: parseInt(data.max_tokens ?? 256)
      })
    });

    const resJson = await apiRes.json();
    const durationMs = Math.round(Date.now() - t0);

    if (!apiRes.ok) {
      return new Response(JSON.stringify({
        status: "error",
        error_type: "UpstreamError",
        message: resJson.error?.message || JSON.stringify(resJson),
        duration_ms: durationMs
      }), {
        status: apiRes.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const rawContent = resJson.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({
      status: "success",
      model: model,
      content: rawContent.trim(),
      usage: resJson.usage || {},
      duration_ms: durationMs
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      error_type: err.name,
      message: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
