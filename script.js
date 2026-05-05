document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages-container');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');

    const settingsBtn = document.getElementById('settings-btn');
    if(settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            alert('Sistem arka planda (Netlify Backend) çalıştığı için API anahtarı ayarı artık gerekli değildir. Güvendesiniz!');
        });
    }

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
            // Netlify Functions backend'ine istek atıyoruz
            const response = await fetch('/.netlify/functions/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
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

    function addUserMessage(text) {
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
    }

    function addAIMessage(text) {
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
