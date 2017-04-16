(function (angular) {

    angular
        .module('mainModule')
        .factory('messenger', ['events', function (events) {


        var model = {};
        window.messenger = model;

        model.actions = [];
        model.connected = false;
        model.address = "ws://localhost:8080/Gate";

        function setupConnection() {

            model.__lastCalled = 0;
            model.__callbacks = [];

            model.__socket = new WebSocket(model.address);

            model.__socket.onmessage = function (event) {
                var parsed = JSON.parse(event.data);
                if (parsed.Type === "RpcServerCall`1") {
                    var action = parsed.Data.Method;
                    var callbackStructure = model.__callbacks.filter(function (struct) { return struct.hash == action });
                    if (callbackStructure.length > 0) {
                        var callback = callbackStructure[0].callback;
                        callback.call(callback, parsed.Data.Argument);
                    }
                } else {
                    var name = 'on' + parsed.Type + (parsed.Action ? ("." + parsed.Action) : "");
                    events.onMessage(model, name, parsed.Data);
                }
            };

            model.__socket.onopen = function () {
                model.connected = true;
                console.log("[MESSAGE] Connection established");
                events.onMessage(model, 'onOpened', {
                    message: 'Connection with server established',
                    endpoint: model.address
                });
            };

            model.__socket.onclose = function () {
                if (model.connected) {
                    model.connected = false;
                    events.onMessage(model, 'onClosed', {
                        message: 'Connection with server lost',
                        endpoint: model.address
                    });
                }
            };

            model.__socket.onerror = function () {
                if (model.connected) {
                    model.connected = false;

                    events.onMessage(model, 'onError', {
                        message: 'Connection with server lost',
                        endpoint: model.address
                    });
                }
                setTimeout(function () {
                    setupConnection(model.address);
                }, 1000);
            };

            model.rpCall = function (functionName, args, callback) {

                var hash = model.__lastCalled;
                model.__callbacks.push(
                {
                    callback: callback,
                    hash: hash
                });
                model.__lastCalled++;
                model.__socket.send(angular.toJson({ Type: "RpcCall", Data: { Method: functionName, Arguments: args, Callback: hash } }));
            }
        }

        setupConnection(model.address);

        setInterval(function () {
            if (model.connected) {
                events.onMessage(model, 'onPing');
                model.__socket.send("ping");
            }
            else {
                events.onMessage(model, 'onPingFailed');
            }
        }, 1000);

        return model;
    }]);

})(window.angular);
