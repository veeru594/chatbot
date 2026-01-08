
import os
import json
import uuid
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv
import traceback

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

DATA_DIR = "app/data"

# ------------------------------
# SESSION MANAGEMENT
# ------------------------------
# In-memory session storage
SESSIONS = {}

def get_or_create_session(session_id=None):
    """Get existing session or create new one"""
    if session_id and session_id in SESSIONS:
        SESSIONS[session_id]["last_active"] = datetime.now().isoformat()
        return session_id, SESSIONS[session_id]
    
    # Create new session
    new_session_id = str(uuid.uuid4())
    SESSIONS[new_session_id] = {
        "history": [],
        "current_language": "en",
        "created_at": datetime.now().isoformat(),
        "last_active": datetime.now().isoformat()
    }
    return new_session_id, SESSIONS[new_session_id]

def add_to_history(session_id, role, content, language):
    """Add message to conversation history"""
    if session_id in SESSIONS:
        SESSIONS[session_id]["history"].append({
            "role": role,
            "content": content,
            "language": language
        })
        SESSIONS[session_id]["current_language"] = language

# ------------------------------
# LOAD DATA
# ------------------------------
def load_data():
    try:
        with open(os.path.join(DATA_DIR, "system_prompt.txt"), "r", encoding="utf-8") as f:
            system_prompt = f.read().strip()
    except:
        system_prompt = "You are YOI AI. Answer ONLY using YOI Media facts."

    try:
        with open(os.path.join(DATA_DIR, "few_shots.json"), "r", encoding="utf-8") as f:
            few_shots = json.load(f)
    except:
        few_shots = []

    try:
        with open(os.path.join(DATA_DIR, "knowledge_base.json"), "r", encoding="utf-8") as f:
            kb = json.load(f)
    except:
        kb = {}

    return system_prompt, few_shots, kb


# ------------------------------
# LLM-BASED INTENT CLASSIFIER
# ------------------------------
def classify_intent(raw_query: str) -> str:
    prompt = f"""
Classify the following query into ONE category from:
[company, services, contact, careers, case_studies, faq, ai_solutions, unknown]

Query: "{raw_query}"

Return ONLY the category name.
"""
    try:
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=5
        )
        category = resp.choices[0].message.content.strip().lower()

        if category in ["company", "services", "contact", "careers", "case_studies", "faq", "ai_solutions"]:
            return category

        return "unknown"

    except:
        return "unknown"


# ------------------------------
# LANGUAGE DETECTION
# ------------------------------
def detect_language(text: str) -> str:
    try:
        prompt = f"""Detect the language of this text. It could be:
- en (English)
- hi (Hindi, including transliterated Hindi in English script)
- te (Telugu, including transliterated Telugu in English script)

Examples:
- "What is YOI?" → en
- "YOI ke bare mein batao" → hi (transliterated Hindi)
- "क्या है YOI?" → hi (native Hindi)
- "yoi gurinchi cheppandi" → te (transliterated Telugu)
- "యోయి గురించి చెప్పండి" → te (native Telugu)
- "yoi maa business ku ela help chestundi" → te (transliterated Telugu)

Text: "{text}"

Respond with ONLY the language code (en, hi, or te):"""
        
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=5
        )
        code = resp.choices[0].message.content.lower().strip()
        return code if code in ("en", "hi", "te") else "en"
    except:
        return "en"


# ------------------------------
# TRANSLATION HELPERS
# ------------------------------
def translate_to_english(text: str, lang: str):
    if lang == "en":
        return text

    lang_names = {"hi": "Hindi", "te": "Telugu"}
    lang_name = lang_names.get(lang, lang)
    
    prompt = f"""Translate this {lang_name} text to English.

IMPORTANT: The text might be written in English script (transliterated) or native script.

Examples:
- "yoi gurinchi cheppandi" (Telugu in English script) → "tell me about yoi"
- "యోయి గురించి చెప్పండి" (Telugu in native script) → "tell me about yoi"
- "yoi ke bare mein batao" (Hindi in English script) → "tell me about yoi"

Text to translate: {text}

Provide ONLY the English translation:"""

    try:
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=200
        )
        return resp.choices[0].message.content.strip()
    except:
        return text


def translate_from_english(text: str, lang: str):
    if lang == "en":
        return text

    lang_names = {"hi": "Hindi", "te": "Telugu"}
    lang_name = lang_names.get(lang, lang)
    
    prompt = f"""Translate this English text into {lang_name}.

IMPORTANT:
- Use NATIVE {lang_name} script (Devanagari for Hindi, Telugu script for Telugu)
- Do NOT use English/Latin script (no transliteration)
- Keep it natural and conversational
- Maintain the meaning and tone

Examples:
- English: "Tell me about YOI" → Telugu: "యోయి గురించి చెప్పండి" (NOT "yoi gurinchi cheppandi")
- English: "How can you help?" → Hindi: "आप कैसे मदद कर सकते हैं?" (NOT "aap kaise madad kar sakte hain?")

English text: {text}

Provide ONLY the {lang_name} translation in native script:"""

    try:
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=250
        )
        return resp.choices[0].message.content.strip()
    except:
        return text


# ------------------------------
# FALLBACKS
# ------------------------------
FALLBACKS = {
    "en": "Sorry, I didn't understand that. Could you rephrase?",
    "hi": "क्षमा करें, मैं समझ नहीं पाया। कृपया दोबारा बताएँ।",
    "te": "క్షమించండి, అర్థం కాలేదు. కొంచెం వివరంగా చెప్పండి."
}


# ------------------------------
# BUILD CONTEXT FROM KB
# ------------------------------
def build_kb_context(intent: str, kb: dict) -> str:
    """Build context string from knowledge base for the given intent"""
    if intent not in kb:
        return ""
    
    kb_data = kb[intent]
    context = f"\n\n=== Relevant YOI Media Information ===\n"
    context += json.dumps(kb_data, indent=2, ensure_ascii=False)
    context += "\n=== End of Information ===\n\n"
    context += "Use the above information to answer naturally and conversationally. Don't just dump the data - have a real conversation."
    
    return context


# ------------------------------
# MAIN LLM HANDLER
# ------------------------------
def call_llm(raw_query: str, requested_language: str = "auto", session_id: str = None):
    try:
        system_prompt, few_shots, kb = load_data()

        # Get or create session
        session_id, session = get_or_create_session(session_id)

        # Detect language of current message
        detected_lang = detect_language(raw_query)
        target_lang = detected_lang if requested_language == "auto" else requested_language

        # Translate query to English for processing
        english_query = translate_to_english(raw_query, detected_lang)

        # Classify intent
        intent = classify_intent(english_query)

        # Build KB context if relevant
        kb_context = build_kb_context(intent, kb)

        # Build conversation messages for LLM
        messages = [{"role": "system", "content": system_prompt + kb_context}]

        # Add few-shot examples (only on first message)
        if len(session["history"]) == 0:
            for pair in few_shots[:3]:  # Use only first 3 examples to save tokens
                messages.append({"role": "user", "content": pair["user"]})
                messages.append({"role": "assistant", "content": pair["assistant"]})

        # Add conversation history (translated to English for consistency)
        for msg in session["history"]:
            content = msg["content"]
            # If message was in different language, translate to English
            if msg["language"] != "en":
                content = translate_to_english(content, msg["language"])
            
            messages.append({
                "role": msg["role"],
                "content": content
            })

        # Add current user message
        messages.append({"role": "user", "content": english_query})

        # Call LLM with higher temperature for creativity
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,  # Increased from 0.2 for more creative responses
            max_tokens=400
        )

        answer_en = resp.choices[0].message.content.strip()

        # Translate response to target language
        final_reply = translate_from_english(answer_en, target_lang)

        # Add to conversation history
        add_to_history(session_id, "user", raw_query, detected_lang)
        add_to_history(session_id, "assistant", final_reply, target_lang)

        return {
            "reply": final_reply,
            "language": target_lang,
            "session_id": session_id
        }

    except Exception:
        traceback.print_exc()
        return {
            "reply": FALLBACKS.get(requested_language, FALLBACKS["en"]),
            "language": requested_language if requested_language != "auto" else "en",
            "session_id": session_id
        }
