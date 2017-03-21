(function(angular) {
    'use strict';

    angular
        .module('mainModule')
        .controller('searchPopupController',
        [
               '$scope', '$window', 'events', 'cache', 'search',
                function ($scope, $window, events, cache, search) {
                    var vm = this;
                    vm.__search = search;
                    vm.__events = events;
                    vm.__scope = $scope;
                    vm.authors = cache.data.top_authors;

                    events.subscribe(search,
                        'onSearchComplete',
                        function(data) {
                            if (data.id === 'books') {
                                if (data.authors) {
                                    vm.authors = data.authors;
                                } else {
                                    vm.authors = cache.data.top_authors;
                                }
                                vm.__scope.$apply();
                            }
                        });

                    vm.authorSelected = function(author) {
                        vm.__search.searchByAuthorId(author.id);
                        vm.__events.onMessage(null, "onPopupShouldBeClosed");
                    }

                    return vm;
                }
            ]
        );
})(window.angular);
