var express = require('express');
var app = express();
var shell = require('shelljs');
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

var feedback = [];
var lastRunCommand = '';

io.on('connection', function (socket) {

    function emitOutput() {
        socket.emit('output', {
            output: lastRunCommand.stdout
        });
        socket.broadcast.emit('output', {
            output: lastRunCommand.stdout
        });
    }

    function emitFeeback() {
        socket.emit('feedback',
            feedback
        );
        socket.broadcast.emit('feedback',
            feedback
        );
    }
    emitFeeback();
    emitOutput();

    socket.on('Add Feedback', function (data) {
        feedback = data;
        emitFeeback();
    });

    socket.on('Execute Command', function (data) {
        lastRunCommand = shell.exec(data.command);
        emitOutput();
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
});