// Create a WebSocket connection to your server (optional)
//const socket = new WebSocket('wss://your-websocket-server.com');

// Log when the WebSocket connection is open
//socket.onopen = function(event) {
//    console.log("Connected to WebSocket server");
//};

// Find the chat container where messages are displayed
const chatContainer = document.querySelector('#items');

// Check if the container exists before observing
if (chatContainer) {
    // Set up a MutationObserver to listen for added elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                // Check if the added node is a chat message
                if (node.tagName && node.tagName.toLowerCase() === 'yt-live-chat-text-message-renderer') {
                    // Get the message text
                    const message = node.innerText;

                    // Send the message to the WebSocket server (optional)
                    //socket.send(JSON.stringify({ message: message }));

                    // Log the message to the console
                    console.log('New chat message:', message);
                }
            });
        });
    });

    // Configure the observer to listen for added child elements
    const config = { childList: true, subtree: true };

    // Start observing the chat container for changes
    observer.observe(chatContainer, config);
} else {
    console.log("Chat container not found");
}
