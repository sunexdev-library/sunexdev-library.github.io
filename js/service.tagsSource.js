(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .factory('tagsSource', ['events', 'messenger', tagsSource]);
    
    function tagsSource(events, messenger) {

        var model = this;
        model.devices = [];
        model.tags = [];

        events.subscribe(messenger,
            'onOpen',
            function (data) {
                events.onMessage(model, 'onOpen');
            });

        events.subscribe(messenger,
            'onClosed',
            function (data) {
                events.onMessage(model, 'onClosed');
            });

        events.subscribe(messenger,
            'onTagsData.Received',
            function (body) {
                events.onMessage(model, "onTagReceived", body);
            });

        events.subscribe(messenger,
            'onTagsData.Lost',
            function (body) {
                events.onMessage(model, "onTagLost", body);
            });

        // Subscribe for device added notification
        events.subscribe(messenger,
            'onDevicesListChanged.Added',
            function (body) {
                // save last version of devices
                model.devices = body.WholeList;
                events.onMessage(model, "onDevicesAdded", body.Changed);
                events.onMessage(model, "onDevicesChanged");
            });

        // Subscribe for device removed notification
        events.subscribe(messenger,
            'onDevicesListChanged.Removed',
            function (body) {
                // save last version of devices
                model.devices = body.WholeList;
                events.onMessage(model, "onDevicesRemoved", body.Changed);
                events.onMessage(model, "onDevicesChanged");
            });
        return model;
    };

})(window.angular);
