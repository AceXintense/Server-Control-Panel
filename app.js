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
var workingDirectory = '';

io.on('connection', function (socket) {

    function emitOutput() {
        socket.emit('output',
            lastRunCommand
        ).broadcast.emit('output',
            lastRunCommand
        );
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
    function emitWorkingDirectory() {
        workingDirectory = shell.exec("pwd");
        socket.emit('workingDirectory',
            workingDirectory
        ).broadcast.emit('workingDirectory',
            workingDirectory
        );
    }
    function emitBinTab() {
        var binDirectory = shell.exec("ls -1a /bin");
        var files = binDirectory.match(/\w+/g);
        socket.emit('binTab',
            files
        ).broadcast.emit('binTab',
            files
        );
    }
    function emitFileOrDirectoryTab() {
        var fileOrDirectory = shell.exec("ls -1a");
        var files = fileOrDirectory.match(/[.|\w]\w+/g);
        socket.emit('fileOrDirectoryTab',
            files
        ).broadcast.emit('fileOrDirectoryTab',
            files
        );
    }
    emitOutput();
    emitFeeback();
    emitModals();
    emitCommandHistory();
    emitWorkingDirectory();
    emitBinTab();
    emitFileOrDirectoryTab();

    socket.on('Add Feedback', function (data) {
        feedback = data;
        emitFeeback();
    });

    socket.on('Execute Command', function (data) {
        lastRunCommand = shell.exec(data);
        commandHistory.push(data);
        emitOutput();
        emitCommandHistory();
        emitWorkingDirectory();
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

    socket.on('Purge Command History', function () {
        commandHistory = [];
        emitCommandHistory();
    });
});