/* Shared accessible UI behaviors for all MEMOCARE pages. */
(function () {
    const themeKey = 'memocare_theme';
    const languageKey = 'memocare_language';
    const languages = { en: 'English', hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi' };
    function theme() { return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light'; }
    function applyTheme(next) {
        document.documentElement.dataset.theme = next;
        localStorage.setItem(themeKey, next);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = next === 'dark' ? '#0b1220' : '#eef5ff';
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            const labels = { light: ['fa-moon', 'Dark mode'], dark: ['fa-sun', 'Light mode'] };
            const [icon, label] = labels[next];
            btn.setAttribute('aria-pressed', String(next === 'dark'));
            btn.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i> ${label}`;
        });
    }
    function toast(message, type = 'info', duration = 4200) {
        let region = document.querySelector('.mc-toast-region');
        if (!region) { region = document.createElement('div'); region.className = 'mc-toast-region'; region.setAttribute('aria-live', 'polite'); document.body.appendChild(region); }
        const item = document.createElement('div');
        item.className = `mc-toast mc-toast--${type}`;
        item.setAttribute('role', type === 'error' ? 'alert' : 'status');
        const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
        item.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i><span></span>`;
        item.querySelector('span').textContent = String(message).replace(/\n+/g, ' — ');
        region.appendChild(item);
        if (/congratulations|well done|great job/i.test(String(message))) {
            celebrate();
            speak('Wonderful work. You completed the game.');
        }
        setTimeout(() => { item.classList.add('is-leaving'); setTimeout(() => item.remove(), 260); }, duration);
        return item;
    }
    function celebrate() {
        const layer = document.createElement('div'); layer.className = 'mc-celebrate';
        const colors = ['#477cf5', '#f49ac2', '#35c890', '#ffd166', '#9b7cff'];
        for (let i = 0; i < 26; i++) { const bit = document.createElement('i'); bit.className = 'mc-confetti'; bit.style.left = `${Math.random() * 100}%`; bit.style.setProperty('--x', `${(Math.random() - .5) * 16}rem`); bit.style.background = colors[i % colors.length]; bit.style.animationDelay = `${Math.random() * .25}s`; layer.appendChild(bit); }
        document.body.appendChild(layer); setTimeout(() => layer.remove(), 2300);
    }
    function addToggle() {
        const panel = document.querySelector('.profile-panel');
        if (!panel || panel.querySelector('.theme-control')) return;
        const row = document.createElement('div'); row.className = 'theme-control';
        row.innerHTML = '<span><i class="fas fa-circle-half-stroke" aria-hidden="true"></i> Display</span><button type="button" class="theme-toggle"></button>';
        panel.querySelector('.profile-menu')?.before(row);
        // This control is created after the first page theme update, so label it now.
        applyTheme(theme());
        row.querySelector('button').addEventListener('click', () => {
            const next = theme() === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            toast(`${next === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');
        });
        const language = document.createElement('div');
        language.className = 'preference-control';
        language.innerHTML = `<label for="mc-language"><i class="fas fa-language" aria-hidden="true"></i> Language and voice</label><div class="language-actions"><select id="mc-language" class="language-select" aria-label="Choose a language">${Object.entries(languages).map(([code, name]) => `<option value="${code}">${name}</option>`).join('')}</select><button type="button" class="language-apply"><i class="fas fa-check" aria-hidden="true"></i> Apply</button></div>`;
        panel.querySelector('.profile-menu')?.before(language);
        const select = language.querySelector('select');
        select.value = localStorage.getItem(languageKey) || 'en';
        language.querySelector('button').addEventListener('click', () => setLanguage(select.value));
    }
    function translateWithGoogle(code) {
        const apply = () => {
            const select = document.querySelector('.goog-te-combo');
            if (!select) return setTimeout(apply, 300);
            select.value = code === 'en' ? '' : code;
            select.dispatchEvent(new Event('change'));
        };
        if (window.google?.translate) return apply();
        window.googleTranslateElementInit = () => {
            new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false, includedLanguages: Object.keys(languages).join(',') }, 'mc-google-translate');
            apply();
        };
        if (!document.getElementById('mc-google-translate')) { const holder = document.createElement('div'); holder.id = 'mc-google-translate'; document.body.appendChild(holder); }
        if (!document.querySelector('script[data-mc-translate]')) { const script = document.createElement('script'); script.dataset.mcTranslate = 'true'; script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; document.head.appendChild(script); }
    }
    function setLanguage(code) {
        const name = languages[code] || languages.en;
        localStorage.setItem(languageKey, code);
        document.documentElement.lang = code;
        window.memocareVoiceLanguage = code;
        translateWithGoogle(code);
        toast(`${name} selected. Voice responses will use this language when available.`, 'success', 5500);
        setTimeout(() => speak(`${name} selected.`), 250);
    }
    function speak(text) {
        const clean = String(text).replace(/[\p{Extended_Pictographic}]/gu, '').replace(/\s+/g, ' ').trim();
        if (!clean) return;
        if ('speechSynthesis' in window) speechSynthesis.resume();
        if (typeof window.memocareSpeak === 'function') window.memocareSpeak(clean);
        else if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const preferred = localStorage.getItem(languageKey) || 'en';
            const voices = speechSynthesis.getVoices();
            const voice = voices.find(item => item.lang.toLowerCase().startsWith(preferred))
                || voices.find(item => /samantha|karen|aria|jenny|natural|premium/i.test(item.name)) || voices[0];
            const utterance = new SpeechSynthesisUtterance(clean);
            utterance.voice = voice || null; utterance.rate = .82; utterance.pitch = 1.03;
            speechSynthesis.speak(utterance);
        }
    }
    function speakMajorActions() {
        const labels = [
            ['.emergency-btn', 'Emergency help is being contacted.'],
            ['#saveRoutineBtn, .save-routine-btn', 'Your routine has been saved.'],
            ['.complete-btn, .routine-complete, [data-action="complete"]', 'Well done. This routine is complete.'],
            ['#saveMedBtn, .save-medicine-btn', 'Medicine saved.'],
            ['#scanBtn, .scan-btn, .scanner-btn', 'Starting medicine scan.'],
            ['.start-game-btn, .play-btn, .game-card, [data-action="start-game"]', 'Starting game.'],
            ['.theme-toggle', 'Changing display mode.'],
            ['.language-apply', 'Applying the selected language.']
        ];
        labels.forEach(([selector, message]) => document.querySelectorAll(selector).forEach(button => {
            button.dataset.speak = message;
        }));
        document.addEventListener('click', event => {
            const target = event.target.closest('[data-speak], [onclick*="complete" i], [onclick*="saveMedicine" i], [onclick*="startScanner" i], [onclick*="scan" i]');
            if (!target || target.disabled) return;
            let label = target.dataset.speak;
            if (!label && /complete/i.test(target.getAttribute('onclick') || '')) label = 'Well done. This routine is complete.';
            if (!label && /saveMedicine/i.test(target.getAttribute('onclick') || '')) label = 'Medicine saved.';
            if (!label && /startScanner|scan/i.test(target.getAttribute('onclick') || '')) label = 'Starting medicine scan.';
            // Start within the click event: mobile browsers otherwise block speech.
            if (label) speak(label);
        });
    }
    function transitions() {
        document.addEventListener('click', event => {
            const link = event.target.closest('a[href]');
            if (!link || event.defaultPrevented || link.target || link.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const url = new URL(link.href, location.href);
            if (url.origin !== location.origin || url.pathname === location.pathname && url.hash) return;
            event.preventDefault();
            let loader = document.querySelector('.mc-page-loader');
            if (!loader) { loader = document.createElement('div'); loader.className = 'mc-page-loader'; loader.setAttribute('role', 'status'); loader.setAttribute('aria-live', 'polite'); loader.innerHTML = '<div class="mc-loader-dots" aria-hidden="true"><i></i><i></i><i></i></div><span>Loading page…</span>'; document.body.appendChild(loader); }
            loader.classList.add('is-visible'); document.body.classList.add('page-leaving');
            setTimeout(() => { location.href = url.href; }, 240);
        });
    }
    document.addEventListener('DOMContentLoaded', () => { applyTheme(theme()); document.documentElement.lang = localStorage.getItem(languageKey) || 'en'; addToggle(); transitions(); speakMajorActions(); });
    window.memocareToast = toast; window.memocareCelebrate = celebrate; window.memocareSetLanguage = setLanguage;
    window.alert = message => toast(message, /emergency|invalid|denied|required|could not/i.test(String(message)) ? 'error' : 'info');
})();
