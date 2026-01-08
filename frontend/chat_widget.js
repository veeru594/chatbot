// YOI AI Chat Widget - Enhanced JavaScript
const toggle = document.getElementById("yoiai-toggle");
const chatbox = document.getElementById("yoiai-chatbox");
const input = document.getElementById("yoiai-input");
const send = document.getElementById("yoiai-send");
const messages = document.getElementById("yoiai-messages");
const close = document.getElementById("yoiai-close");
const quickActions = document.getElementById("yoiai-quick-actions");

// Track current language and session
let currentLanguage = "en";  // Set to English only
let sessionId = localStorage.getItem("yoi_session_id") || null;
let isFirstOpen = true;

// Toggle chat window
toggle.onclick = () => {
  const isHidden = chatbox.classList.contains("hidden");
  chatbox.classList.toggle("hidden");
  toggle.style.display = isHidden ? "none" : "flex";

  // Show welcome message and quick actions on first open
  if (isHidden && isFirstOpen) {
    isFirstOpen = false;
    setTimeout(() => {
      addMessage("bot", "👋 Hi! I'm <strong>YOI Bot</strong>. I'm here to help you learn about YOI Media's services and solutions. How can I assist you today?");
      quickActions.classList.remove("hidden");
    }, 300);
  }
};

// Close chat window
close.onclick = () => {
  chatbox.classList.add("hidden");
  toggle.style.display = "flex";
};

// Send message on button click
send.onclick = sendMessage;

// Send message on Enter key
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Quick action buttons
document.querySelectorAll(".quick-btn").forEach(btn => {
  btn.onclick = () => {
    const message = btn.getAttribute("data-message");
    if (message) {
      input.value = message;
      sendMessage();
      // Hide quick actions after first use
      quickActions.classList.add("hidden");
    }
  };
});

// Main send message function
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  // Add user message
  addMessage("user", text);
  input.value = "";

  // Hide quick actions when user starts chatting
  if (!quickActions.classList.contains("hidden")) {
    quickActions.classList.add("hidden");
  }

  // Show typing indicator
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

    // Add bot response
    addMessage("bot", data.reply);

  } catch (err) {
    removeTypingIndicator(loader);
    addMessage("bot", "⚠️ I'm having trouble connecting right now. Please try again in a moment!");
    console.error("Chat error:", err);
  }
}

// Add message to chat
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.className = sender === "user"
    ? "msg user slide-right"
    : "msg bot slide-left";
  div.innerHTML = text;
  messages.appendChild(div);

  // Smooth scroll to bottom
  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: 'smooth'
  });
}

// Add typing indicator
function addTypingIndicator() {
  const loader = document.createElement("div");
  loader.className = "msg bot typing";
  loader.innerHTML = "<span></span><span></span><span></span>";
  messages.appendChild(loader);

  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: 'smooth'
  });

  return loader;
}

// Remove typing indicator
function removeTypingIndicator(loader) {
  if (loader && loader.parentNode) {
    loader.remove();
  }
}

// Auto-focus input when chat opens
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.target.classList.contains('hidden') === false) {
      setTimeout(() => input.focus(), 100);
    }
  });
});

observer.observe(chatbox, {
  attributes: true,
  attributeFilter: ['class']
});
