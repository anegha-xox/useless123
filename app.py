import os
import json
import random
import time
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

# Default API Configuration (loaded securely from .env or environment)
DEFAULT_GROQ_KEY = os.environ.get("GROQ_API_KEY", "")
DEFAULT_GROQ_MODEL = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")
DEFAULT_GROQ_BASE_URL = "https://api.groq.com/openai/v1"

DEFAULT_NVIDIA_KEY = os.environ.get("NVIDIA_API_KEY", "")
DEFAULT_NVIDIA_MODEL = os.environ.get("NVIDIA_MODEL", "meta/llama-3.2-11b-vision-instruct")
DEFAULT_NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Primary default is user's Groq key and Qwen 3.8 27B
ACTIVE_DEFAULT_KEY = DEFAULT_GROQ_KEY
ACTIVE_DEFAULT_MODEL = DEFAULT_GROQ_MODEL
ACTIVE_DEFAULT_BASE_URL = DEFAULT_GROQ_BASE_URL


def get_client(api_key: str = None, base_url: str = None):
    """Instantiate OpenAI client with auto-detection for Groq or NVIDIA NIM."""
    key = (api_key or "").strip() or ACTIVE_DEFAULT_KEY
    if not key:
        raise ValueError("No API Key provided. Please configure or paste an API Key.")

    if base_url and base_url.strip():
        url = base_url.strip()
    elif key.startswith("gsk_"):
        url = DEFAULT_GROQ_BASE_URL
    elif key.startswith("nvapi-"):
        url = DEFAULT_NVIDIA_BASE_URL
    else:
        url = DEFAULT_GROQ_BASE_URL

    return OpenAI(base_url=url, api_key=key)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/config", methods=["GET"])
def get_config():
    """Returns active configuration without exposing full secrets."""
    key = ACTIVE_DEFAULT_KEY
    key_preview = f"{key[:8]}...{key[-4:]}" if len(key) > 12 else "Configured"
    provider = "Groq" if key.startswith("gsk_") else ("NVIDIA NIM" if key.startswith("nvapi-") else "OpenAI-Compatible")

    return jsonify({
        "status": "success",
        "has_key": bool(key),
        "key_preview": key_preview,
        "provider": provider,
        "default_model": ACTIVE_DEFAULT_MODEL,
        "default_base_url": ACTIVE_DEFAULT_BASE_URL,
        "recommended_models": [
            {"id": "qwen/qwen3.8-27b", "provider": "Groq", "type": "Fast LLM / Reasoning", "recommended": True},
            {"id": "openai/gpt-oss-120b", "provider": "Groq", "type": "High-Intelligence LLM"},
            {"id": "meta/llama-3.2-11b-vision-instruct", "provider": "NVIDIA NIM", "type": "Vision + Text"},
            {"id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", "provider": "NVIDIA NIM", "type": "Reasoning"}
        ]
    })


@app.route("/api/run", methods=["POST"])
def run_model():
    """
    Universal API endpoint to run any model through API.
    Accepts:
      - api_key (str, optional): Passed API key, falls back to Groq/NVIDIA default
      - model (str, optional): Target model id, falls back to ACTIVE_DEFAULT_MODEL
      - base_url (str, optional): Base URL
      - prompt (str, optional): User prompt text
      - image (str, optional): base64 URI or image URL
      - messages (list, optional): Raw messages array
      - temperature (float, optional): Default 0.7
      - max_tokens (int, optional): Default 256
    """
    try:
        data = request.get_json(silent=True) or {}
        api_key = data.get("api_key")
        model = (data.get("model") or "").strip() or ACTIVE_DEFAULT_MODEL
        base_url = data.get("base_url")
        prompt = data.get("prompt", "")
        image_data = data.get("image")
        messages = data.get("messages")
        temperature = float(data.get("temperature", 0.7))
        max_tokens = int(data.get("max_tokens", 256))

        client = get_client(api_key=api_key, base_url=base_url)

        if not messages:
            if image_data:
                content = []
                content.append({"type": "text", "text": prompt.strip() if prompt else "Analyze this image and describe what you observe."})
                content.append({"type": "image_url", "image_url": {"url": image_data}})
                messages = [{"role": "user", "content": content}]
            else:
                messages = [{"role": "user", "content": prompt.strip() if prompt else "Hello! Confirm you are connected and running through the API."}]

        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        duration_ms = round((time.time() - start_time) * 1000, 1)

        raw_content = response.choices[0].message.content or ""

        # Auto-parse JSON if returned
        parsed_json = None
        cleaned = raw_content.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        try:
            parsed_json = json.loads(cleaned)
        except Exception:
            parsed_json = None

        usage_data = {}
        if hasattr(response, "usage") and response.usage:
            usage_data = {
                "prompt_tokens": getattr(response.usage, "prompt_tokens", 0),
                "completion_tokens": getattr(response.usage, "completion_tokens", 0),
                "total_tokens": getattr(response.usage, "total_tokens", 0)
            }

        return jsonify({
            "status": "success",
            "model": model,
            "content": raw_content.strip(),
            "raw_json": parsed_json,
            "usage": usage_data,
            "duration_ms": duration_ms
        })

    except ValueError as ve:
        return jsonify({"status": "error", "error_type": "AuthError", "message": str(ve)}), 401
    except Exception as e:
        print("API Run Error:", str(e))
        return jsonify({"status": "error", "error_type": type(e).__name__, "message": str(e)}), 500


@app.route("/api/roast", methods=["POST"])
def generate_roast():
    """
    Generates dynamic real-time AI roasts for The Gaslight Mirror using Groq API.
    """
    try:
        data = request.get_json(silent=True) or {}
        emotion = (data.get("emotion") or "neutral").lower()
        intensity = data.get("intensity", "sarcastic")
        api_key = data.get("api_key")
        model = (data.get("model") or "").strip() or ACTIVE_DEFAULT_MODEL
        base_url = data.get("base_url")

        client = get_client(api_key=api_key, base_url=base_url)

        prompt = (
            f"You are The Gaslight Mirror, a theatrical, satirical, sarcastic AI webcam mirror. "
            f"The user's primary detected facial expression is: '{emotion}'. "
            f"Roast intensity level: '{intensity}'. "
            f"Generate an unhinged, sharp, biting 1-2 sentence roast specifically mocking their exact face, emotion, or life choices. "
            f"Do not include quotes or filler intro. Respond with ONLY the roast text itself."
        )

        start_time = time.time()
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.85,
            max_tokens=80
        )
        duration_ms = round((time.time() - start_time) * 1000, 1)

        roast_text = (response.choices[0].message.content or "").strip().strip('"').strip("'")

        return jsonify({
            "status": "success",
            "roast": roast_text,
            "emotion": emotion,
            "intensity": intensity,
            "model": model,
            "duration_ms": duration_ms
        })

    except Exception as e:
        print("Roast API Error:", str(e))
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@app.route("/api/analyze-mood", methods=["POST"])
def analyze_mood():
    """Vision-based emotion analyzer fallback."""
    try:
        data = request.get_json(silent=True) or {}
        image_data_url = data.get("image")
        api_key = data.get("api_key") or DEFAULT_NVIDIA_KEY
        model = (data.get("model") or "").strip() or DEFAULT_NVIDIA_MODEL
        base_url = data.get("base_url") or DEFAULT_NVIDIA_BASE_URL

        if not image_data_url:
            return jsonify({"status": "error", "message": "No image provided"}), 400

        client = OpenAI(base_url=base_url, api_key=api_key)

        prompt = (
            "Detect primary facial emotion strictly from ('happy', 'sad', 'angry', 'surprised', 'neutral') "
            "and generate a 1-sentence roast. Respond in JSON: {'emotion': 'happy', 'roast': '...'}"
        )

        response = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_data_url}}
                ]
            }],
            temperature=0.7,
            max_tokens=150
        )

        raw = response.choices[0].message.content.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        parsed = json.loads(raw)
        return jsonify({
            "status": "success",
            "emotion": parsed.get("emotion", "neutral"),
            "roast": parsed.get("roast", "No words.")
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[*] Gaslight Mirror & Groq API Runner starting at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)