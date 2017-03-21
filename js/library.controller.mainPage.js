(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .controller('libraryMainController', ['events', 'tagsSource', '$scope', 'messenger', 'firebase',
            function (events, tagsSource, $scope, messenger, firebase) {
                var model = this;

                model.tagsSource = tagsSource;
                model.messages = [];
                model.devices = [];
                model.db = firebase;


                events.subscribe(messenger, 'onOpened', function () {
                });

                events.subscribe(tagsSource, 'onDevicesChanged', function () {
                    model.devices = model.tagsSource.devices;
                    log(angular.toJson(model.devices));
                    $scope.$apply();
                });

                model.rpCall = function () {
                    messenger.rpCall("DownloadByIsbn", ["9785953947923"], function (bookInfo) {
                        log(bookInfo);
                    });
                }

                function log(x) {
                    console.log(x);
                    model.messages.push(x);
                }

                return model;
            }
        ]);
})(window.angular);
