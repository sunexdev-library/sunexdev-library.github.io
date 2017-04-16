(function (angular) {
    'use strict';

    var app = angular.module('mainModule', ['ui.router', 'ui.bootstrap', 'ngSanitize', 'ui.select']);

    app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        // define state for main page
        $stateProvider
            .state('library',
            {
                url: '/library',
                template: '<ng-include src="\'library.html\'" />',
                controller: 'libraryMainController as model'
            }).state('newbook',
            {
                url: '/newbook',
                templateUrl: '<ng-include src="library" />',
                controller: 'libraryController as model'
            });
        $urlRouterProvider.otherwise('/library');
    }]);

})(window.angular);
