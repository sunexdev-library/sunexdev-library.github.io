(function(angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('addNewbook', addNewbook); 

    function addNewbook() {

        return {
            restrict: 'E',
            scope: {
                onClosed: "&"
            },
            templateUrl: 'directives/addNewbook.html',
            require: 'ngModel',
            bindToController: true,
            controllerAs: 'vm',
            controller: ['$scope', 'events', 'messenger', 'search', 'library', 'firebase', 'tagsSource', 'bestMatch', 
                function ($scope, events, messenger, search, library, firebird, tagsSource, bestMatch) {
                    var vm = this;
                    vm.__scope = $scope;
                    vm.__search = search;
                    vm.__library = library;
                    vm.__bestMatch = bestMatch;
                    vm.searchIsbnString = "";
                    vm.searchRfidString = "";
                    vm.bookNotFound = false;
                    vm.bookFound = false;
                    vm.hasPhoneConnected = false;
                    vm.loadingBookData = false;
                    vm.openedBook = null;
                    vm.rfidFound = false;

                    events.subscribe(tagsSource, 'onTagReceived', function(data) {
                                vm.searchRfidString = data.Tag;
                                vm.rfidFound = true;
                                $scope.$apply();
                            });
                    
                    vm.searchByIsbn = function() {
                        vm.loadingBookData = true;
                        vm.bookNotFound = false;
                        vm.bookFound = false; 
                        messenger.rpCall("DownloadByIsbn", [vm.searchIsbnString], function (book) {
                            if(book) {
                                let unpacked = angular.extend(vm.mapEntity(book), vm.mapEntity(book.Other));
                                vm.openedBook = unpacked; 
                                vm.bookFound = true;
                            } else {
                                vm.bookNotFound = true;
                                vm.openedBook = null;
                            }
                            vm.loadingBookData = false;
                            vm.__scope.$apply();              
                        });
                    }

                    vm.canAutofillTable = function() {
                        return vm.searchIsbnString.length > 3;
                    }

                    vm.mapEntity = function(entity) {
                        
                        var mappings = vm.__library.mappings;
                        var keys = Object.keys(entity); 
                        var mapped = {};

                        for (var i = keys.length - 1; i >= 0; i--) {
                            var key = keys[i];
                            var value = entity[key];
                            var trimmed = null;

                            if(Array.isArray(value)) {
                                trimmed = value;
                            } else {
                                trimmed = value.toString().trim();
                            }

                            if(!!mappings[key]) {
                                mapped[mappings[key]] = trimmed;
                            } else {
                                mapped[key] = trimmed;
                            }
                        }

                        return mapped;
                    }
                }
            ]
        }
    }


})(window.angular);
