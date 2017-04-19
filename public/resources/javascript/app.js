var socket = io.connect('http://localhost');

angular.module('serverControlPanelApp', [])
    .controller('ServerControlPanelController', ['$scope', function ($scope) {
        var validTypes = [
            'error',
            'warning',
            'success',
            'default'
        ];

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

        function empty(value) {
            return (value === '' || value === null || value === undefined);
        }

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

        $scope.executeCommand = function (command) {
            if (empty(command)) {
                new Feedback('Error!', 'Command is empty!', 'error');
            } else {
               socket.emit('Execute Command', {
                   command: command
               });
            }
        };
    }]);

angular.element(function() {
    angular.bootstrap(document, ['serverControlPanelApp']);
});