# app/prompt_engine.py
import json, random
from app.utils import load_json, load_text

def build_prompt(user_query):
    # Load core assets
    kb = load_json("app/data/knowledge_base.json")
    examples = load_json("app/data/few_shots.json")
    system_prompt = load_text("app/data/system_prompt.txt")

    # Select 2 random few-shot examples to prevent overfitting
    sample_examples = random.sample(examples, k=min(2, len(examples)))
    few_shot_text = "\n\n".join(
        [f"User: {ex['user']}\nAssistant: {ex['assistant']}" for ex in sample_examples]
    )

    # Flatten basic company + services info for static grounding
    company_info = f"""
    Company: {kb['company']['name']}
    Tagline: {kb['company']['tagline']}
    Location: {kb['company']['location']}
    Email: {kb['company']['email']}
    Services: {', '.join(kb['services'].keys())}
    """

    # Final merged prompt
    final_prompt = f"""
{system_prompt}

Context:
{company_info}

Few-shot examples:
{few_shot_text}

User: {user_query}
Assistant:
"""
    return final_prompt
