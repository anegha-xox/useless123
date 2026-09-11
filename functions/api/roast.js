export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json().catch(() => ({}));
    const emotion = (data.emotion || "neutral").toLowerCase();
    const intensity = data.intensity || "sarcastic";
    const apiKey = (data.api_key || "").trim() || env.GROQ_API_KEY || "";
    const model = (data.model || "").trim() || env.GROQ_MODEL || "qwen/qwen3.8-27b";
    let baseUrl = (data.base_url || "").trim() || "https://api.groq.com/openai/v1";

    if (!apiKey) {
      const LOCAL_ROASTS = {
        mock: [
          "That smile is about as convincing as a three-dollar bill.",
          "Congratulations, you look like a stock photo of mild regret.",
          "Did you practice that expression, or did it happen by tragic accident?"
        ],
        guilt: [
          "Smiling while the world burns? Bold strategy.",
          "You look happy. What a deeply suspicious development.",
          "Enjoy that dopamine hit. It's the last one you're getting today."
        ],
        neutral: [
          "Your face has the emotional range of a damp washcloth.",
          "Fascinating. A human screensaver.",
          "Blink twice if you're experiencing a buffering error."
        ]
      };
      const cat = emotion.includes("happy") ? "guilt" : (emotion.includes("neutral") ? "neutral" : "mock");
      const list = LOCAL_ROASTS[cat] || LOCAL_ROASTS.mock;
      const roast = list[Math.floor(Math.random() * list.length)];

      return new Response(JSON.stringify({
        status: "success",
        roast: roast,
        emotion: emotion,
        intensity: intensity,
        source: "local-fallback"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const prompt = `You are The Gaslight Mirror, a theatrical, satirical, sarcastic AI webcam mirror. ` +
      `The user's primary detected facial expression is: '${emotion}'. ` +
      `Roast intensity level: '${intensity}'. ` +
      `Generate an unhinged, sharp, biting 1-2 sentence roast specifically mocking their exact face, emotion, or life choices. ` +
      `Do not include quotes or filler intro. Respond with ONLY the roast text itself.`;

    const endpoint = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl.replace(/\/+$/, "")}/chat/completions`;

    const apiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85,
        max_tokens: 128
      })
    });

    const resJson = await apiRes.json();
    let roastText = resJson.choices?.[0]?.message?.content || "";
    roastText = roastText.replace(/^["'\s]+|["'\s]+$/g, "").trim();

    return new Response(JSON.stringify({
      status: "success",
      roast: roastText,
      emotion: emotion,
      intensity: intensity
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
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
