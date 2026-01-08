// frontend/chat_widget.js
const toggle = document.getElementById("yoiai-toggle");
const chatbox = document.getElementById("yoiai-chatbox");
const input = document.getElementById("yoiai-input");
const send = document.getElementById("yoiai-send");
const messages = document.getElementById("yoiai-messages");
const close = document.getElementById("yoiai-close");

// Track current language preference and session
let currentLanguage = "auto";
let sessionId = localStorage.getItem("yoi_session_id") || null;

toggle.onclick = () => {
  chatbox.classList.toggle("hidden");
  toggle.style.display = chatbox.classList.contains("hidden") ? "block" : "none";
  if (!chatbox.classList.contains("hidden")) {
    addMessage("bot", "👋 Hi! I'm YOI Bot. I'm here to help you.");
  }
};

close.onclick = () => {
  chatbox.classList.add("hidden");
  toggle.style.display = "block";
};

send.onclick = sendMessage;
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  addMessage("user", text);
  input.value = "";

  const loader = addTypingIndicator();
  try {
    const res = await fetch("http://127.0.0.1:8080/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        language: currentLanguage,
        session_id: sessionId
      }),
    });
    const data = await res.json();
    removeTypingIndicator(loader);

    // Update language preference if backend returns a language
    if (data.language) {
      currentLanguage = data.language;
    }

    // Store session ID for conversation continuity
    if (data.session_id) {
      sessionId = data.session_id;
      localStorage.setItem("yoi_session_id", sessionId);
    }

    addMessage("bot", data.reply);
  } catch (err) {
    removeTypingIndicator(loader);
    addMessage("bot", "⚠️ I'm having trouble connecting — please try again shortly!");
  }
}

function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user" ? "msg user slide-right" : "msg bot slide-left";
  div.innerHTML = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function addTypingIndicator() {
  const loader = document.createElement("div");
  loader.className = "msg bot typing";
  loader.innerHTML = "<span></span><span></span><span></span>";
  messages.appendChild(loader);
  messages.scrollTop = messages.scrollHeight;
  return loader;
}

function removeTypingIndicator(loader) {
  if (loader && loader.parentNode) loader.remove();
}
