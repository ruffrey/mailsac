'use strict';
/*!
 * Mailsac, copyright (c) 2012 - 2015 Jeff Parrish
 * MIT License
 */
var mailsac = angular.module('mailsac', []);

function byReceived(a, b) {
    var da = +new Date(a.received);
    var db = +new Date(b.received);
    if (da > db) return -1;
    if (db > da) return 1;
    return 0;
}

mailsac.directive('msEnter', function () {
    return {
        link: function (scope, element, attrs) {
            element.bind("keypress", function (event) {
                if (event.which === 13 && !event.shiftKey) {
                    scope.$apply(function () {
                        scope.$eval(attrs.msEnter);
                    });
                    event.preventDefault();
                }
            });
        }
    };
});

mailsac.controller('GlobalController', ['$rootScope', function ($rootScope) {
    $rootScope.unreadCounter = 0;
    $rootScope.notifications = [];
    $rootScope.path = window.location.pathname;
    $rootScope.moment = moment;
    $rootScope.loc = window.location;

    $rootScope.navToInbox = function (prefix, postfix) {
        if (!prefix) return;
        if (prefix.indexOf('@') !== -1) {
            window.open('/inbox/' + prefix, '_self');
            return;
        }
        if (!postfix) postfix = '@mailsac.com';
        window.open('/inbox/' + prefix + postfix, '_self');
    };
}]);

mailsac.controller('DashController', ['$rootScope', '$scope', '$log', '$http', function ($rootScope, $scope, $log, $http) {
    $scope.checkEmail = '';
    $scope.emailIsOk = false;
    $scope.Math = Math;
    $rootScope.checkAvail = function () {
        var emailMightBeValid = $scope.checkEmail
            && $scope.checkEmail.indexOf('@') !== -1
            && $scope.checkEmail.split('@')[1].indexOf('.') !== -1;
        if (emailMightBeValid) {
            $http.get('/api/addresses/' + encodeURIComponent($scope.checkEmail) + '/availability')
            .success(function (data) {
                $scope.emailIsOk = data.available && data.email === $scope.checkEmail;
            })
            .error(function (err) {
                $log.error(err);
            });
        }
        else {
            $scope.emailIsOk = false;
        }
    };
}]);

mailsac.controller('InboxController', [
    '$rootScope', '$scope', '$http', '$sce', '$timeout',
    function ($rootScope, $scope, $http, $sce, $timeout) {
        $scope.inbox;
        $scope.messages = null;
        $scope.trustAsHtml = $sce.trustAsHtml;

        $http
        .get('/api/addresses/' + encodeURIComponent($scope.inbox) + '/messages')
        .success(function (data) {
            $scope.messages = data.sort(byReceived);
        })
        .error(function (err) {
            $rootScope.notifications.push(err.data ? err.data.error : err);
            $scope.messages = [];
        });

        $scope.deleteMessage = function (msg) {
            for (var i=0; i < $scope.messages.length; i++) {
                if (msg._id === $scope.messages[i]._id) {
                    $scope.messages.splice(i, 1);
                    break;
                }
            }
            $http({
                url: '/api/addresses/' + msg.inbox + '/messages/' + msg._id,
                method: 'delete'
            })
            .error(function (err) {
                $scope.messages.push(msg);
                $scope.messages.sort(byReceived);
            });
        };

        $scope.toggleStar = function ($index, $event) {
            $event.stopPropagation();
            var messageId = $scope.messages[$index]._id;
            $scope.messages[$index].savedBy = !$scope.messages[$index].savedBy;
            $http({
                url: '/api/addresses/' + encodeURIComponent($scope.inbox)
                    + '/messages/' + messageId + '/star',
                method: 'put'
            })
            .success(function (message) {
                $scope.messages[$index].savedBy = message.savedBy;
            })
            .error(function (err) {
                $rootScope.notifications.push(err.message || err.error);
                // change it back
                $scope.messages[$index].savedBy = !$scope.messages[$index].savedBy;
            });
        };

    }
]);
