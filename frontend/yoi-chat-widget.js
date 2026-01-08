/**
 * YOI AI Chat Widget - Embeddable Script
 * 
 * This script creates an animated chat widget that can be embedded on any website
 * Usage: <script src="yoi-chat-widget.js"></script>
 */

(function () {
    'use strict';

    // Get configuration or use defaults
    const config = window.YOI_CHAT_CONFIG || {
        apiUrl: 'http://127.0.0.1:8080/chat',
        brandColor: '#FF7A00',
        position: 'bottom-right'
    };

    // Inject CSS styles
    const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    /* Widget Container */
    #yoi-chat-widget {
      position: fixed;
      ${config.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
      bottom: 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 999999;
    }
    
    /* Floating Button */
    #yoi-chat-btn {
      background: linear-gradient(135deg, ${config.brandColor} 0%, ${adjustColor(config.brandColor, 20)} 100%);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 16px 24px;
      cursor: pointer;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 8px 32px rgba(255, 122, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: yoi-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      border: none;
      outline: none;
    }
    
    #yoi-chat-btn:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 48px rgba(255, 122, 0, 0.5);
    }
    
    @keyframes yoi-pulse {
      0%, 100% {
        box-shadow: 0 8px 32px rgba(255, 122, 0, 0.4);
      }
      50% {
        box-shadow: 0 8px 32px rgba(255, 122, 0, 0.6), 0 0 0 8px rgba(255, 122, 0, 0.1);
      }
    }
    
    /* Chat Box */
    #yoi-chat-box {
      width: 400px;
      height: 600px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.24);
      display: none;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 16px;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    #yoi-chat-box.yoi-open {
      display: flex;
      animation: yoi-slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes yoi-slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    /* Header */
    #yoi-header {
      background: linear-gradient(135deg, #1A1A1A 0%, #000000 100%);
      color: white;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    #yoi-header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    #yoi-avatar {
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: yoi-avatarBounce 3s ease-in-out infinite;
    }
    
    @keyframes yoi-avatarBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    
    #yoi-title-text {
      font-size: 18px;
      font-weight: 700;
    }
    
    #yoi-subtitle {
      font-size: 13px;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }
    
    .yoi-status-dot {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
      animation: yoi-statusBlink 2s ease-in-out infinite;
    }
    
    @keyframes yoi-statusBlink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    #yoi-close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      color: white;
      font-size: 20px;
      transition: all 0.2s ease;
    }
    
    #yoi-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: rotate(90deg);
    }
    
    /* Messages */
    #yoi-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      background: #F8F9FA;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    #yoi-messages::-webkit-scrollbar {
      width: 6px;
    }
    
    #yoi-messages::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 10px;
    }
    
    .yoi-msg {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      animation: yoi-messageSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes yoi-messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .yoi-msg.yoi-user {
      background: linear-gradient(135deg, ${config.brandColor} 0%, ${adjustColor(config.brandColor, 20)} 100%);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    
    .yoi-msg.yoi-bot {
      background: white;
      color: #1A1A1A;
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      border: 1px solid #E5E7EB;
    }
    
    .yoi-msg.yoi-typing {
      background: white;
      padding: 16px 20px;
      display: flex;
      gap: 6px;
      border: 1px solid #E5E7EB;
    }
    
    .yoi-typing span {
      width: 8px;
      height: 8px;
      background: ${config.brandColor};
      border-radius: 50%;
      animation: yoi-typingBounce 1.4s ease-in-out infinite;
    }
    
    .yoi-typing span:nth-child(2) { animation-delay: 0.2s; }
    .yoi-typing span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes yoi-typingBounce {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.7;
      }
      30% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }
    
    /* Quick Actions */
    #yoi-quick-actions {
      padding: 12px 20px;
      background: white;
      border-top: 1px solid #E5E7EB;
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }
    
    #yoi-quick-actions.yoi-hidden {
      display: none;
    }
    
    .yoi-quick-btn {
      background: #F8F9FA;
      border: 1px solid #E5E7EB;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 13px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    
    .yoi-quick-btn:hover {
      background: ${config.brandColor};
      color: white;
      border-color: ${config.brandColor};
      transform: translateY(-2px);
    }
    
    /* Input Area */
    #yoi-input-area {
      display: flex;
      gap: 8px;
      padding: 16px 20px;
      background: white;
      border-top: 1px solid #E5E7EB;
    }
    
    #yoi-input {
      flex: 1;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      background: #F8F9FA;
      transition: all 0.2s ease;
    }
    
    #yoi-input:focus {
      border-color: ${config.brandColor};
      background: white;
      box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
    }
    
    #yoi-send-btn {
      background: linear-gradient(135deg, ${config.brandColor} 0%, ${adjustColor(config.brandColor, 20)} 100%);
      border: none;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      cursor: pointer;
      color: white;
      font-size: 18px;
      transition: all 0.2s ease;
    }
    
    #yoi-send-btn:hover {
      transform: scale(1.05);
    }
    
    @media (max-width: 480px) {
      #yoi-chat-box {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
      }
    }
  `;

    // Helper function to adjust color brightness
    function adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    // Inject styles into page
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create widget HTML
    const widgetHTML = `
    <div id="yoi-chat-widget">
      <div id="yoi-chat-box">
        <div id="yoi-header">
          <div id="yoi-header-left">
            <div id="yoi-avatar">🤖</div>
            <div>
              <div id="yoi-title-text">YOI AI</div>
              <div id="yoi-subtitle">
                <span class="yoi-status-dot"></span>
                Online • Ready to help
              </div>
            </div>
          </div>
          <button id="yoi-close-btn">×</button>
        </div>
        
        <div id="yoi-messages"></div>
        
        <div id="yoi-quick-actions">
          <button class="yoi-quick-btn" data-msg="What services does YOI offer?">🎯 Our Services</button>
          <button class="yoi-quick-btn" data-msg="How can YOI help my business?">💼 Business Solutions</button>
          <button class="yoi-quick-btn" data-msg="Tell me about YOI's AI solutions">🤖 AI Solutions</button>
        </div>
        
        <div id="yoi-input-area">
          <input type="text" id="yoi-input" placeholder="Type your message..." />
          <button id="yoi-send-btn">➤</button>
        </div>
      </div>
      
      <button id="yoi-chat-btn">
        💬 <span>Chat with YOI</span>
      </button>
    </div>
  `;

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

    function initWidget() {
        // Inject widget into page
        document.body.insertAdjacentHTML('beforeend', widgetHTML);

        // Get elements
        const chatBtn = document.getElementById('yoi-chat-btn');
        const chatBox = document.getElementById('yoi-chat-box');
        const closeBtn = document.getElementById('yoi-close-btn');
        const input = document.getElementById('yoi-input');
        const sendBtn = document.getElementById('yoi-send-btn');
        const messages = document.getElementById('yoi-messages');
        const quickActions = document.getElementById('yoi-quick-actions');

        let sessionId = localStorage.getItem('yoi_session_id') || null;
        let isFirstOpen = true;

        // Toggle chat
        chatBtn.onclick = () => {
            chatBox.classList.add('yoi-open');
            chatBtn.style.display = 'none';

            if (isFirstOpen) {
                isFirstOpen = false;
                setTimeout(() => {
                    addMessage('bot', '👋 Hi! I\'m <strong>YOI Bot</strong>. I\'m here to help you learn about YOI Media\'s services and solutions. How can I assist you today?');
                }, 300);
            }
        };

        // Close chat
        closeBtn.onclick = () => {
            chatBox.classList.remove('yoi-open');
            chatBtn.style.display = 'flex';
        };

        // Send message
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') sendMessage();
        };

        // Quick actions
        document.querySelectorAll('.yoi-quick-btn').forEach(btn => {
            btn.onclick = () => {
                input.value = btn.getAttribute('data-msg');
                sendMessage();
                quickActions.classList.add('yoi-hidden');
            };
        });

        async function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            addMessage('user', text);
            input.value = '';

            if (!quickActions.classList.contains('yoi-hidden')) {
                quickActions.classList.add('yoi-hidden');
            }

            const loader = addTyping();

            try {
                const res = await fetch(config.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        language: 'en',
                        session_id: sessionId
                    })
                });

                const data = await res.json();
                removeTyping(loader);

                if (data.session_id) {
                    sessionId = data.session_id;
                    localStorage.setItem('yoi_session_id', sessionId);
                }

                addMessage('bot', data.reply);
            } catch (err) {
                removeTyping(loader);
                addMessage('bot', '⚠️ I\'m having trouble connecting. Please try again!');
            }
        }

        function addMessage(sender, text) {
            const div = document.createElement('div');
            div.className = `yoi-msg yoi-${sender}`;
            div.innerHTML = text;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }

        function addTyping() {
            const div = document.createElement('div');
            div.className = 'yoi-msg yoi-typing';
            div.innerHTML = '<span></span><span></span><span></span>';
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
            return div;
        }

        function removeTyping(el) {
            if (el && el.parentNode) el.remove();
        }
    }
})();
