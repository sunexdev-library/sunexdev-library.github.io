(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('signin', signin);

    function signin() {

        return {
            restrict: 'E',
            scope: {
                onSignin: "&"
            },
            templateUrl: 'directives/signin.html',
            bindToController: true,
            controllerAs: 'vm',
            controller: ['$window', 'firebase', '$scope', function ($window, firebase, $scope) {
                var vm = this;
                vm.__firebase = firebase;
                vm.__scope = $scope;
                vm.wrongPassword = false;
                vm.username = null;
                vm.password = null;

                vm.login = function() {
                    vm.wrongPassword = false;
                    vm.__firebase.signin(vm.username, vm.password)
                     .then(
                        function(){
                          vm.onSignin();
                          vm.__scope.$apply();
                        },
                        function(error) {
                          // Handle Errors here.
                          var errorCode = error.code;
                          var errorMessage = error.message;
                          if (errorCode === 'auth/wrong-password') {
                            vm.wrongPassword = true;
                            vm.__scope.$apply();
                          } else {
                            alert(errorMessage);
                          }
                          console.log(error);
                        }
                    ); 
                }

                return vm;
            }]
        }
    }

})(window.angular);
