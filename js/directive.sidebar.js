(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('sidebar', sidebar);

    function sidebar() {

        return {
            restrict: 'E',
            scope: {
                topAuthors: "=",
                topStorages: "=",
                topCategories: "="
            },
            templateUrl: 'directives/sidebar.html',
            bindToController: true,
            controllerAs: 'vm',
            controller: ['$window', 'search', function ($window, search) {
                var vm = this;
                vm.__search = search;

                vm.searchByAuthor = function (author) {
                    vm.__search.searchByAuthorId(author.id);
                }

                vm.searchByStorage = function (storage) {
                    vm.__search.searchByStorageId(storage.id);
                }

                vm.searchByCategory = function (category) {
                    vm.__search.searchByCategoryId(category.id);
                }

                return vm;
            }]
        }
    }

})(window.angular);
