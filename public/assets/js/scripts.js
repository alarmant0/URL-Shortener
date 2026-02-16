/* =========================================
   1. VARIÁVEIS GLOBAIS & CLOUDFLARE
   ========================================= */
let turnstileWidgetId = null;
const SITE_KEY = "0x4AAAAAACaxj37FguiUF4w3"; // Tua chave do site

window.onTurnstileSuccess = function(token) {
    const out = document.getElementById("turnstileToken");
    if (out) out.value = token || "";
};

window.onTurnstileExpired = function() {
    const out = document.getElementById("turnstileToken");
    if (out) out.value = "";
};

window.onTurnstileError = function() {
    const out = document.getElementById("turnstileToken");
    if (out) out.value = "";
    console.log("Turnstile connection error (Silent).");
};

/* =========================================
   2. DOM LOADED & EVENT LISTENERS
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    
    // --- LÓGICA DO TEMA & CLOUDFLARE ---
    const themeBtn = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    const renderTurnstile = (theme) => {
        if (typeof turnstile === 'undefined') return;
        if (turnstileWidgetId !== null) turnstile.remove(turnstileWidgetId);
        
        turnstileWidgetId = turnstile.render('#turnstile-widget', {
            sitekey: SITE_KEY,
            theme: theme,
            callback: window.onTurnstileSuccess,
            "expired-callback": window.onTurnstileExpired,
            "error-callback": window.onTurnstileError
        });
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    setTimeout(() => renderTurnstile(savedTheme), 500);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            renderTurnstile(newTheme);
        });
    }

    // --- FORM SUBMIT ---
    const form = document.getElementById("shortenForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            getTinyURL();
        });
    }

    // --- COPY BUTTON ---
    const copyBtn = document.getElementById("copyBtn");
    if (copyBtn) {
        copyBtn.addEventListener("click", () => copyToClipboard());
    }

    initVisuals();
});

/* =========================================
   3. LÓGICA DA API (Fetch Real)
   ========================================= */
function getTinyURL() {
    const urlInput = document.getElementById("ph1");
    const codeInput = document.getElementById("ph2");
    const button = document.getElementById("submitBtn");
    const tokenInput = document.getElementById("turnstileToken");
    const resultContainer = document.getElementById("resultContainer");
    const shortResult = document.getElementById("shortResult");

    const url = urlInput?.value.trim() || "";
    const code = codeInput?.value.trim() || "";
    let token = (tokenInput?.value || "").trim();

    // --- VALIDAÇÕES COM EFEITOS VISUAIS ---

    // 1. Campo Vazio
    if (!url) {
        triggerInputError("ph1"); 
        showToast("Please fill out this field.", "error");
        return;
    }

    // 2. URL Inválido
    if (!isValidUrl(url)) {
        triggerInputError("ph1"); 
        showToast("Please enter a valid URL (http://...)", "error");
        return;
    }

    // 3. Alias Inválido
    if (code && !isValidCode(code)) {
        triggerInputError("ph2"); 
        showToast("Alias must be simple text (max 8 chars).", "error");
        return;
    }

    // Bypass Localhost
    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") { 
        token = "1x00000000000000000000AA"; 
    }

    if (!token) {
        showToast("Please verify you are human.", "error");
        return;
    }

    // UI Loading
    const originalBtnText = button.innerHTML;
    button.innerHTML = "✨ Shortening...";
    button.disabled = true;

    const payload = {
        full_url: url,
        custom_code: code,
        turnstileToken: token
    };

    fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(async (response) => {
        const text = await response.text();
        let data = {};
        try { data = JSON.parse(text); } catch (e) { data = { error: text }; }

        if (!response.ok) {
            if (window.turnstile) window.turnstile.reset();
            if (tokenInput) tokenInput.value = "";
            
            if (response.status === 409) {
                triggerInputError("ph2"); // Erro no Alias
                throw new Error("Custom alias already exists.");
            }
            throw new Error(data?.error || "Something went wrong.");
        }
        return data;
    })
    .then((data) => {
        shortResult.value = data.url;
        
        resultContainer.style.display = "block";
        resultContainer.style.opacity = '0';
        resultContainer.style.transform = 'translateY(10px)';
        void resultContainer.offsetWidth; 
        resultContainer.style.transition = 'all 0.5s ease';
        resultContainer.style.opacity = '1';
        resultContainer.style.transform = 'translateY(0)';
        
        if (window.turnstile) window.turnstile.reset();
        if (tokenInput) tokenInput.value = "";
        
        showToast("Link shortened successfully!", "success");
    })
    .catch((error) => {
        console.error("Error:", error);
        showToast(error.message, "error");
    })
    .finally(() => {
        button.innerHTML = originalBtnText;
        button.disabled = false;
    });
}

/* =========================================
   4. UTILS & HELPERS
   ========================================= */

// FUNÇÃO DE ERRO VISUAL (Tremer e Vermelho)
function triggerInputError(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    el.classList.remove("input-error");
    void el.offsetWidth; // Force Reflow
    el.classList.add("input-error");
    el.focus();

    setTimeout(() => {
        el.classList.remove("input-error");
    }, 1000);
}

async function copyToClipboard() {
    const input = document.getElementById("shortResult");
    const copyBtn = document.getElementById("copyBtn");
    if (!input?.value) return;
    
    try {
        await navigator.clipboard.writeText(input.value);
        const originalIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        const successIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

        copyBtn.innerHTML = successIcon;
        copyBtn.style.borderColor = "#22c55e"; 
        showToast("Link copied!", "success");

        setTimeout(() => {
            copyBtn.innerHTML = originalIcon;
            copyBtn.style.borderColor = ""; 
        }, 2000);

    } catch (err) {
        console.error('Failed to copy!', err);
        showToast("Failed to copy link.", "error");
    }
}

function isValidCode(custom_code) {
    return /^[A-Za-z0-9]{1,8}$/.test(custom_code);
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/* =========================================
   5. VISUAIS E TOAST
   ========================================= */
function initVisuals() {
    const symbolsContainer = document.getElementById('symbolsContainer');
    if (symbolsContainer) {
        const icons = ['🔗', '✨', '🌐', '💜', '⚡', '📊'];
        for (let i = 0; i < 15; i++) {
            const s = document.createElement('span');
            s.className = 'symbol';
            s.innerText = icons[i % icons.length];
            s.style.left = Math.random() * 100 + 'vw';
            s.style.top = (Math.random() * 50 + 50) + 'vh';
            s.style.animationDelay = Math.random() * 5 + 's';
            s.style.fontSize = (Math.random() * 1 + 1) + 'rem';
            symbolsContainer.appendChild(s);
        }
    }

    const phrases = ["Simplify Sharing", "Track Every Click", "Create Qr Codes", "Boost your Reach"];
    let pIdx = 0;
    const target = document.getElementById('rotatingText');
    if (target) {
        const showText = (text) => {
            target.innerHTML = ''; 
            text.split('').forEach((c, i) => {
                const span = document.createElement('span');
                span.innerHTML = c === ' ' ? '&nbsp;' : c;
                span.className = 'letter';
                target.appendChild(span);
                setTimeout(() => span.classList.add('active'), i * 30);
            });
        };
        const cycle = () => {
            const letters = target.querySelectorAll('.letter');
            letters.forEach((l, i) => setTimeout(() => {
                l.classList.remove('active');
                l.classList.add('out');
            }, i * 30));
            setTimeout(() => {
                pIdx = (pIdx + 1) % phrases.length;
                showText(phrases[pIdx]);
            }, 1000 + (letters.length * 30));
        };
        showText(phrases[0]);
        setInterval(cycle, 3500); 
    }
}

function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    
    if (!container) {
        alert(message);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // --- MUDANÇA AQUI: Ícone de Triângulo de Perigo para Erros ---
    const iconError = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    
    // Ícone de Sucesso (Check)
    const iconSuccess = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    
    const icon = type === 'error' ? iconError : iconSuccess;
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 50);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 400); 
    }, 3500);
}