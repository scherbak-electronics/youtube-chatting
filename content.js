
console.log('begin...');
let initialised = false;
let chatIframe = null;
let obsSocket = null;
let isActive = false;
let observer = null;
let context = '';

function startChatObserver() {
    if (window.self !== window.top) {
        //console.log('Script is running  inside an iframe (chat).');
        context = 'iframe';
    } else {
        //console.log('Script is running OUT side an iframe (chat).');
        context = 'main';
        let checkIframeInterval = setInterval(() => {
            //console.log('initialised', initialised);


            if (initialised) {
                clearInterval(checkIframeInterval);
                return;
            }

            if (chatIframe) {
                return;
            }
            chatIframe = document.getElementById('chatframe');

            if (chatIframe) {
                console.log('Chat iframe found:', chatIframe);
                chatIframe.onload = () => {
                    console.log('context 34:', context);
                    const chatContainer = chatIframe.contentDocument.querySelector('#items');
                    console.log("onload");
                    console.log('initialised', initialised);
                    // Check if the container exists before observing
                    if (chatContainer) {
                        console.log('Chat container found:', chatContainer);
                        console.log('context 41:', context);
                        // Set up a MutationObserver to listen for added elements
                        observer = new MutationObserver((mutations) => {
                            mutations.forEach((mutation) => {
                                mutation.addedNodes.forEach((node) => {
                                    // Check if the added node is a chat message

                                    if (node.tagName && node.tagName.toLowerCase() === 'yt-live-chat-text-message-renderer') {

                                        initialised = true;
                                        const contentDiv = node.querySelector('div#content');
                                        console.log('context 52:', context);
                                        if (contentDiv) {
                                            const authorSpan = contentDiv.querySelector('span#author-name');
                                            const authorName = authorSpan ? authorSpan.innerText : 'Unknown Author';
                                            const messageSpan = contentDiv.querySelector('span#message');
                                            const messageText = messageSpan ? messageSpan.innerText : 'No message content';
                                            console.log('context 58:', context);
                                            console.log('Author:', authorName);
                                            console.log('Message:', messageText);
                                            setText('chat_text', messageText);
                                            if (messageText.toLowerCase().includes("!switchscene")) {
                                                console.log("Switching scene in OBS...");
                                                // Send a command to OBS to switch to a scene named "Scene 2"
                                                switchScene('Scene 2');
                                            }
                                        }
                                    }
                                });
                            });
                        });

                        // Configure the observer to listen for added child elements
                        const config = { childList: true, subtree: true };
                        console.log('context 75:', context);
                        // Start observing the chat container for changes
                        observer.observe(chatContainer, config);
                        connectToOBS();
                        // Stop the interval once the iframe is found
                        clearInterval(checkIframeInterval);
                        console.log('initialised after observer', initialised);
                        initialised = true;
                    } else {
                        console.log("Chat container not found");
                    }
                };
            } else {
                console.log("Chat iframe not found");
            }
        }, 5000); // Check every 1 second
    }
}

function connectToOBS() {
    obsSocket = new WebSocket('wss://192.168.1.14');  // Connect to OBS WebSocket

    // Event handler for WebSocket connection open
    obsSocket.onopen = function() {
        console.log('WebSocket connection to OBS established.');
        // Optionally, you can authenticate here if OBS WebSocket has authentication enabled.
        const identifyMessage = {
        "op": 1,
        "d": {
                "rpcVersion": 1  // RPC version 1 is required; no authentication field since password is disabled
            }
        };

        obsSocket.send(JSON.stringify(identifyMessage));
    };

    // Event handler for receiving messages from OBS
    obsSocket.onmessage = async function(event) {
        console.log('Message from OBS:', event.data);
        const message = JSON.parse(event.data);
        //const password = 'BGidPIPD9eSsITPv';
        // Handle the authentication challenge
        if (message.op === 8) {  // The server sent an authentication challenge
            console.log('Authentication challenge received:', message);

            // Step 1: SHA-256 hash the password
            //const sha256Password = await sha256(password);

            // Step 2: Concatenate the SHA-256 password hash with the challenge salt and hash it again
            //const combined = sha256Password + message.d.authentication.challenge;
            //const authResponse = await sha256(combined);

            // Send the authentication request back to OBS
            //obsSocket.send(JSON.stringify({
            //    "op": 1,  // Authentication request
            //    "d": {
            //        "rpcVersion": 1,
            //        "authentication": authResponse
            //    }
            //}));
        } else if (message.op === 2) {
            console.log('Authenticated successfully with OBS!');
        }
    };

    // Event handler for WebSocket close
    obsSocket.onclose = function() {
        console.log('WebSocket connection to OBS closed.');
    };

    // Event handler for WebSocket error
    obsSocket.onerror = function(error) {
        console.error('WebSocket Error:', error);
    };
}

function switchScene(scene) {
    if (obsSocket && obsSocket.readyState === 1) {
        obsSocket.send(JSON.stringify({
            "op": 6,  // Request type
            "d": {
                "requestType": "SetCurrentProgramScene",
                "requestId": generateRequestId(),
                "requestData": {
                    "sceneName": scene  // Scene to switch to
                }
            }
        }));
    } else {
        console.log('Error, connection closed');
    }
}

function setText(sourceName, text) {
    if (obsSocket && obsSocket.readyState === 1) {
        obsSocket.send(JSON.stringify({
            "op": 6,
            "d": {
                "requestType": "SetInputSettings",
                "requestId": generateRequestId(),
                "requestData": {
                    "inputName": sourceName,  // Name of your text source in OBS
                    "inputSettings": {
                        "text": text  // The new text to display
                    }
                }
            }
        }));
    } else {
        console.log('Error, connection closed');
    }
}

function activateExtension() {
    if (window.self !== window.top) {
        console.log('Script is running in wrong place!');
        return;
    }
    if (isActive || initialised) return;  // Already active, do nothing

    console.log('Activating extension...');
    isActive = true;

    // Start observing YouTube chat messages
    startChatObserver();
}

function deactivateExtension() {
    if (window.self !== window.top) {
        console.log('Script is running in wrong place!');
        return;
    }
    if (!isActive) return;  // Already inactive, do nothing

    console.log('Deactivating extension...');

    // Disconnect WebSocket from OBS
    if (obsSocket && obsSocket.readyState === 1) {
        obsSocket.close();
        console.log('WebSocket connection to OBS closed.');
    }

    // Stop observing chat messages
    if (observer) {
        observer.disconnect();
        console.log('Chat observer disconnected.');
    }
    isActive = false;
    initialised = false;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'activate') {
        activateExtension();
    } else if (request.action === 'deactivate') {
        deactivateExtension();
    }
});
function generateRequestId() {
    return `request-${Date.now()}`;  // Use current timestamp as requestId
}