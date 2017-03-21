(function(angular) {
    'use strict';

    angular
        .module('mainModule')
        .factory('cache',
        [
            'library', 'firebase', 'events',
            function (library, firebase, events) {
                var model = this;
                model.topAuthorsMaxCount = 20;

                initEmptyStats();

                events.subscribe(firebase,
                    "onTableLoaded",
                    function (tableName) {
                        var tableProvider = firebase.data[tableName];
                        switch (tableName) {
                        case "cache":
                            if (!tableProvider) {
                                initEmptyStats();
                            } else {
                                model.data = tableProvider.data;
                                events.onMessage(model, 'onDirtyUpdated', model.data);
                            }
                            break;
                        case "books":
                            countTopAuthors();
                            countTopStorages();
                            countTopCategories();
                            selectRandomBooks();
                            model.save();
                            events.onMessage(model, 'onUpdated', model.data);
                            break;
                        }
                    });

                function initEmptyStats() {
                    model.data = {
                        top_authors: [],
                        top_books: [],
                        top_catalogs: []
                    }
                    events.onMessage(model, 'onUpdated', model.data);
                }

                // collects cache for top authors
                function countTopAuthors() {
                    var data = library.authors;
                    model.data.top_authors =
                     data
                        .map(function (x, i) {
                            return { id: i, data: x };
                        })
                        .sort(function (a, b) {
                            return b.data.books.length - a.data.books.length;
                        })
                        .slice(0, model.topAuthorsMaxCount)
                        .map(function (x) {
                            return {
                                id: x.id,
                                name: x.data.Name,
                                booksCount: x.data.books.length
                            }
                        });
                }

                // collects cache for top storages
                function countTopStorages() {
                    var data = library.storages;
                    model.data.top_storages =
                     data
                        .map(function (x, i) {
                            return { id: i, data: x };
                        })
                        .sort(function (a, b) {
                            return b.data.books.length - a.data.books.length;
                        })
                        .map(function (x) {
                            return {
                                id: x.id,
                                name: x.data.Name,
                                booksCount: x.data.books.length
                            }
                        });
                }

                // collects cache for top categories
                function countTopCategories() {
                    var data = library.categories;
                    model.data.top_categories =
                     data
                        .map(function (x, i) {
                            return { id: i, data: x };
                        })
                        .sort(function (a, b) {
                            return b.data.books.length - a.data.books.length;
                        })
                        .map(function (x) {
                            return {
                                id: x.id,
                                Name: x.data.Name,
                                Title: x.data.Title,
                                booksCount: x.data.books.length
                            }
                        });
                }

                function selectRandomBooks() {
                    var books = [];

                    while (books.length < 12) {
                        var idx = 0;
                        do {
                            idx = Math.round(Math.random() * library.books.length);
                        } while (!library.books[idx]);

                        books.push(library.unpackBook(library.books[idx]));
                    }


                    model.data.rnd_books = books;
                }

                model.save = function () {
                    firebase.data.cache.ref.set(model.data);
                }

                return model;
            }
        ]);
})(window.angular);