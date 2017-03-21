(function(angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('booksList', booksList); 

    function booksList() {

        return {
            restrict: 'E',
            scope: {
                onBookSelected: "&",
                selectedBook: "="
            },
            templateUrl: 'directives/booksList.html',
            require: 'ngModel',
            bindToController: true,
            controllerAs: 'vm',
            controller: [
            '$scope', 'events', 'search', 
                function ($scope, events, search) {
                    var vm = this;
                    vm.__scope = $scope;
                    vm.__search = search;
                    vm.allowBack = false;
                    vm.allowNext = false;
                    vm.pagesList = [];
                    vm.wholeList = [];
                    vm.booksPerPage = 12;
                    vm.currentPage = 0;
                    vm.authors = [];
                    vm.booksList = [];

                    events.subscribe(search, "onSearchComplete", onSearchComplete);

                    function onSearchComplete(searchData) {

                        vm.wholeList = searchData.results;
                        vm.authors = searchData.authors;
                        
                        setupPages();

                        $scope.$apply();
                    }

                    function setupPages() {
                        vm.pagesList = [];
                        var pagesCount = Math.floor(vm.wholeList.length / vm.booksPerPage);

                        for (var i = 0; i < pagesCount; i++) {
                            vm.pagesList.push({ page: i, active: i === 0 });
                        }

                        vm.setPage(0);
                    }

                    vm.setPage = function (page) {
                        var idx = page;
                        var startIdx = idx * vm.booksPerPage;

                        vm.currentPage = idx;
                        vm.allowBack = idx !== 0;
                        vm.allowNext = idx !== (vm.pagesList.length - 1);
                        vm.booksList = vm.wholeList.slice(startIdx, startIdx + vm.booksPerPage);
                    }

                    vm.selectBook = function(book) {
                        vm.selectedBook = book;
                        vm.onBookSelected();
                    }
                }
            ]
        }
    }


})(window.angular);
