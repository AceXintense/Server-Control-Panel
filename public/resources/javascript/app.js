var protocol = location.protocol;
var slashes = protocol.concat("//");
var host = slashes.concat(window.location.hostname);
var socket = io.connect(host);

angular.module('serverControlPanelApp', [])
    .controller('ServerControlPanelController', ['$scope', function ($scope) {
        var validTypes = [
            'error',
            'warning',
            'success',
            'default'
        ];

        $scope.showSettings = false;
        $scope.toggleSettings = function () {
            $scope.showSettings = !$scope.showSettings;
        };

        function isValidType(type) {
            for (var i = 0; i < validTypes.length; i++) {
                if (type === validTypes[i].toLowerCase()) {
                    return true;
                }
            }
            return false;
        }

        function Feedback(title, description, type) {
            type = type.toLowerCase();
            if (isValidType(type)) {
                this.title = title;
                this.description = description;
                this.type = type;
            } else {
                this.title = 'Error!';
                this.description = 'Error type ' + type + ' is not a valid type!';
                this.type = 'error';
            }
            $scope.feedback.push(this);
            socket.emit('Add Feedback', $scope.feedback);
        }

        function Modal(title, description, type) {
            this.title = title;
            this.description = description;
            this.type = type;
            $scope.modals.push(this);
            // socket.emit('Add Feedback', $scope.feedback);
        }

        function empty(value) {
            return (value === '' || value === null || value === undefined);
        }

        function checkFor(type, input) {
            switch (type) {
                case 'dangerous':
                    if(input.includes("rm")) {
                        new Modal('Warning!', 'Are you sure you would like to run this command?', 'yes-no');
                        return true;
                    } else {
                        return false;
                    }
                    break;
                case 'warning':
                    if(input.includes("sudo")) {
                        new Modal('Warning!', 'Are you sure you would like to run this command with sudo?', 'yes-no');
                        return true;
                    } else {
                        return false;
                    }
                    break;
                default:
                    console.log(type + ' Is not a type!');
                    break;
            }
        }

        $scope.commandHistory = [];

        socket.on('commandHistory', function (data) {
            $scope.$apply(function() {
                $scope.commandHistory = data.slice().reverse();
            });
        });

        $scope.modals = [];
        $scope.showModals = true;
        $scope.modalInput;
        $scope.dismissModal = function () {
            $scope.modals = [];
            $scope.modalInput = true;
            $scope.executeCommand($scope.command);
        };

        $scope.cancelModal = function () {
            $scope.modals = [];
            $scope.modalInput = false;
        };

        socket.on('showModals', function (data) {
            $scope.$apply(function() {
                $scope.showModals = data;
            });
        });

        $scope.toggleShowModals = function () {
            socket.emit('Toggle Show Modals');
        };

        $scope.output = '';
        $scope.feedback = [];

        socket.on('feedback', function (data) {
            $scope.$apply(function() {
                $scope.feedback = data;
            });
        });

        socket.on('output', function (data) {
            $scope.$apply(function() {
                $scope.output = data.output;
            });
        });

        $scope.removeFeedbackWithId = function(id) {
            if (empty(id)) {
                new Feedback('Error!', 'id is empty!', 'error');
            } else {
                socket.emit('Remove Feedback With ID', id);
            }
        };

        $scope.clearAllFeedback = function() {
            socket.emit('Clear All Feedback');
        };

        $scope.setCommand = function(command) {
            $scope.command = command;
        };

        $scope.executeCommand = function (command) {
            $scope.command = command;
            if (empty(command)) {
                new Feedback('Error!', 'Command is empty!', 'error');
            } else {
               socket.emit('Execute Command', {
                   command: command
               });
               $scope.command = '';
            }
        };

        $scope.executeCommandViaModal = function (command) {
            $scope.command = command;
            var canExecute;
            canExecute = !checkFor('dangerous', command);
            canExecute = !checkFor('warning', command);

            if (canExecute) {
                $scope.executeCommand(command);
            }
        };
    }]);

angular.element(function() {
    angular.bootstrap(document, ['serverControlPanelApp']);
});