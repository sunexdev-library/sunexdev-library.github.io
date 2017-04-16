(function(angular) {
    'use strict';

    angular
        .module('mainModule')
        .factory('search',
        [
            'library', 'events', 'cache',
            function (library, events, cache) {
                window.mm_search = this;
                var model = this;
                model.results = [];
                model.__library = library;
                model.__events = events;

                // search in books by full text search
                model.searchInBooks = function(pharse, includeDescription, skipNotifications) {

                    var books = model.__library.books;
                    var lib_authors = model.__library.authors;

                    if (!(/\S/.test(pharse))) {
                        return model.searchByUnpackedBooksList(cache.data.rnd_books);
                    }

                    pharse = pharse.toLowerCase();

                    var results = [];
		            var authors = [];
                    var titles = [];
                    var descriptions = [];
                    var isbns = [];

                    var words = pharse
                                .split(',')
                                .map(function(p){ return p.trim(); })
                                .filter(function(p){ return p !== ""; });

                    for(var i = 0; i < words.length; i++)
                    {
                        var word = words[i];

                        for (var idx in lib_authors)  if (!isNaN(idx) && lib_authors.hasOwnProperty(idx)) {
                            var author = lib_authors[idx];
                            if (author && author.Name.toLowerCase().indexOf(word) >= 0) {
                                authors.push(author);
                            }
                        }
    		
                        for (var idx in books)  if (!isNaN(idx) && books.hasOwnProperty(idx)) {

                            var book = books[idx];

                            // Lookup in book properties
                            if (book.title && book.title.toLowerCase().indexOf(word) >= 0) {
                                titles.push(book);
                            } else
                            if(book.isbn && book.isbn.toLowerCase().replace('-','').indexOf(word.replace('-','')) >= 0) {
                                descriptions.push(book);
                            } else
                            if(book.rfid && book.rfid.toLowerCase().replace('-','').indexOf(word.replace('-','')) >= 0) {
                                descriptions.push(book);
                            } else
                            if (book.releaseDate && book.releaseDate.toLowerCase().indexOf(word) >= 0) {
                                descriptions.push(book);
                            } else
                            if (includeDescription && book.description && book.description.toLowerCase().indexOf(word) >= 0) {
                                descriptions.push(book);
                            }
                        }
                    }
                    
                    results = titles.concat(descriptions);
                    if(!skipNotifications) {
                        model.__events.onMessage(model, "onSearchComplete", 
                        { id: 'books', results: results, authors: authors, isbns: isbns });
                    }
                    return results;
                }


                // filters books list by author id
                model.searchByAuthorId = function(id, skipNotifications) {
                    var authors = model.__library.authors;
                    var results = [];
                    if (authors.hasOwnProperty(id)) {
                        results = authors[id].books;
                    }
                    if(!skipNotifications) {
                        model.__events.onMessage(model, "onSearchComplete",
                            { id: 'authors', results: results });
                    }   
                    return results;
                }

                model.searchByAuthorName = function(name) {
                    var authors = model.__library.authors;
                    for(var i = 0; i < authors.length; i++) {
                        if(authors[i] && authors[i].Name.toLowerCase() == name.toLowerCase()) {
                            return i;
                        }
                    }
                    return undefined;
                }

                // filters books list by storage id
                model.searchByStorageId = function(id, skipNotifications) {
                    var storages = model.__library.storages;
                    var results = [];
                    if (storages.hasOwnProperty(id)) {
                        results = storages[id].books;
                    }
                    if(!skipNotifications) {
                         model.__events.onMessage(model, "onSearchComplete", 
                            { id: 'storages', results: results }
                            );
                    }
                    return results;
                }
                
                // filters books list by category id
                model.searchByCategoryId = function(id, skipNotifications) {
                    var categories = model.__library.categories;
                    var results = [];
                    var inspect = [];
                    var inspecting = [];
                    var allcats = [];
                    var initial;
                    if (categories.hasOwnProperty(id)) {
                        initial = categories[id];
                        inspecting.push(initial);

                        while (inspecting.length > 0) {
                            for (var idx in inspecting) {
                                allcats.push(inspecting[idx]);
                                for (var jdx in inspecting[idx].children) {
                                    inspect.push(inspecting[idx].children[jdx]);
                                }
                            }
                            inspecting = inspect;
                            inspect = [];
                        }

                        for (var i in allcats) {
                            results = results.concat(allcats[i].books);
                        }
                    }

                    if(!skipNotifications) {
                        model.__events.onMessage(model, "onSearchComplete", 
                            { id: 'categories', category: initial, results: results });
                    }
                    return results;
                }

                // filters books list by language id
                model.searchByLanguageId = function(id, skipNotifications) {
                    var languages = model.__library.languages;
                    var results = [];
                    if (languages.hasOwnProperty(id)) {
                        results = languages[id].books;
                    }
                    if(!skipNotifications) {
                        model.__events.onMessage(model, "onSearchComplete", 
                            { id: 'languages', results: results });
                    }
                    return results;
                }
                
                // filters books list by publisher id
                model.searchByPublisherId = function(id, skipNotifications) {
                    var publishers = model.__library.publishers;
                    var results = [];
                    if (publishers.hasOwnProperty(id)) {
                        results = publishers[id].books;
                    }
                    if(!skipNotifications) {
                        model.__events.onMessage(model, "onSearchComplete", 
                            { id: 'publishers', results: results });
                    }
                    return results;
                }

                // filters books list by series id
                model.searchBySeriesId = function(id, skipNotifications) {
                    var series = model.__library.series;
                    var results = [];
                    if (series.hasOwnProperty(id)) {
                        results = series[id].books;
                    }

                    if(!skipNotifications) {
                        model.__events.onMessage(model, "onSearchComplete", 
                            { id: 'series', results: results });
                    }
                    return results;
                }

                model.searchByUnpackedBooksList = function (list, skipNotifications) {
                    if (!skipNotifications) {
                        var packed = list.map(function (b) { return model.__library.packBook(b); });
                        model.__events.onMessage(model, "onSearchComplete",
                            { id: 'books', results: packed });
                    }
                    return list;
                }

                return model; 
            }
        ]);
})(window.angular);