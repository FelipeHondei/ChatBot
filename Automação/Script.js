// Elementos da interface
const welcomeScreen = document.getElementById('welcomeScreen');
const apiUrlInit = document.getElementById('apiUrlInit');
const apiErrorInit = document.getElementById('apiErrorInit');
const startChatBtn = document.getElementById('startChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInputArea = document.getElementById('chatInputArea');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const connectionStatus = document.getElementById('connectionStatus');
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const overlay = document.getElementById('overlay');
const closeSettings = document.getElementById('closeSettings');
const apiUrl = document.getElementById('apiUrl');
const apiError = document.getElementById('apiError');
const saveSettings = document.getElementById('saveSettings');
// Estado do app
let currentApiUrl = '';
let isConnected = false;
// Inicializar com URL salva, se existir
window.addEventListener('DOMContentLoaded', () => {
    const savedApiUrl = localStorage.getItem('chatbotApiUrl');
    if (savedApiUrl) {
        apiUrlInit.value = savedApiUrl;
        apiUrl.value = savedApiUrl;
    }
});
// Funções de utilidade
function formatTimestamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
// Verificar conexão com a API
async function checkApiConnection(url) {
    try {
        const response = await fetch(`${url}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }

        const data = await response.json();
        return data.status === 'healthy' && data.chatbot_initialized;
    } catch (error) {
        console.error("Erro ao verificar conexão:", error);
        return false;
    }
}
// Conectar ao chatbot
async function connectToChatbot(url) {
    const isConnected = await checkApiConnection(url);
    if (isConnected) {
        currentApiUrl = url;
        localStorage.setItem('chatbotApiUrl', url);
        updateConnectionStatus(true);
        return true;
    } else {
        updateConnectionStatus(false);
        return false;
    }
}
// Atualizar status de conexão
function updateConnectionStatus(connected) {
    isConnected = connected;
    connectionStatus.textContent = connected ? 'Conectado' : 'Desconectado';
    connectionStatus.className = connected ?
        'connection-status status-connected' :
        'connection-status status-disconnected';
    // Habilitar/desabilitar entrada
    sendButton.disabled = !connected;
    chatInput.disabled = !connected;

    if (!connected) {
        chatInput.placeholder = "Sem conexão com a API...";
    } else {
        chatInput.placeholder = "Digite sua mensagem...";
    }
}
// Eventos
// Iniciar chat
startChatBtn.addEventListener('click', async () => {
    const url = apiUrlInit.value.trim();
    if (!url) {
        apiErrorInit.textContent = "Por favor, insira uma URL";
        apiErrorInit.style.display = 'block';
        return;
    }
    const connected = await connectToChatbot(url);

    if (connected) {
        welcomeScreen.style.display = 'none';
        chatMessages.style.display = 'flex';
        chatInputArea.style.display = 'flex';

        // Adicionar a primeira mensagem do bot
        addBotMessage("Olá! Como posso ajudá-lo hoje?");
        apiErrorInit.style.display = 'none';
    } else {
        apiErrorInit.textContent = "Não foi possível conectar à API";
        apiErrorInit.style.display = 'block';
    }
});
// Abrir configurações
settingsButton.addEventListener('click', () => {
    settingsPanel.style.display = 'block';
    overlay.style.display = 'block';
    apiUrl.value = currentApiUrl;
});
// Fechar configurações
closeSettings.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    overlay.style.display = 'none';
});
// Fechar configurações ao clicar fora
overlay.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    overlay.style.display = 'none';
});
// Salvar configurações
saveSettings.addEventListener('click', async () => {
    const url = apiUrl.value.trim();
    if (!url) {
        apiError.textContent = "Por favor, insira uma URL";
        apiError.style.display = 'block';
        return;
    }
    const connected = await connectToChatbot(url);

    if (connected) {
        settingsPanel.style.display = 'none';
        overlay.style.display = 'none';
        apiError.style.display = 'none';
    } else {
        apiError.textContent = "Não foi possível conectar à API";
        apiError.style.display = 'block';
    }
});
// Enviar mensagem
function sendMessage() {
    if (!isConnected) {
        return;
    }
    const message = chatInput.value.trim();
    if (message) {
        addUserMessage(message);
        chatInput.value = '';
        showTypingIndicator();

        // Enviar para a API
        fetch(`${currentApiUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                hideTypingIndicator();
                addBotMessage(data.response);
            })
            .catch(error => {
                console.error("Erro na requisição:", error);
                hideTypingIndicator();
                addBotMessage("Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.");
                updateConnectionStatus(false);
            });
    }
}
// Adicionar eventos de envio
sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
// Habilitar botão de envio quando houver texto
chatInput.addEventListener('input', () => {
    if (isConnected) {
        sendButton.disabled = chatInput.value.trim() === '';
    }
});
// Funções para adicionar mensagens
function addUserMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.textContent = text;
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp();
    messageElement.appendChild(timestamp);

    chatMessages.appendChild(messageElement);
    scrollToBottom();
}
function addBotMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot-message';
    messageElement.textContent = text;
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTimestamp();
    messageElement.appendChild(timestamp);

    chatMessages.appendChild(messageElement);
    scrollToBottom();
}
// Funções para mostrar/esconder o indicador de digitação
function showTypingIndicator() {
    typingIndicator.style.display = 'block';
    scrollToBottom();
}
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}
// Rolar para o final da conversa
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
// Verificação periódica da conexão
setInterval(async () => {
    if (currentApiUrl && isConnected) {
        const stillConnected = await checkApiConnection(currentApiUrl);
        if (!stillConnected) {
            updateConnectionStatus(false);
            addBotMessage("Conexão com a API perdida. Verifique as configurações.");
        }
    }
}, 30000); // Verificar a cada 30 segundos
// Carregar histórico de conversas inicialmente
async function loadConversationHistory() {
    if (!isConnected || !currentApiUrl) {
        return;
    }
    try {
        const response = await fetch(`${currentApiUrl}/api/history?limit=5`);
        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }

        const data = await response.json();
        const history = data.history || [];

        // Limpar mensagens existentes
        chatMessages.innerHTML = '';

        // Adicionar histórico recente (em ordem inversa para mostrar mais recentes por último)
        history.reverse().forEach(entry => {
            addUserMessage(entry.user_message);
            addBotMessage(entry.ai_response);
        });

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
    }
}