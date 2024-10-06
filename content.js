/*
 * content.js
 * */
let chatIframe = null;
let chatContainer = null;
let observer = null;

const port = chrome.runtime.connect({ name: "content" });

port.onMessage.addListener((request) => {
    console.log("Message from background script:");

    if (request.action === 'setupObserver') {
        setupChatObserver();
        sendStatus();
    }
    if (request.action === 'setupChatIframe') {
        setupChatIframe();
        sendStatus();
    }
    if (request.action === 'removeObserver') {
        removeChatObserver();
    }
    if (request.action === 'checkStatus') {
        console.log('content check status');
        sendStatus();
    }
    if (request.action === 'tryToConnect') {
        console.log('content trying to connect...');
        sendTryToConnectResponse();
    }
});

function sendStatus() {
    port.postMessage({action: 'updateStatus', status: getStatus()})
}
function sendTryToConnectResponse() {
    port.postMessage({action: 'tryToConnectResponse', status: getStatus()})
}

function getStatus() {
    let chatContainerTmp;
    if (chatIframe) {
        chatContainerTmp = chatIframe.contentDocument.querySelector('#items');
    }
    return {
        iframe: chatIframe ? 'ok' : 'missing',
        observer: observer ? 'ok' : 'not configured',
        container: chatContainer === chatContainerTmp ? 'ok' : 'invalid'
    };
}
// Start observing the YouTube chat iframe and its content
function setupChatIframe() {
    if (window.self !== window.top) {
        console.log('Wrong place');
        return;
    }

    chatIframe = document.getElementById('chatframe');
    if (chatIframe) {
        console.log('iframe found');
    } else {
        console.log('iframe not found');
    }
}

// Setup the chat observer to listen for new messages
function setupChatObserver() {
    if (chatIframe) {
        chatContainer = chatIframe.contentDocument.querySelector('#items');
        if (chatContainer) {
            observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.tagName && node.tagName.toLowerCase() === 'yt-live-chat-text-message-renderer') {
                            const contentDiv = node.querySelector('div#content');
                            const messageSpan = contentDiv.querySelector('span#message');
                            const messageText = messageSpan ? messageSpan.innerText : 'No message content';
                            try {
                                port.postMessage({ action: 'newChatMessage', message: messageText });
                            } catch (error) {
                                console.log('Extension context invalidated. Refresh the page.');
                            }
                        }
                    });
                });
            });
            const config = { childList: true, subtree: true };
            observer.observe(chatContainer, config);
        } else {
            console.log('Chat container not found.');
        }
    } else {
        console.log('Chat iframe not found.');
    }
}

// Stop the chat observer
function removeChatObserver() {
    if (observer) {
        observer.disconnect();
        observer = null;
        console.log('Observer removed');
    } else {
        console.log('Observer not configured');
    }
}

console.log('Content ready');