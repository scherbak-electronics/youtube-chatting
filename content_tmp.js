let chatIframe = null;
let chatContainer = null;
let observer = null;
let isActive = false;

console.log('Content script loaded.');

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
                                if (chrome && chrome.runtime && chrome.runtime.id) {
                                    chrome.runtime.sendMessage({ action: 'newChatMessage', message: messageText }, (response) => {
                                        if (chrome.runtime.lastError) {
                                            console.error('Error sending message:', chrome.runtime.lastError);
                                        }
                                    });
                                }
                            } catch (error) {
                                console.error('Extension context invalidated or communication error:', error);
                            }
                        }
                    });
                });
            });

            const config = { childList: true, subtree: true };
            observer.observe(chatContainer, config);
            //console.log('Chat observer activated.');
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

// Handle requests from background.js
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'setupObserver') {
        setupChatObserver();
        const observerStatus = observer ? 'ok' : 'not configured';
        sendResponse({ observerStatus });
    }
    if (request.action === 'setupChatIframe') {
        setupChatIframe();
        const iframeStatus = chatIframe ? 'ok' : 'missing';
        sendResponse({ iframeStatus });
    }
    if (request.action === 'removeObserver') {
        removeChatObserver();
    }
    if (request.action === 'checkStatus') {
        // Send back the status of the iframe and observer
        const iframeStatus = chatIframe ? 'ok' : 'missing';
        const observerStatus = observer ? 'ok' : 'not configured';
        console.log('content check status');
        sendResponse({ iframeStatus, observerStatus });
    }
});
