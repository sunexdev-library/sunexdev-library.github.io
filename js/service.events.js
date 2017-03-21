(function (angular) {
    'use strict';

    /**
     *  Класс для подписки на оповещения и их рассылки
     */
    
    angular
        .module('mainModule')
        .factory('events', [function () {

        var model = this;

        model.actions = [];

        /**
         * Sends message from @param target
         * @param {} target 
         * @param string message 
         * @param {} data 
         */
        function onMessage(target, message, data) {
            model.actions.filter(function (obj) {
                return obj.message === message && (!obj.target || !target || (obj.target === target));
            }).forEach(function (obj) {
                setTimeout(function() { obj.action(data); }, 0);
            });
        }

        /**
         * Subscribes for messages of @param message type from @param target
         * @param {} target 
         * @param {} message 
         * @param {} action 
         * @returns {} disposing object, which contains close() method
         */
        function subscribe(target, message, action) {

            var subscription = {
                target: target,
                message: message,
                action: action
            };

            model.actions.push(subscription);

            return {
                __subscription: subscription,

                close: function () {
                    var index = model.actions.indexOf(subscription);
                    if (index >= 0) {
                        model.actions.splice(index, 1);
                    }
                }
            }
        }

        return {
            subscribe: subscribe,
            onMessage: onMessage
        };

    }]);

})(window.angular);
