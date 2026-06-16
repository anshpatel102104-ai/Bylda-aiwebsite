/* nova-chat.js — Nova AI floating chatbot widget */
(function () {
  'use strict';

  if (window.__novaChatLoaded) return;
  window.__novaChatLoaded = true;

  const API = 'https://launchpad-api.ansh-patel102104.workers.dev';

  const SYSTEM = `You are Nova, the friendly AI assistant for NovaOps AI — an AI automation company helping businesses grow faster. Be warm, concise (2-4 sentences), and guide users toward value. Key facts:
- 20+ free AI tools at launchpad.nova-ops.space: Idea Validator, Pitch Generator, GTM Strategy Builder, Ad Copy Generator, Competitor Scanner, Kill My Idea, Business Plan Generator, Investor Email Writer, Funding Readiness Score, Landing Page Creator, and more
- Done-for-you AI automation services: lead gen, CRM pipelines, follow-up sequences, client onboarding
- Industries: dental, real estate, solar, home services, insurance, med spas, roofing, chiropractic
- Pricing tiers: Starter (free forever), Growth, Scale, Enterprise — see /pricing
- Sign up free: https://app.launchpad.nova-ops.space/signup
- Book a strategy call: https://nova-ops.space/contact
- Blog with guides at /blog
Always be helpful. If unsure, suggest the user visit /contact or try a free tool.`;

  const SUGGESTIONS = [
    'What can Nova do for me?',
    'Show me the free tools',
    'How much does it cost?',
    'Book a free demo',
  ];

  const CSS = `
#nova-chat-btn{position:fixed;bottom:24px;right:24px;z-index:9998;background:linear-gradient(135deg,#7e22ce,#a855f7);width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(168,85,247,.5),0 0 0 0 rgba(168,85,247,.35);transition:transform .2s cubic-bezier(.34,1.56,.64,1),box-shadow .2s;color:#fff;animation:nc-pulse 3s ease-in-out infinite}
#nova-chat-btn:hover{transform:scale(1.12) translateY(-2px);box-shadow:0 8px 32px rgba(168,85,247,.65)}
#nova-chat-btn svg{pointer-events:none}
.nc-badge{position:absolute;top:-3px;right:-3px;background:#ef4444;color:#fff;font-size:.58rem;font-weight:800;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;border:2px solid #080617;letter-spacing:0}
@keyframes nc-pulse{0%,100%{box-shadow:0 4px 20px rgba(168,85,247,.5),0 0 0 0 rgba(168,85,247,0)}60%{box-shadow:0 4px 20px rgba(168,85,247,.5),0 0 0 9px rgba(168,85,247,0)}}

#nova-chat-win{position:fixed;bottom:96px;right:24px;z-index:9999;width:360px;max-width:calc(100vw - 32px);background:#080617;border:1px solid rgba(168,85,247,.3);border-radius:20px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7),0 0 0 1px rgba(168,85,247,.1);transform:scale(.88) translateY(18px);opacity:0;pointer-events:none;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .22s ease;transform-origin:bottom right}
#nova-chat-win.nc-open{transform:scale(1) translateY(0);opacity:1;pointer-events:all}

.nc-head{padding:14px 16px;background:linear-gradient(135deg,#130a2e 0%,#1e0a40 100%);border-bottom:1px solid rgba(168,85,247,.18);display:flex;align-items:center;gap:10px;flex-shrink:0}
.nc-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#7e22ce,#a855f7);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;box-shadow:0 0 14px rgba(168,85,247,.55)}
.nc-info{flex:1;min-width:0}
.nc-name{font-size:.875rem;font-weight:700;color:#fff;letter-spacing:-.015em}
.nc-status{font-size:.68rem;color:#a78bfa;display:flex;align-items:center;gap:5px;margin-top:1px}
.nc-status::before{content:'';width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0;box-shadow:0 0 4px #22c55e}
.nc-close{background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;font-size:1rem;padding:6px;line-height:1;transition:color .15s;flex-shrink:0;border-radius:6px}
.nc-close:hover{color:#fff;background:rgba(255,255,255,.08)}

.nc-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;min-height:240px;max-height:310px;scroll-behavior:smooth}
.nc-msgs::-webkit-scrollbar{width:3px}
.nc-msgs::-webkit-scrollbar-thumb{background:rgba(168,85,247,.3);border-radius:2px}

.nc-msg{display:flex;flex-direction:column;max-width:84%}
.nc-msg.bot{align-items:flex-start}
.nc-msg.user{align-items:flex-end;margin-left:auto}
.nc-bubble{padding:9px 13px;border-radius:14px;font-size:.82rem;line-height:1.55;word-break:break-word}
.nc-msg.bot .nc-bubble{background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.22);color:rgba(255,255,255,.9);border-radius:4px 14px 14px 14px}
.nc-msg.user .nc-bubble{background:linear-gradient(135deg,#7e22ce,#9333ea);color:#fff;border-radius:14px 14px 4px 14px}
.nc-msg.bot .nc-bubble a{color:#c084fc;text-decoration:underline}
.nc-time{font-size:.62rem;color:rgba(255,255,255,.25);margin-top:3px;padding:0 3px}

.nc-typing{display:flex;align-items:center;gap:4px;padding:10px 13px;background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.18);border-radius:4px 14px 14px 14px;width:fit-content}
.nc-typing span{width:5px;height:5px;border-radius:50%;background:#a78bfa;animation:nc-dot 1.3s ease-in-out infinite}
.nc-typing span:nth-child(2){animation-delay:.2s}
.nc-typing span:nth-child(3){animation-delay:.4s}
@keyframes nc-dot{0%,80%,100%{transform:scale(.5);opacity:.35}40%{transform:scale(1);opacity:1}}

.nc-suggestions{padding:0 10px 10px;display:flex;flex-wrap:wrap;gap:6px}
.nc-chip{background:transparent;border:1px solid rgba(168,85,247,.32);color:#c084fc;font-size:.72rem;padding:5px 10px;border-radius:20px;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap;line-height:1}
.nc-chip:hover{background:rgba(168,85,247,.18);border-color:rgba(168,85,247,.6);color:#fff}

.nc-input-row{display:flex;align-items:flex-end;gap:7px;padding:9px 10px;border-top:1px solid rgba(168,85,247,.12);background:#06050f;flex-shrink:0}
.nc-input{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(168,85,247,.18);border-radius:16px;padding:8px 13px;color:#fff;font-size:.8rem;font-family:inherit;outline:none;transition:border-color .15s;resize:none;min-height:36px;max-height:80px;line-height:1.45}
.nc-input::placeholder{color:rgba(255,255,255,.28)}
.nc-input:focus{border-color:rgba(168,85,247,.5)}
.nc-send{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#7e22ce,#9333ea);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .15s,opacity .15s;color:#fff;align-self:flex-end}
.nc-send:hover{transform:scale(1.1)}
.nc-send:disabled{opacity:.35;cursor:not-allowed;transform:none}
.nc-send svg{width:13px;height:13px;display:block}

.nc-footer{text-align:center;font-size:.6rem;color:rgba(255,255,255,.18);padding:4px 0 7px;flex-shrink:0}
.nc-footer a{color:rgba(168,85,247,.4);text-decoration:none}
.nc-footer a:hover{color:rgba(168,85,247,.7)}

@media(max-width:500px){#nova-chat-win{right:8px;bottom:84px;width:calc(100vw - 16px)}#nova-chat-btn{right:16px;bottom:16px}}
`;

  const HTML = `
<button id="nova-chat-btn" aria-label="Chat with Nova AI assistant" title="Chat with Nova">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="23" height="23" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"/>
  </svg>
  <span class="nc-badge" aria-hidden="true">1</span>
</button>
<div id="nova-chat-win" role="dialog" aria-label="Nova AI Chat" aria-modal="true">
  <div class="nc-head">
    <div class="nc-avatar" aria-hidden="true">✦</div>
    <div class="nc-info">
      <div class="nc-name">Nova AI</div>
      <div class="nc-status">Online · NovaOps AI</div>
    </div>
    <button class="nc-close" id="nc-close-btn" aria-label="Close chat">✕</button>
  </div>
  <div class="nc-msgs" id="nc-msgs" role="log" aria-live="polite" aria-label="Chat messages"></div>
  <div class="nc-suggestions" id="nc-suggestions" role="group" aria-label="Quick questions"></div>
  <div class="nc-input-row">
    <textarea class="nc-input" id="nc-input" placeholder="Ask Nova anything…" rows="1" maxlength="600" aria-label="Chat message"></textarea>
    <button class="nc-send" id="nc-send" aria-label="Send message">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"/>
      </svg>
    </button>
  </div>
  <div class="nc-footer">Powered by <a href="/" tabindex="-1">NovaOps AI</a></div>
</div>`;

  let history = [];
  let isOpen = false;
  let isThinking = false;

  function ts() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

  function addMsg(role, text, isHtml) {
    const msgs = document.getElementById('nc-msgs');
    if (!msgs) return;
    const div = document.createElement('div');
    div.className = 'nc-msg ' + role;
    const content = isHtml ? text : escapeHtml(text);
    div.innerHTML = `<div class="nc-bubble">${content}</div><div class="nc-time">${ts()}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('nc-msgs');
    if (!msgs) return;
    const el = document.createElement('div');
    el.className = 'nc-msg bot';
    el.id = 'nc-typing';
    el.innerHTML = '<div class="nc-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('nc-typing');
    if (el) el.remove();
  }

  function hideSuggestions() {
    const s = document.getElementById('nc-suggestions');
    if (s) { s.style.display = 'none'; }
  }

  async function sendMessage(text) {
    text = (text || '').trim();
    if (!text || isThinking) return;
    isThinking = true;
    hideSuggestions();

    const input = document.getElementById('nc-input');
    const sendBtn = document.getElementById('nc-send');
    if (input) { input.value = ''; input.style.height = 'auto'; }
    if (sendBtn) sendBtn.disabled = true;

    addMsg('user', text, false);
    history.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 350,
          system: SYSTEM,
          messages: history.slice(-12)
        })
      });
      hideTyping();
      if (!res.ok) throw new Error('status ' + res.status);
      const data = await res.json();
      const reply = data?.content?.[0]?.text || "I'm having a moment — please try again!";
      history.push({ role: 'assistant', content: reply });
      addMsg('bot', reply, false);
    } catch {
      hideTyping();
      addMsg('bot', 'I\'m having trouble connecting right now. <a href="/contact">Contact us here</a> and we\'ll get back to you fast!', true);
    }

    isThinking = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }

  function openChat() {
    const win = document.getElementById('nova-chat-win');
    const chatBtn = document.getElementById('nova-chat-btn');
    if (!win) return;
    isOpen = true;
    win.classList.add('nc-open');
    win.removeAttribute('aria-hidden');
    const badge = chatBtn?.querySelector('.nc-badge');
    if (badge) badge.style.display = 'none';
    sessionStorage.setItem('nova_chat_opened', '1');

    if (history.length === 0) {
      // Display greeting visually but don't add to history —
      // Anthropic API requires conversations to start with a user message
      addMsg('bot', "Hi! I'm Nova 👋 — your AI guide to NovaOps. I can help you explore our 20 free AI tools, pricing options, or get you set up with a free account. What can I help you with?", false);
    }

    setTimeout(() => document.getElementById('nc-input')?.focus(), 100);
  }

  function closeChat() {
    const win = document.getElementById('nova-chat-win');
    if (win) {
      win.classList.remove('nc-open');
      win.setAttribute('aria-hidden', 'true');
    }
    isOpen = false;
    document.getElementById('nova-chat-btn')?.focus();
  }

  function initSuggestions() {
    const container = document.getElementById('nc-suggestions');
    if (!container) return;
    SUGGESTIONS.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'nc-chip';
      btn.textContent = s;
      btn.addEventListener('click', () => sendMessage(s));
      container.appendChild(btn);
    });
  }

  function init() {
    if (document.getElementById('nova-chat-btn')) return;

    const style = document.createElement('style');
    style.id = 'nova-chat-css';
    style.textContent = CSS;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', HTML);

    const chatBtn = document.getElementById('nova-chat-btn');
    const closeBtn = document.getElementById('nc-close-btn');
    const sendBtn = document.getElementById('nc-send');
    const input = document.getElementById('nc-input');

    chatBtn?.addEventListener('click', () => { isOpen ? closeChat() : openChat(); });
    closeBtn?.addEventListener('click', closeChat);
    sendBtn?.addEventListener('click', () => sendMessage(input?.value || ''));

    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); }
    });

    input?.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closeChat();
    });

    initSuggestions();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
