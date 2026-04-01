from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import time
from pathlib import Path

app = Flask(__name__)
socketio = SocketIO(app)

notes_file = Path("text.md")
notes_file.touch(exist_ok = True)

with open(notes_file, "r") as file:
    currentText = "".join(file.readlines())

@app.route('/')
def index():
    newText = request.args.get('text')
    handleNewText(newText)
    return render_template('index.html', username=newText)


@app.route('/updateText', methods=['POST'])
def updateText():
    newText = request.json.get('text')
    handleNewText(newText)
    return {'time': time.time()}

@socketio.on('update_text')
def handleTextUpdate(newText):
    global currentText
    
    currentText = newText
    emit('update_text', {'text': newText, 'time': time.time()}, broadcast=True, include_self = False)  # Send updated text to all clients
    updateTextFile(newText)
    return {'time': time.time()}

@socketio.on('connect')
def send_current_text():
    emit('update_text', {'text': currentText, 'time': time.time()})  # Send the current text to a newly connected client

def handleNewText(newText):
    global currentText

    if newText:
        newLine = "\n"
        if currentText == "":
            newLine = ""

        newText = newText.replace("\\n", "\n")
        currentText += newLine + newText
        socketio.emit('update_text', currentText)
        updateTextFile(currentText)

def updateTextFile(newText):
    with open("text.md", "w") as file:
        file.write(newText)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=56969)
