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
                    vm.internal = null;

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

                    vm.finishBookAdd = function() {

                        var selectedAuthor = vm.internal.selectedAuthor;
                        var selectedCategory = vm.internal.selectedCategory;
                        var selectedStorage = vm.internal.selectedStorage;
                        var selectedPublisher = vm.internal.selectedPublisher;
                        var selectedLanguage = vm.internal.selectedLanguage;
                        var selectedSeries = vm.internal.selectedSeries;    

                        var author_id, category_id, storage_id, publisher_id, language_id, series_id;

                        console.log("Saving new book:");
                        console.log("selectedAuthor:"); console.log(selectedAuthor);
                        console.log("selectedCategory:"); console.log(selectedCategory);
                        console.log("selectedStorage:"); console.log(selectedStorage);
                        console.log("selectedPublisher:"); console.log(selectedPublisher);
                        console.log("selectedLanguage:"); console.log(selectedLanguage);
                        console.log("selectedSeries:"); console.log(selectedSeries);

                        // Author
                        if(!selectedAuthor.id) {
                            author_id = vm.__library.addRowToTable('authors', {Name: selectedAuthor.Name});
                        } else {
                            author_id = selectedAuthor.id; 
                        }

                        // Category
                        if(!selectedCategory.id) {
                            category_id = vm.__library.addRowToTable('categories', {
                                    Name: selectedCategory.Name,
                                    Title: selectedCategory.Name,
                                    Ordering: 0,
                                    Access: 0,
                                    Parent_id: 0
                                });
                        } else {
                            category_id = selectedCategory.id; 
                        }

                        // Storage
                        if(!selectedStorage.id) {
                            storage_id = vm.__library.addRowToTable('storages', {
                                    Name: selectedStorage.Name
                                });
                        } else {
                            storage_id = selectedStorage.id; 
                        }

                        // Publisher
                        if(!selectedPublisher.id) {
                            publisher_id = vm.__library.addRowToTable('publishers', {
                                    Name: selectedPublisher.Name,
                                    Fullname: selectedPublisher.Name,
                                    Logo: "",
                                    Address: "Россия",
                                    About: ""
                                });
                        } else {
                            publisher_id = selectedPublisher.id; 
                        }
                        
                        // Language 
                        if(!selectedLanguage.id) {
                            language_id = vm.__library.addRowToTable('langs', {
                                    Name: selectedLanguage.Name
                                });
                        } else {
                            language_id = selectedLanguage.id; 
                        }  

                        // Series
                        if(!selectedSeries.id) {
                            series_id = vm.__library.addRowToTable('series', {
                                    Name: selectedSeries.Name
                                });
                        } else {
                            series_id = selectedSeries.id; 
                        }

                        var book = {
                            Authors: "",
                            Bookid: vm.searchRfidString,
                            Comment: vm.internal.book.Description,
                            Id_author: author_id,
                            Id_cat: category_id,
                            Id_language: language_id,
                            Id_publisher: publisher_id,
                            Id_series: series_id,
                            Id_store: storage_id,
                            ImageURL: vm.internal.book.ImageUri,
                            Isbn: vm.internal.book.Isbn,
                            Language: "",
                            Manufacturer: "",
                            Ordering: 0,
                            Release_Date: vm.internal.book.ReleaseDate,
                            Series: "",
                            Title: vm.internal.book.Title,
                            URL: ""
                        };

                        vm.__library.addRowToTable('books', book);                        
                    }
                }
            ]
        }
    }


})(window.angular);
