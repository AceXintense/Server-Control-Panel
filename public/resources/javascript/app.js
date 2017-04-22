var protocol = location.protocol;
var slashes = protocol.concat("//");
var host = slashes.concat(window.location.hostname);
var socket = io.connect(host);

angular.module('serverControlPanelApp', [])
    .directive('onEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    scope.$apply(function (){
                        scope.$eval(attrs.onEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    })
    .directive('onTab', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 9) {
                    scope.$apply(function (){
                        scope.$eval(attrs.onTab);
                    });

                    event.preventDefault();
                }
            });
        };
    })
    .directive('onBackspace', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 8) {
                    scope.$apply(function (){
                        scope.$eval(attrs.onBackspace);
                    });
                }
            });
        };
    })
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
        $scope.command = '';

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

        $scope.resetTabIndex = function () {
            binTabIndex = 0;
            fileOrDirectoryTabIndex = 0;
            if ($scope.command.length === 0) {
                binTabSearch = [];
            }
        };

        $scope.binTab = [];
        $scope.fileOrDirectoryTab = [];
        socket.on('binTab', function (data) {
            $scope.$apply(function() {
                $scope.binTab = data;
            });
        });
        socket.on('fileOrDirectoryTab', function (data) {
            $scope.$apply(function() {
                $scope.fileOrDirectoryTab = data;
            });
        });
        var binTabIndex = 0;
        var fileOrDirectoryTabIndex = 0;
        var binTabSearch = [];
        $scope.getTabList = function () {
            if (binTabSearch.length <= 0) {
                for (var i = 0; i < $scope.binTab.length; i++) {
                    if ($scope.binTab[i].includes($scope.command)) {
                        binTabSearch.push($scope.binTab[i]);
                    }
                }
            }

            if ($scope.command !== undefined && $scope.command.match(/\s/g) !== null) {
                if (fileOrDirectoryTabIndex < $scope.fileOrDirectoryTab.length) {
                    if (fileOrDirectoryTabIndex > 0) {
                        $scope.command = $scope.command.replace($scope.fileOrDirectoryTab[fileOrDirectoryTabIndex - 1], $scope.fileOrDirectoryTab[fileOrDirectoryTabIndex]);
                    } else {
                        $scope.command += $scope.fileOrDirectoryTab[fileOrDirectoryTabIndex];
                    }
                    fileOrDirectoryTabIndex++;
                } else {
                    $scope.command = $scope.command.replace($scope.fileOrDirectoryTab[fileOrDirectoryTabIndex - 1], '');
                    binTabSearch = [];
                    fileOrDirectoryTabIndex = 0;
                }
            } else if ($scope.command !== undefined && $scope.command.length > 0) {
                if (binTabIndex < binTabSearch.length) {
                    if (binTabIndex > 0) {
                        $scope.command = $scope.command.replace(binTabSearch[binTabIndex - 1], binTabSearch[binTabIndex]);
                    } else {
                        $scope.command = binTabSearch[binTabIndex];
                    }
                    binTabIndex++;
                } else {
                    binTabSearch = [];
                    binTabIndex = 0;
                }
            } else {
                if (binTabIndex < $scope.binTab.length) {
                    if (binTabIndex > 0) {
                        $scope.command = $scope.command.replace($scope.binTab[binTabIndex - 1], $scope.binTab[binTabIndex]);
                    } else {
                        $scope.command = $scope.binTab[binTabIndex];
                    }
                    binTabIndex++;
                } else {
                    $scope.command = $scope.binTab[binTabIndex];
                    binTabSearch = [];
                    binTabIndex = 0;
                }
            }
        };

        $scope.workingDirectory = '';
        socket.on('workingDirectory', function (data) {
            $scope.$apply(function() {
                $scope.workingDirectory = data;
            });
        });

        $scope.commandHistory = [];

        socket.on('commandHistory', function (data) {
            $scope.$apply(function() {
                $scope.commandHistory = data.slice().reverse();
            });
        });

        $scope.purgeCommandHistory = function () {
            socket.emit('Purge Command History');
        };

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
                $scope.output = data;
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
            $scope.resetTabIndex();
            $scope.command = command;
            if (empty(command)) {
                new Feedback('Error!', 'Command is empty!', 'error');
            } else {
                socket.emit('Execute Command',
                    command
                );
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