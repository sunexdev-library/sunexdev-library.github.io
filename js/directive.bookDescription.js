(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('bookDescription', bookDescription);

    function bookDescription() {

        return {
            restrict: 'E',
            scope: {
                book: "=",
                category: "=",
                onClosed: "&",
                simpleView: "=?"
            },
            templateUrl: 'directives/bookDescription.html',
            bindToController: true,
            link: function(scope) {
                scope.$watch('vm.book',
                    function () {
                        scope.vm.refresh();
                    });
            },
            controllerAs: 'vm',
            controller: ['$window', function ($window) {
                var vm = this;
                vm.$window = $window;

                vm.selectBook = function (newBook) {
                    vm.book = newBook;
                }

                vm.refresh = function () {
                    // scroll to top
                    $('html,body').animate({ scrollTop: $('html,body').offset().top }, "slow");

                    // setup refs
                    if(vm.book) {
                        if(vm.book.getAuthor()) {
                            vm.moreFromAuthor = vm.book.getAuthor().books.slice(0, 6);
                        } else {
                            vm.moreFromAuthor = [];
                        }
                        if(vm.book.getCategory()) {
                            vm.similarBooks = vm.book.getCategory().books.slice(0, 6);
                        } else {
                            vm.similarBooks = [];
                        }
                        vm.category = vm.book.getCategory();
                    }
                }

                vm.triggerClosed = function() {
                    vm.onClosed();
                }
            }]
        }
    }

})(window.angular);
