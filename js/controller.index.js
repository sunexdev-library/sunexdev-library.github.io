(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .controller('indexController', [
            'events', 'tagsSource', '$scope', 'messenger', 'library', 'cache', 'search', 'firebase',

    function (events, tagsSource, $scope, messenger, library, cache, search, firebase) {

        var TMPs = {
            BOOKS_LIST: "books-list",
            BOOK_DESCRIPTION: "book-description",
            ADD_NEW_BOOK: "add-new-book",
            SIGNIN: "signin",
            PHONESCAN: "phone-scan"
        }

        var model = $scope;
        window.controller = model;

        model.popupHtml = {
            templateUrl: 'directives/searchPopup.html',
            title: 'Title'
        };
        model.template = TMPs.SIGNIN;
        model.tagsSource = tagsSource;
        model.db = library;
        model.cache = cache.data;
        model.__search = search;
        model.__firebase = firebase;
        model.openedBook = null;
        model.choosedCategory = null;
        model.isSignedIn = false;
        model.authors = [];
        model.hasDesktopConnected = false;
        
        model.menus = []; // end menus
        model.navfn = function (action) {
            model.__search.searchByCategoryId(action);
        }; // end navfn

        $scope.$applyAsync();

        $scope.$watch("openedBook", function () {
            if (model.openedBook) {
                model.selectBook();
            }
        });

        // Todo: Cross device communication
        events.subscribe(firebase, 'onSyncMessage', function(data) {
            if(data === 'desktop-connected') {
                firebase.sendSyncMessage('phone-connected');
                model.hasDesktopConnected = true;
                console.log('[SCAN] Desktop connected');
            }
            if(data == 'phone-startscan') {
                model.template = TMPs.PHONESCAN;
                console.log('[SCAN] Start scan');
            }
            if(data == 'init') {
                firebase.sendSyncMessage('phone-connected');
            }
            $scope.$apply();
        });
        firebase.sendSyncMessage('init');

        events.subscribe(search, "onSearchComplete", function (res) {
            model.openSearchResults();
            if (res.id === 'categories') {
                model.choosedCategory = res.category;
            } else {
                model.choosedCategory = undefined;
                model.authors = res.authors;
            }
        });

        events.subscribe(model.__firebase, "onTableLoaded",
            function (res) {
                if (res === 'categories') {
                    $scope.menus = buildCategoriesMenu([], model.db.rootCategories());
                }
            });

        events.subscribe(null, "onPopupShouldBeClosed", function() {
            model.searchFieldFocused = false;
            model.$apply();
        });

        events.subscribe(messenger, 'onOpened', function() {
        });

        events.subscribe(tagsSource, 'onDevicesChanged', function() {
            model.devices = model.tagsSource.devices;
            console.log(angular.toJson(model.devices));
            $scope.$apply();
        });

        // Book lookup event: tag received
        events.subscribe(tagsSource, 'onTagReceived', function(data) {
            if(model.template === TMPs.BOOKS_LIST) {
                if(model.searchString && data.PermanentScanning !== true) {
                    model.searchString = model.searchString + ", " + data.Tag;
                } else {
                    model.searchString = data.Tag;
                }
                
                events.onMessage(null, "onPopupShouldBeClosed");
                model.startSearch(model.searchString);
                $scope.$apply();
            }
        });

        // Book lookup event: tag lost
        events.subscribe(tagsSource, 'onTagLost', function(data) {
            if(model.searchString && model.searchString.trim() !== "" && data.PermanentScanning === true) {
                model.searchString = model.searchString
                    .replace(", "+data.Tag, "").replace(data.Tag, "")
                    .replace(", "+data.Tag.toLowerCase(), "").replace(data.Tag.toLowerCase(), "");
                if(model.template === TMPs.BOOKS_LIST) {
                    model.startSearch(model.searchString);
                    $scope.$apply();
                }
            }
        });

        // Getting search strings when lookuping by Ids
        events.subscribe(model.__search, 'onSearchComplete', function(data) {
            model.searchString = data.searchString;
        });

        initializeWorkWithCache();

        function initializeWorkWithCache() {
            events.subscribe(cache, "onDirtyUpdated", function (data) {
                model.cache = data;
                model.__search.searchByUnpackedBooksList(data.rnd_books);
            });

            events.subscribe(cache, "onUpdated", function (data) {
                model.cache = data;
            });
        }

        function sumBooks(submenu) {
            let sum = submenu.category.books.length;
            if(submenu.menu) {
                for (var idx in submenu.menu) {
                    sum = sum + sumBooks(submenu.menu[idx]);
                }
            }
            return sum;
        }

        function buildCategoriesMenu(menu, categories) {

            for (var idx in categories) {
                var child = categories[idx];

                let submenu = {
                    title: child.Title,
                    category: child,
                    action: child.id,
                    getCount: function() {
                        if(submenu.category.books) {
                            return sumBooks(submenu);
                        }
                        return 0;
                    }
                };

                if (child.children) {
                    submenu.menu = [];
                    buildCategoriesMenu(submenu.menu, child.children);
                }

                menu.push(submenu);
            }

            return menu;
        }

        model.rpCall = function () {
            model.$apply();
            messenger.rpCall("DownloadByIsbn", ["9785953947923"], function (bookInfo) {
                console.log(bookInfo);
            });
        }

        model.startSearch = function (str) {
            model.__search.searchInBooks(str, true);
        }

        model.searchByCategory = function(cat) {
            model.__search.searchByCategoryId(cat.id);
        }

        model.selectBook = function () {
            model.template = TMPs.BOOK_DESCRIPTION;
            model.choosedCategory = model.openedBook.getCategory();
        }

        model.openSearchResults = function() {
            if(model.isSignedIn) {
                model.template = TMPs.BOOKS_LIST;
            }
        }

        model.signedIn = function() {
            model.isSignedIn = true;
            model.template = TMPs.BOOKS_LIST;
        }

        model.openAddNewBook = function() {
            model.template = TMPs.ADD_NEW_BOOK;
        }

        return model;
    }]);
})(window.angular);
