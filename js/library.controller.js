(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .controller('libraryController', ['events', 'tagsSource', '$scope', 'messenger', 'firebase',
            function (events, tagsSource, $scope, messenger, firebase) {
                var model = $scope;
                
                return model;
            }
        ]);
})(window.angular);
