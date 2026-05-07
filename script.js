document.addEventListener('DOMContentLoaded', () => {
    // --- Login System ---
    const loginOverlay = document.getElementById('login-overlay');
    const loginBtn = document.getElementById('login-btn');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    
    // Check Authentication
    const authToken = localStorage.getItem('nexus_auth_token');
    if (authToken && loginOverlay) {
        loginOverlay.classList.add('hidden');
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value.trim();

            if (!username || !password) {
                loginError.textContent = "Lütfen tüm alanları doldurun.";
                return;
            }

            loginBtn.textContent = "Giriş yapılıyor...";
            loginBtn.disabled = true;

            try {
                const response = await fetch('/.netlify/functions/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    localStorage.setItem('nexus_auth_token', data.token);
                    loginOverlay.classList.add('hidden');
                    loginError.textContent = "";
                } else {
                    loginError.textContent = data.error || "Giriş başarısız.";
                }
            } catch (err) {
                loginError.textContent = "Sunucuya bağlanılamadı.";
            }

            loginBtn.textContent = "Giriş Yap";
            loginBtn.disabled = false;
        });
    }

    // --- Chat System ---
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const historyList = document.getElementById('history-list');

    const modelSelect = document.getElementById('model-select');
    const addKnowledgeBtn = document.getElementById('add-knowledge-btn');
    const knowledgeModal = document.getElementById('knowledge-modal');
    const closeKnowledgeModal = document.getElementById('close-knowledge-modal');
    const saveKnowledgeBtn = document.getElementById('save-knowledge-btn');
    const knowledgeInput = document.getElementById('knowledge-input');

    if (addKnowledgeBtn && knowledgeModal) {
        addKnowledgeBtn.addEventListener('click', () => {
            knowledgeModal.classList.remove('hidden');
        });
        closeKnowledgeModal.addEventListener('click', () => {
            knowledgeModal.classList.add('hidden');
            knowledgeInput.value = '';
        });
        saveKnowledgeBtn.addEventListener('click', async () => {
            const text = knowledgeInput.value.trim();
            if (!text) return;
            
            saveKnowledgeBtn.textContent = 'Kaydediliyor...';
            saveKnowledgeBtn.disabled = true;
            
            try {
                const response = await fetch('/.netlify/functions/knowledge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                if(response.ok) {
                    alert('Bilgi başarıyla eklendi! Artık Nexus-Bilgi modeli bu bilgiyi kullanabilir.');
                    knowledgeModal.classList.add('hidden');
                    knowledgeInput.value = '';
                } else {
                    alert('Bilgi eklenirken hata oluştu.');
                }
            } catch (err) {
                alert('Bağlantı hatası.');
            }
            saveKnowledgeBtn.textContent = 'Kaydet';
            saveKnowledgeBtn.disabled = false;
        });
    }

    const settingsBtn = document.getElementById('settings-btn');
    if(settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            alert('Sistem arka planda (Netlify Backend) çalıştığı için API anahtarı ayarı artık gerekli değildir. Güvendesiniz!');
        });
    }

    // --- State Management ---
    let chats = JSON.parse(localStorage.getItem('nexus_chats')) || [];
    let currentChatId = null;

    function saveChatsToLocal() {
        localStorage.setItem('nexus_chats', JSON.stringify(chats));
        renderSidebar();
    }

    function renderSidebar() {
        if (!historyList) return;
        historyList.innerHTML = '';
        
        // Sort chats by last updated (newest first)
        const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
        
        sortedChats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            li.innerHTML = `
                <i class="ph ph-chat-teardrop-text"></i>
                <span>${escapeHTML(chat.title)}</span>
            `;
            li.addEventListener('click', () => loadChat(chat.id));
            historyList.appendChild(li);
        });
    }

    function loadChat(id) {
        currentChatId = id;
        const chat = chats.find(c => c.id === id);
        if (!chat) return;

        // Clear UI
        const allMessages = messagesContainer.querySelectorAll('.message:not(.welcome-message)');
        allMessages.forEach(msg => msg.remove());
        
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'none';
        }

        // Render messages without saving them again
        chat.messages.forEach(msg => {
            if (msg.role === 'user') {
                addUserMessage(msg.content, false);
            } else {
                addAIMessage(msg.content, false);
            }
        });

        renderSidebar();
    }

    function saveMessageToCurrentChat(role, content) {
        if (!currentChatId) {
            currentChatId = 'chat-' + Date.now();
            chats.push({
                id: currentChatId,
                title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }
        
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({ role, content });
            chat.updatedAt = Date.now();
            saveChatsToLocal();
        }
    }

    // Initialize sidebar
    renderSidebar();

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 200 ? this.scrollHeight : 200) + 'px';
        
        // Toggle send button state
        if(this.value.trim().length > 0) {
            sendBtn.style.background = 'var(--gradient-brand)';
            sendBtn.style.color = 'white';
        } else {
            sendBtn.style.background = 'var(--text-primary)';
            sendBtn.style.color = 'var(--bg-dark)';
        }
    });

    // Handle Enter key (Shift+Enter for new line)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send button click
    sendBtn.addEventListener('click', () => {
        if (chatInput.value.trim().length > 0) {
            sendMessage();
        }
    });

    // Handle suggestions click
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            chatInput.value = this.innerText;
            sendMessage();
        });
    });

    // Handle New Chat click
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            currentChatId = null;
            
            const allMessages = messagesContainer.querySelectorAll('.message:not(.welcome-message)');
            allMessages.forEach(msg => msg.remove());
            
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.style.display = 'flex';
            }
            
            chatInput.value = '';
            chatInput.style.height = 'auto';
            sendBtn.style.background = 'var(--text-primary)';
            sendBtn.style.color = 'var(--bg-dark)';
            
            renderSidebar();
        });
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Reset input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.style.background = 'var(--text-primary)';
        sendBtn.style.color = 'var(--bg-dark)';

        // Remove welcome message if exists
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.style.display = 'none';
        }

        // Add user message
        addUserMessage(text);

        // Show typing indicator
        const typingId = showTypingIndicator();

        try {
            const selectedModel = modelSelect ? modelSelect.value : 'default';
            let knowledgeContext = [];
            
            if (selectedModel === 'knowledge') {
                try {
                    const kbResponse = await fetch('/.netlify/functions/knowledge');
                    if (kbResponse.ok) {
                        const kbData = await kbResponse.json();
                        knowledgeContext = kbData.knowledge || [];
                    }
                } catch (e) {
                    console.error("Bilgi havuzu alınamadı", e);
                }
            }

            // Netlify Functions backend'ine istek atıyoruz
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    text: text,
                    model: selectedModel,
                    knowledgeContext: knowledgeContext
                })
            });

            const data = await response.json();
            removeTypingIndicator(typingId);
            
            if (response.ok) {
                addAIMessage(data.reply);
            } else {
                let errorMsg = "Bilinmeyen bir sunucu hatası oluştu.";
                if (data.error) {
                    errorMsg = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
                } else if (data.message) {
                    errorMsg = data.message;
                }
                addAIMessage("Hata: " + errorMsg);
            }
        } catch (error) {
            removeTypingIndicator(typingId);
            addAIMessage("Bağlantı hatası (Backend çalışmıyor olabilir): " + error.message);
        }
    }

    function addUserMessage(text, save = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user-message';
        msgDiv.innerHTML = `
            <div class="message-avatar">
                <img src="https://ui-avatars.com/api/?name=Kullanici&background=random&color=fff" alt="User">
            </div>
            <div class="message-content">
                <p>${escapeHTML(text)}</p>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        
        if (save) saveMessageToCurrentChat('user', text);
    }

    function addAIMessage(text, save = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai-message';
        // For simplicity, converting basic markdown-like formatting
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\n/g, '<br>');

        msgDiv.innerHTML = `
            <div class="message-avatar">
                <i class="ph-fill ph-planet"></i>
            </div>
            <div class="message-content">
                <p>${formattedText}</p>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        
        if (save) saveMessageToCurrentChat('ai', text);
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai-message';
        msgDiv.id = id;
        msgDiv.innerHTML = `
            <div class="message-avatar">
                <i class="ph-fill ph-planet"></i>
            </div>
            <div class="message-content" style="padding: 12px 24px;">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function generateMockResponse(userInput) {
        const input = userInput.toLowerCase();
        
        if (input.includes('merhaba') || input.includes('selam')) {
            return "Merhaba! Size bugün nasıl yardımcı olabilirim?";
        }
        if (input.includes('python')) {
            return "Elbette! İşte basit bir Python \"Hello World\" örneği:\n\n```python\nprint('Merhaba, NexusAI!')\n```\n\nBaşka bir Python konusu hakkında yardıma ihtiyacınız var mı?";
        }
        if (input.includes('güneş')) {
            return "**Güneş Sistemi**, Güneş ve onun çekim etkisi altında kalan sekiz gezegen, onların bilinen uyduları, cüce gezegenler ve milyarlarca küçük gökcisminden oluşur. Merkezinde sistemimizin kütlesinin %99.8'ini oluşturan Güneş yıldızı bulunur.";
        }
        if (input.includes('fikir') || input.includes('iş')) {
            return "İşte potansiyel bir iş fikri: **Yapay Zeka Destekli Kişisel Öğrenme Asistanı**.\n\nKullanıcıların öğrenme hızına ve tarzına göre özel müfredatlar oluşturan bir mobil uygulama. İnsanlar yeni diller veya programlama becerileri öğrenmek için giderek daha fazla kişiselleştirilmiş deneyimler arıyorlar.";
        }
        
        const responses = [
            "Bu harika bir soru. Detaylandırmamı ister misiniz?",
            "Anlıyorum. Bu konuya şu açıdan da yaklaşabiliriz: Yapay zeka ve otomasyon bu süreci hızlandırabilir.",
            "Kesinlikle! Başka sormak istediğiniz bir şey var mı?",
            "Bunun üzerine biraz daha düşünelim. Daha spesifik bir detay verebilir misiniz?"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
});
