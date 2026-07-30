/* Remembrance AI – shared chatbot powered by puter.js */
(function () {
    const SYSTEM_PROMPT =
        "You are Remembrance AI, a warm and gentle AI companion built into the MEMOCARE app to help elderly people living with dementia. " +
        "Always speak slowly, clearly, and with great kindness and patience. Use simple, short sentences.Answer in VERY SHORT as short as possible " +
        "Never rush or overwhelm the user. If they seem confused, gently reassure them. " +
        "You can help them remember daily routines, identify family members, answer simple questions about their day, medicines, or surroundings. " +
        "Always be encouraging, calm, and loving. Address the user warmly. Never use complex medical jargon. " +
        "If they ask who you are, say: 'I am Remembrance AI, your gentle memory helper in MEMOCARE. I am always here for you.'";

    // Choose the most natural English voice exposed by the person's device. Voice
    // availability is OS/browser dependent, so this always retains a safe fallback.
    let availableVoices = [];
    const preferredVoiceNames = [
        /samantha/i, /karen/i, /ava/i, /allison/i, /susan/i, /zira/i,
        /aria/i, /jenny/i, /guy/i, /davis/i, /google.*(us|uk).*english/i,
        /microsoft.*natural/i, /premium/i, /enhanced/i
    ];
    function loadVoices() { availableVoices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
    function selectVoice() {
        const language = window.memocareVoiceLanguage || localStorage.getItem('memocare_language') || 'en';
        const matching = availableVoices.filter(voice => voice.lang.toLowerCase().startsWith(language.toLowerCase()));
        const candidates = matching.length ? matching : availableVoices.filter(voice => /^en([-_]|$)/i.test(voice.lang));
        return preferredVoiceNames.map(pattern => candidates.find(voice => pattern.test(voice.name))).find(Boolean)
            || candidates.find(voice => /natural|neural|premium|enhanced/i.test(voice.name))
            || candidates[0] || availableVoices[0];
    }
    function speakNaturally(text) {
        if (!('speechSynthesis' in window) || !text) return;
        speechSynthesis.cancel();
        // Emoji names sound jarring in text-to-speech; speak only the human words.
        const spokenText = String(text).replace(/[\p{Extended_Pictographic}]/gu, '').replace(/\s+/g, ' ').trim();
        const chunks = spokenText.match(/[^.!?]+[.!?]*|[^.!?]+$/g) || [spokenText];
        let index = 0;
        const sayNext = () => {
            if (index >= chunks.length) return;
            const utterance = new SpeechSynthesisUtterance(chunks[index++].trim());
            utterance.voice = selectVoice();
            const punctuation = chunks[index - 1].slice(-1);
            // Tiny natural variations make the same selected system voice less mechanical.
            utterance.rate = punctuation === '?' ? 0.81 : punctuation === '!' ? 0.84 : 0.8;
            utterance.pitch = punctuation === '?' ? 1.06 : punctuation === '!' ? 1.04 : 1.02;
            utterance.volume = punctuation === '!' ? 0.98 : 0.92;
            utterance.onend = () => setTimeout(sayNext, punctuation === ',' ? 120 : punctuation ? 220 : 160);
            speechSynthesis.speak(utterance);
        };
        sayNext();
    }

    function injectHTML() {
        // FAB button
        const fab = document.createElement('button');
        fab.id = 'ai-fab';
        fab.setAttribute('aria-label', 'Open Remembrance AI');
        fab.title = 'Remembrance AI';
        fab.innerHTML = '<i class="fas fa-robot"></i>';
        document.body.appendChild(fab);

        // Chat window
        const win = document.createElement('div');
        win.id = 'ai-chat-window';
        win.setAttribute('role', 'dialog');
        win.setAttribute('aria-label', 'Remembrance AI Chat');
        win.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-avatar"><i class="fas fa-robot"></i></div>
                <div class="ai-header-info">
                    <h4>Remembrance AI</h4>
                    <span>Your gentle memory helper</span>
                </div>
                <button class="ai-close-btn" id="ai-close-btn" aria-label="Close chat"><i class="fas fa-times"></i></button>
            </div>
            <div class="ai-messages" id="ai-messages"></div>
            <div class="ai-input-area">
                <textarea id="ai-input" placeholder="Ask me anything…" rows="1" aria-label="Type your message"></textarea>
                <button id="ai-send-btn" aria-label="Send message"><i class="fas fa-paper-plane"></i></button>
            </div>
        `;
        document.body.appendChild(win);

        const sosOverlay = document.createElement('div');
        sosOverlay.id = 'sos-overlay';
        sosOverlay.setAttribute('aria-hidden', 'true');
        sosOverlay.innerHTML = `
            <div id="sos-shade" class="sos-shade" tabindex="-1"></div>
            <div class="sos-modal" role="dialog" aria-modal="true" aria-labelledby="sos-heading">
                <div class="sos-content">
                    <div id="sos-heading" class="sos-heading">SOS</div>
                    <div class="sos-text">Family has been notified</div>
                    <button id="sos-cancel-btn" class="sos-cancel-btn" type="button">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(sosOverlay);

        const style = document.createElement('style');
        style.textContent = `
            #sos-overlay { display: none; position: fixed; inset: 0; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
            .sos-shade { position: absolute; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px); }
            .sos-modal { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 1rem; }
            .sos-content { width: 100%; max-width: 420px; background: rgba(255,255,255,0.98); border: 3px solid rgba(239,68,68,0.45); border-radius: 28px; box-shadow: 0 30px 90px rgba(0,0,0,0.4); padding: 2rem 1.25rem; text-align: center; }
            .sos-heading { font-size: 3.2rem; font-weight: 1000; color: #EF4444; letter-spacing: 0.06em; }
            .sos-text { margin-top: 0.75rem; font-size: 1.25rem; font-weight: 800; color: #111827; }
            .sos-cancel-btn { margin-top: 1.25rem; width: 100%; max-width: 260px; border: none; border-radius: 999px; padding: 0.9rem 1.1rem; background: #E5E7EB; color: #111827; font-weight: 900; cursor: pointer; }
            .sos-cancel-btn:active { transform: scale(0.98); }
        `;
        document.head.appendChild(style);
    }

    function addMessage(text, role) {
        const container = document.getElementById('ai-messages');
        const msg = document.createElement('div');
        msg.className = `ai-msg ${role}`;
        msg.textContent = text;
        if (role === 'bot') {
            const listen = document.createElement('button');
            listen.type = 'button';
            listen.className = 'ai-listen-btn';
            listen.setAttribute('aria-label', 'Listen to this message');
            listen.innerHTML = '<i class="fas fa-volume-high" aria-hidden="true"></i> Listen';
            listen.addEventListener('click', () => speakNaturally(text));
            msg.appendChild(listen);
        }
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        return msg;
    }

    function showTyping() {
        const container = document.getElementById('ai-messages');
        const el = document.createElement('div');
        el.className = 'ai-typing';
        el.id = 'ai-typing-indicator';
        el.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('ai-typing-indicator');
        if (el) el.remove();
    }

    function openSosOverlay() {
        const overlay = document.getElementById('sos-overlay');
        if (!overlay) return;
        overlay.style.display = 'block';
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const shade = document.getElementById('sos-shade');
        const cancelBtn = document.getElementById('sos-cancel-btn');
        if (shade) shade.onclick = closeSosOverlay;
        if (cancelBtn) cancelBtn.onclick = closeSosOverlay;
    }

    function closeSosOverlay() {
        const overlay = document.getElementById('sos-overlay');
        if (!overlay) return;
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto';
    }

    async function sendMessage() {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send-btn');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = 'auto';
        addMessage(text, 'user');
        sendBtn.disabled = true;
        showTyping();

        try {
            // puter.js AI call – uses the best available model automatically
            const response = await puter.ai.chat(text, { system: SYSTEM_PROMPT });
            removeTyping();
            const reply = (typeof response === 'string') ? response
                : response?.message?.content?.[0]?.text
                ?? response?.message?.content
                ?? response?.text
                ?? 'I am here with you. Could you say that again, dear?';
            addMessage(reply, 'bot');
        } catch (err) {
            removeTyping();
            addMessage('I am so sorry, I had a little trouble just now. Please try again in a moment, dear.', 'bot');
            console.error('Remembrance AI error:', err);
        }

        sendBtn.disabled = false;
        input.focus();
    }

    function setupEvents() {
        const fab = document.getElementById('ai-fab');
        const win = document.getElementById('ai-chat-window');
        const closeBtn = document.getElementById('ai-close-btn');
        const sendBtn = document.getElementById('ai-send-btn');
        const input = document.getElementById('ai-input');

        let isOpen = false;

        function openChat() {
            isOpen = true;
            win.classList.add('open');
            fab.style.transform = 'rotate(15deg) scale(1.05)';
            // Greet on first open
            const msgs = document.getElementById('ai-messages');
            if (msgs.children.length === 0) {
                addMessage("Hello, dear! I'm Remembrance AI, your gentle memory helper. How are you feeling today? I'm here to help you with anything you need. 💜", 'bot');
            }
            setTimeout(() => input.focus(), 350);
        }

        function closeChat() {
            isOpen = false;
            win.classList.remove('open');
            fab.style.transform = '';
        }

        fab.addEventListener('click', () => isOpen ? closeChat() : openChat());
        closeBtn.addEventListener('click', closeChat);
        sendBtn.addEventListener('click', sendMessage);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Auto-resize textarea
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 100) + 'px';
        });

        const emergencyButtons = Array.from(document.querySelectorAll('.emergency-btn'));
        emergencyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                openSosOverlay();
            }, { capture: true });
        });
    }

    function init() {
        // Load puter.js if not already loaded
        if (!window.puter) {
            const script = document.createElement('script');
            script.src = 'https://js.puter.com/v2/';
            script.onload = () => console.log('Puter.js loaded for Remembrance AI');
            document.head.appendChild(script);
        }
        injectHTML();
        loadVoices();
        if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = loadVoices;
        setupEvents();
        window.memocareSpeak = speakNaturally;
        window.openSosOverlay = openSosOverlay;
        window.closeSosOverlay = closeSosOverlay;
        window.emergencyAlert = openSosOverlay;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
