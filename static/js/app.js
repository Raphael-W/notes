document.addEventListener('DOMContentLoaded', () => {
  const socket = io();

  const textArea = document.getElementById('rawText');
  let typingTimeout;

  let lastUpdate = 0;

    // Function to handle sending the text to the server
    function sendTextUpdate() {
        socket.emit('update_text', textArea.value, (response) => {
          lastUpdate = response.time;
        });
    }

    // Debounce function: waits for `n` milliseconds after the user stops typing
    function debounce(func, delay) {
        return function() {
            clearTimeout(typingTimeout);  // Clear the previous timeout
            typingTimeout = setTimeout(func, delay);  // Set a new timeout
        };
    }

    // Update the text area with the current text whenever a message is received
    socket.on('update_text', function(response) {
        if (textArea.value !== response.text) {
            textArea.value = response.text;
            lastUpdate = response.time;
            textArea.dispatchEvent(new Event('input'));
        }
    });

    // Send text to the server when the user stops typing (after 2 seconds)
    textArea.addEventListener('input', debounce(function() {
        sendTextUpdate();
    }, 250));
});