const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
let apiKey = localStorage.getItem('geminiApiKey') || '';
let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (apiKey) {
        enableChat();
        updateKeyStatus('✓ API Key loaded', 'success');
    }
});

// Save API Key
function saveApiKey() {
    const key = document.getElementById('geminiApiKey').value.trim();
    if (!key) {
        updateKeyStatus('❌ Please enter an API key', 'error');
        return;
    }
    localStorage.setItem('geminiApiKey', key);
    apiKey = key;
    document.getElementById('geminiApiKey').value = '';
    enableChat();
    updateKeyStatus('✓ API Key saved successfully', 'success');
}

function updateKeyStatus(message, type) {
    const status = document.getElementById('keyStatus');
    status.textContent = message;
    status.className = `key-status ${type}`;
}

function enableChat() {
    document.getElementById('userInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('userInput').focus();
    document.getElementById('apiKeySection').style.display = 'none';
}

// Handle Enter key
document.getElementById('userInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send Message
async function sendMessage(message = null) {
    const userInput = message || document.getElementById('userInput').value.trim();
    
    if (!userInput) return;
    if (!apiKey) {
        updateKeyStatus('❌ Please add your Gemini API key first', 'error');
        return;
    }

    // Clear input
    if (!message) {
        document.getElementById('userInput').value = '';
    }

    // Add user message to UI
    addMessageToUI(userInput, 'user');
    
    // Add to chat history
    chatHistory.push({ role: 'user', content: userInput });

    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        // Prepare messages for API
        const contents = chatHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // Call Gemini API
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API request failed');
        }

        const data = await response.json();
        const botMessage = data.candidates[0].content.parts[0].text;

        // Remove typing indicator
        document.getElementById(typingId)?.remove();

        // Add bot response to UI
        addMessageToUI(botMessage, 'bot');

        // Add to chat history
        chatHistory.push({ role: 'bot', content: botMessage });

        // Add to chat history sidebar
        addToChatHistory(userInput);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById(typingId)?.remove();
        addMessageToUI(`❌ Error: ${error.message}`, 'bot');
    }
}

function addMessageToUI(message, role) {
    const container = document.getElementById('messagesContainer');
    
    // Remove welcome message if it exists
    const welcome = container.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    
    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    
    // Parse markdown-like formatting
    contentEl.innerHTML = parseMessage(message);
    
    messageEl.appendChild(contentEl);
    container.appendChild(messageEl);
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function parseMessage(text) {
    // Simple markdown parsing
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/```(.*?)```/gs, '<pre>$1</pre>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    
    return html;
}

function addTypingIndicator() {
    const container = document.getElementById('messagesContainer');
    const typingEl = document.createElement('div');
    typingEl.className = 'message bot';
    typingEl.id = 'typing-' + Date.now();
    typingEl.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
    return typingEl.id;
}

function addToChatHistory(message) {
    const history = document.getElementById('chatHistory');
    const item = document.createElement('div');
    item.className = 'history-item';
    item.textContent = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    item.onclick = () => {
        // Optional: Load this conversation
        alert('Chat history feature coming soon!');
    };
    history.insertBefore(item, history.firstChild);
}

function startNewChat() {
    chatHistory = [];
    document.getElementById('messagesContainer').innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to AI Chat</h2>
            <p>Ask me anything! I can help with:</p>
            <div class="suggestion-buttons">
                <button onclick="sendMessage('Explain quantum computing')">Quantum Computing</button>
                <button onclick="sendMessage('Write a short story')">Short Story</button>
                <button onclick="sendMessage('How to learn programming?')">Programming Tips</button>
                <button onclick="sendMessage('What is AI?')">About AI</button>
            </div>
        </div>
    `;
}