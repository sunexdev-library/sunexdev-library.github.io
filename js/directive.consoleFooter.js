(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('consoleFooter', consoleFooter);

    function consoleFooter() {

        return {
            restrict: 'E',
            scope: {
                onAddbook: "&"
            },
            templateUrl: 'directives/consoleFooter.html',
            bindToController: true,
            controllerAs: 'vm',
            controller: ['$scope','messenger', 'events', 'tagsSource', 
            function ($scope, messenger, events, tagsSource) {
                var vm = this;
                vm.hasConnection = messenger.connected;
                vm.tagsSource = tagsSource;
                vm.devices = [];

                events.subscribe(messenger, "onOpened", function() {
                    vm.hasConnection = true;
                    $scope.$apply();
                });

                events.subscribe(messenger, "onClosed", function() {
                    vm.hasConnection = false;
                    $scope.$apply();
                });

                events.subscribe(messenger, "onError", function() {
                    vm.hasConnection = false;
                    $scope.$apply();
                });

                events.subscribe(tagsSource,  'onDevicesChanged', function() {
                    vm.devices = vm.tagsSource.devices;
                    $scope.$apply();
                });

                vm.onAddbookClicked = function() {
                    vm.onAddbook();
                }
            }]
        }
    }

})(window.angular);
