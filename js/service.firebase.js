(function (angular, firebase) {
    'use strict';

    angular
        .module('mainModule')
        .factory('firebase',
        [
            '$q', 'events',
            function ($q, $events) {

                // Initialize Firebase
                var config = {
                    apiKey: "AIzaSyChgLwXU3ahdO4QItKj5vmJV2laTBGITT8",
                    authDomain: "library-5ee62.firebaseapp.com",
                    databaseURL: "https://library-5ee62.firebaseio.com",
                    storageBucket: "library-5ee62.appspot.com",
                    messagingSenderId: "97301573202"
                };

                // setup firebase & check connection
                firebase.initializeApp(config);
                var model = this;
                var ret = {
                    data: model
                };

                model.dataLoaded = false;
                model.events = $events;
                model.db = firebase.database();
                model.names = [];
                model.authors = { data: [] };

                // Start loading tables
                var deferredStats = loadTable(model, "cache");
                var deferredAuthors = loadTable(model, "authors");
                var deferredCategories = loadTable(model, "categories");
                var deferredStorages = loadTable(model, "storages");
                var deferredLangs = loadTable(model, "langs");
                var deferredPublishers = loadTable(model, "publishers");
                var deferredSeries = loadTable(model, "series");
                var deferredMappings = loadTable(model, "mappings");
                var deferredBooks = loadTable(model, "books");

                // Wait for all to be loaded
                var tables = [
                    deferredStats.promise,
                    deferredAuthors.promise, deferredCategories.promise,
                    deferredStorages.promise, deferredLangs.promise,
                    deferredPublishers.promise, deferredSeries.promise,
                    deferredBooks.promise, deferredMappings.promise
                ];

                ret.promise = $q.all(tables);

                // When loaded, notify
                ret.promise.then(function () {
                    model.dataLoaded = true;
                    model.events.onMessage(ret, "onTablesLoadingDone");
                });

                ret.uploadImage = function(id, encodedImage) {
                    var ref = firebase.storage().ref("imgs/"+id);
                    return ref.putString("data:image/png;base64," + encodedImage, 'data_url');
                }

                ret.getIsAuthenticated = function() {
                    return firebase.auth().currentUser != null;
                }

                ret.signin = function (username, password) {
                    return firebase.auth().signInWithEmailAndPassword(username, password);
                }

                /*
                 *  Load table from firebase by its name
                 */
                function loadTable(model, name) {
                    var deferred = $q.defer();
                    var table = model[name] = {};

                    table.ref = model.db.ref(name);
                    table.ref.once("value", onValue);

                    function tableByRef(ref) {

                        if (model.names.indexOf(ref.key) < 0) {
                            if (ref.parent) {
                                return tableByRef(ref.parent);
                            } else {
                                return undefined;
                            }
                        }

                        return model[ref.key];
                    }

                    function onValue(data) {
                        var ref = data.ref;
                        var value = data.val();

                        // read table
                        model["db_" + name] = data;

                        model.names.push(name);


                        model[name] = {
                            ref: ref,
                            name: name,
                            data: convertValue(value),
                            save: function() {
                                data.set(model[name]);
                            }
                        };
                        model.events.onMessage(ret, "onTableLoaded", name);
                        console.log("Table " + name + " is loaded");

                        // notify
                        //ref.on("child_added", onChildAdded, onAddedError);
                        //ref.on("child_removed", onChildRemoved, onRemovedError);
                        deferred.resolve(data);
                    }

                    function convertValue(value) {
                        if (Array.isArray(value)) {
                            return value.map(function(item, index) { return { id: index, row: item } })
                                        .filter(function(item) { return item.row != null; });
                        } else {
                            return value;
                        }
                    }

                    function onError() {
                        deferred.reject(data);
                    }

                    function onChildAdded(child) {
                        var found = tableByRef(child.ref);
                        var data = child.val();
                        table.data[child.key] = data;

                        model.events.onMessage(ret, "onItemAdded", { table: table, key: child.key, item: data });
                    }

                    function onChildRemoved(child) {
                        var found = tableByRef(child.ref);
                        var data = child.val();
                        for (var i = 0; i < found.data.length; i++) {
                            if (angular.equals(data, found.data[i])) {
                                found.data.splice(i, 1);
                                break;
                            }
                        }
                    }

                    function onAddedError(err) {
                        
                    }

                    function onRemovedError(err) {
                        
                    }

                    return deferred;
                }

                return ret;
            }
        ]);

})(window.angular, window.firebase);
