(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('phonescan', phonescan);

    function phonescan() {

        return {
            restrict: 'E',
            scope: {
            },
            templateUrl: 'directives/phoneScan.html',
            bindToController: true,
            controllerAs: 'vm',
            controller: ['$window', 'firebase', '$scope', function ($window, firebase, $scope) {
                var vm = this;
                vm.__firebase = firebase;
                vm._scanner = null;
                
                vm.init = function() {
                    vm.attachListeners();
                }

                vm.decode = function(file) {

                    Quagga
                        .decoder({readers: ['ean_reader']})
                        .locator({patchSize: 'medium'})
                        .fromSource(file, {size: 800})
                        .toPromise()
                        .then(function(result) {
                            document.querySelector('input.isbn').value = result.codeResult.code;
                        })
                        .catch(function() {
                            document.querySelector('input.isbn').value = "Not Found";
                        })
                        .then(function() {
                            vm.attachListeners();
                        }.bind(vm));
                }
                
                vm.attachListeners = function() {
                    var self = vm,
                        button = document.querySelector('.input-field input + .button.scan'),
                        fileInput = document.querySelector('.input-field input[type=file]');

                    button.addEventListener("click", function onClick(e) {
                        e.preventDefault();
                        button.removeEventListener("click", onClick);
                        document.querySelector('.input-field input[type=file]').click();
                    });

                    fileInput.addEventListener("change", function onChange(e) {
                        e.preventDefault();
                        fileInput.removeEventListener("change", onChange);
                        if (e.target.files && e.target.files.length) {
                            vm.decode(e.target.files[0]);
                        }
                    });
                }

                vm.init();
                return vm;
            }]
        }
    }

})(window.angular);
