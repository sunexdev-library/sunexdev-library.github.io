(function(angular) {
    'use strict';

    angular
        .module('mainModule')
        .factory('library',
        [
            'firebase', 'events', 'logger',
            function (firebase, events, log) {

                var model = this;
                model.__log = log;
                model.__fb = firebase;
                model.mappings = {};
                model.books = [];
                model.authors = [];
                model.categories = [];
                model.storages = [];
                model.langs = [];
                model.publishers = [];
                model.series = [];
                model.__version = 0;

                window.__library = model;
                    
                // subscribe for tables changes
                events.subscribe(firebase,
                    "onTableLoaded",
                    function (table) {
                        var data, idx, item;

                        model.__log.trace("Table loaded:'" + table + "'");

                        if (table === 'cache') {
                            return;
                        }

                        if (table !== 'books') {
                            data = firebase.data[table].data;
                            if(Array.isArray(data))
                            {
                                for (idx in data) {
                                    item = data[idx];
                                    var copy = angular.copy(item.row);
                                    copy.books = [];
                                    copy.id = item.id;
                                    model[table][item.id] = copy;
                                }
                            } else {
                                model[table] = angular.copy(data);
                            }
                        } else {
                            data = firebase.data[table].data;
                            for (idx in data) {
                                onBookAdded(data[idx].id, data[idx].row);
                            }
                        }

                        if (table === 'categories') {
                            onCategoriesLoaded();
                        }
                        model[table].__version = 0;
                    });

                events.subscribe(firebase, "onItemAdded", onItemAdded);

                ///
                ///  Called when some data appears in table
                ///
                function onItemAdded(args) {
                    model.__log.trace("Item added: '" + args.table.name + "'");
                    switch (args.table.name) {
                        case 'books':
                            if (!model.books.hasOwnProperty(args.key)) {
                                onBookAdded(args.key, args.item);
                            }
                            break;
                        default:
                            model[args.table.name][args.key] = angular.copy(args.item);
                            model[args.table.name][args.key].books = [];
                            break;
                    }
                    model[args.table.name].__version++;
                    model.__version++;
                }

                function onBookAdded(key, book) {
                    // make a copy
                    var copy = model.packBook(book);

                    model.books[key] = copy;

                    // setup backlinks
                    if (copy.getAuthor()) {
                        copy.getAuthor().books.push(copy);
                    }
                    if (copy.getCategory()) {
                        copy.getCategory().books.push(copy);
                    }
                    if (copy.getLanguage()) {
                        copy.getLanguage().books.push(copy);
                    }
                    if (copy.getPublisher()) {
                        copy.getPublisher().books.push(copy);
                    }
                    if (copy.getSeries()) {
                        copy.getSeries().books.push(copy);
                    }
                    if (copy.getStorages()) {
                        copy.getStorages().books.push(copy);
                    }
                }

                function onCategoriesLoaded() {
                    var allBooks = {
                        id: 0,
                        Name: "Все книги",
                        Title: "Все книги"
                    };

                    for (var idx in model.categories) {
                        if (model.categories.hasOwnProperty(idx)) {

                            var cat = model.categories[idx];
                            if (cat.Parent_id) {
                                cat.parent = model.categories[cat.Parent_id];
                                if (!cat.parent.children) {
                                    cat.parent.children = [cat];
                                } else {
                                    cat.parent.children.push(cat);
                                }
                            }

                            var path = [];
                            var cur = cat;
                            while (cur) {
                                path.push(cur);
                                cur = cur.parent;
                            }

                            path.push(allBooks);
                            path.reverse();

                            cat.path = path;
                        }
                    }
                }

                model.addRowToTable = function(table, object) {
                    var db = model.__fb.data.db;
                    var max_index = -1;
                    if(table === "books") {
                        model[table].forEach(function(x, i){ max_index = i; });
                    } else {
                        model[table].forEach(function(x){ max_index = Math.max(max_index, x.id);});
                    }
                    var index = max_index+1;
                    var updates = {};
                    updates['/'+table+'/' + index] = object;
                    db.ref().update(updates);
                    return index;
                }

                model.rootCategories = function() {
                    return model.categories.filter(function(cat) { return !cat.parent; });
                }

                model.packBook = function(book) {
                    return {
                        description: book.Comment,
                        getAuthor: function () {
                            return model.authors[book.Id_author];
                        },
                        hasAuthor: function () {
                            return book.Id_author >= 0;
                        },
                        getCategory: function () {
                            return model.categories[book.Id_cat];
                        },
                        hasCategory: function () {
                            return book.Id_cat >= 0;
                        },
                        getLanguage: function () {
                            return model.langs[book.Id_language];
                        },
                        hasLanguage: function () {
                            return book.Id_language >= 0;
                        },
                        getPublisher: function () {
                            return model.publishers[book.Id_publisher];
                        },
                        hasPublisher: function () {
                            return book.Id_publisher >= 0;
                        },
                        getSeries: function () {
                            return model.series[book.Id_series];
                        },
                        hasSeries: function () {
                            return book.Id_series >= 0;
                        },
                        getStorages: function () {
                            return model.storages[book.Id_store];
                        },
                        hasStorages: function () {
                            return book.Id_store >= 0;
                        },
                        imageURL: book.ImageURL,
                        rfid: book.Bookid,
                        isbn: book.Isbn,
                        releaseDate: book.Release_Date,
                        shortComment: book.Shortcom,
                        title: book.Title
                    }
                }

                model.unpackBook = function(book) {
                    return {
                        Bookid: book.rfid,
                        Comment: prep(book.description),
                        Id_author:  prep(book.getAuthor(), 'id'),
                        Id_cat:  prep(book.getCategory(), 'id'),
                        Id_language:  prep(book.getLanguage(), 'id'),
                        Id_publisher:  prep(book.getPublisher(), 'id'),
                        Id_series:  prep(book.getSeries(), 'id'),
                        Id_store:  prep(book.getStorages(), 'id'),
                        ImageURL:  prep(book.imageURL),
                        Isbn:  prep(book.isbn),
                        Release_Date:  prep(book.releaseDate),
                        Shortcom:  prep(book.shortComment),
                        Title: prep(book.title)
                    };

                    function prep(x, y) {
                        if (!x) {
                            return "";
                        }
                        if (!y) return x;

                        if (!x[y]) {
                            return "";
                        }
                        return x[y];
                    }
                }

                // Download a file form a url.
                model.saveFile = function(url) {
                    // Get file name from url.
                    var filename = url.substring(url.lastIndexOf("/") + 1).split("?")[0];
                    var xhr = new XMLHttpRequest();
                    xhr.responseType = 'blob';
                    xhr.onload = function() {
                        var a = document.createElement('a');
                        a.href = window.URL.createObjectURL(xhr.response); // xhr.response is a blob
                        a.download = filename; // Set the file name.
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                    };
                    xhr.open('GET', url);
                    xhr.send();
                }

                return model;
            }
        ]);
})(window.angular);
