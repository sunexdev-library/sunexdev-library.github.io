(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .controller('indexController', [
            'events', 'tagsSource', '$scope', 'messenger', 'library', 'cache', 'search', 'firebase',

    function (events, tagsSource, $scope, messenger, library, cache, search, firebase) {

        var TMPs = {
            BOOKS_LIST: "books-list",
            BOOK_DESCRIPTION: "book-description"
        }

        var model = $scope;
        model.popupHtml = {
            templateUrl: 'directives/searchPopup.html',
            title: 'Title'
        };
        model.template = TMPs.BOOKS_LIST;
        model.tagsSource = tagsSource;
        model.db = library;
        model.cache = cache.data;
        model.__search = search;
        model.__firebase = firebase;
        model.openedBook = null;
        model.choosedCategory = null;
        model.authors = [];

        
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
            log(angular.toJson(model.devices));
            $scope.$apply();
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

        function buildCategoriesMenu(menu, categories) {

            for (var idx in categories) {
                var child = categories[idx];

                var submenu = {
                    title: child.Title,
                    action: child.id
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
                log(bookInfo);
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
            model.template = TMPs.BOOKS_LIST;
        }
        return model;
    }]);
})(window.angular);
