document.addEventListener('DOMContentLoaded', (event) => {
        var socket = io();

        var textArea = document.getElementById('sharedTextArea');
        var typingTimeout;

        // Function to handle sending the text to the server
        function sendTextUpdate() {
            socket.emit('update_text', textArea.value);
        }

        // Debounce function: waits for `n` milliseconds after the user stops typing
        function debounce(func, delay) {
            return function() {
                clearTimeout(typingTimeout);  // Clear the previous timeout
                typingTimeout = setTimeout(func, delay);  // Set a new timeout
            };
        }

        // Update the text area with the current text whenever a message is received
        socket.on('update_text', function(new_text) {
            if (textArea.value !== new_text) {
                textArea.value = new_text;
            }
        });

        // Send text to the server when the user stops typing (after 2 seconds)
        textArea.addEventListener('input', debounce(function() {
            sendTextUpdate();
        }, 250));
    });