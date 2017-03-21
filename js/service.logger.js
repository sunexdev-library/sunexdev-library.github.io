(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .factory('logger',
        [
            'firebase', 'events',
            function (firebase, events) {

                var model = this;
                
                model.trace = function(obj) {
                    console.log(obj);
                }

                return model;
            }
        ]);
})(window.angular);
