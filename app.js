var express = require('express');
var app = express();
var shell = require('shelljs');
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);
app.use(express.static('public'));
console.log('Server created on port 80. Access it here http://localhost');

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

var feedback = [];
var lastRunCommand = '';
var showModals = true;
var commandHistory = [];

io.on('connection', function (socket) {

    function emitOutput() {
        socket.emit('output', {
            output: lastRunCommand.stdout
        }).broadcast.emit('output', {
            output: lastRunCommand.stdout
        });
    }

    function emitFeeback() {
        socket.emit('feedback',
            feedback
        ).broadcast.emit('feedback',
            feedback
        );
    }

    function emitModals() {
        socket.emit('showModals',
            showModals
        ).broadcast.emit('showModals',
            showModals
        );
    }

    function emitCommandHistory() {
        socket.emit('commandHistory',
            commandHistory
        ).broadcast.emit('commandHistory',
            commandHistory
        );
    }
    emitOutput();
    emitFeeback();
    emitModals();
    emitCommandHistory();

    socket.on('Add Feedback', function (data) {
        feedback = data;
        emitFeeback();
    });

    socket.on('Execute Command', function (data) {
        lastRunCommand = shell.exec(data.command);
        commandHistory.push(data.command);
        emitOutput();
        emitCommandHistory();
    });

    socket.on('Remove Feedback With ID', function (data) {
        if (feedback.length > 1) {
            feedback = feedback.splice(data, 1);
        } else {
            feedback = [];
        }
        emitFeeback();
    });

    socket.on('Clear All Feedback', function () {
        feedback = [];
        emitFeeback();
    });

    socket.on('Toggle Show Modals', function () {
        showModals = !showModals;
        emitModals();
    });
});