(function (angular) {
    'use strict';

    angular
        .module('mainModule')
        .directive('newBook', newBook)
        .factory('bestMatch', function() {
            return function(items, compareObject) {
                var out = [];

                if (angular.isArray(items) && items.length > 0) {
                  var properties = Object.keys(compareObject);

                  // for each element in array
                  items.forEach(function(item) {
                    var totalMatches = 0;
                    var fullMatch = true;
                    var simplify = function(x){return x ? x : "";}
                    // for each property
                    for (var i = 0; i < properties.length; i++) {
                      var prop = properties[i];
                      var campareWith = simplify(item[prop]).toString().toLowerCase();
                      var text = compareObject[prop].toLowerCase();
                      var parts = text.split(' ')
                                    .filter(function(x){return !!x;})
                                    .map(function(x){return x.toLowerCase();});
                      var cmpWithParts = campareWith.split(' ')
                                    .filter(function(x){return !!x;})
                                    .map(function(x){return x.toLowerCase();});

                      for(var ind = 0; ind < parts.length; ind++) {
                          for(var jnd = 0; jnd < cmpWithParts.length; jnd++) {

                             var search = parts[ind];
                             var cmpWith = cmpWithParts[jnd];

                             if (cmpWith === search) {
                                totalMatches = totalMatches + 10 + search.length * 2;
                             } else
                             {
                                 var pos = cmpWith.indexOf(search);
                                 if (pos >= 0) {
                                    totalMatches = totalMatches + search.length + (pos === 0 ? 10 : 0);
                                    fullMatch = false;
                                 } 
                             }
                          }
                      }
                    }

                    if (totalMatches > 0) {
                      out.push({matches:totalMatches, item: item, fullMatch: fullMatch});
                    }
                  });

                  out.sort(function(x, y){ return y.matches - x.matches; });  

                } else {
                  // Let the output be the input untouched
                  return [{item: items}];
                }

                return out;
              };
        })
        .filter('propsFilter', ['bestMatch', function(bestMatch) {
           return function(x, y) { return bestMatch(x, y).map(function(x) { return x.item; }); }
        }]);

    function newBook() {

        return {
            restrict: 'E',
            scope: {
                book: "=",
                internal: "=",
                disabled: "=",
                onClosed: "&"
            },
            templateUrl: 'directives/newBook.html',
            bindToController: true,
            link: function(scope) {
                scope.$watch('vm.book',
                    function () {
                        scope.vm.internal['internal'] = scope.vm;
                        scope.vm.refresh();
                    });
            },
            controllerAs: 'vm',
            controller: ['$window', 'library', 'firebase', 'bestMatch', function ($window, library, firebase, bestMatch) {
                var vm = this;
                vm.$window = $window;
                vm.__library = library;
                vm.__firebase = firebase;
                vm.__bestMatch = bestMatch;
                vm.authors = [];
                vm.categories = [];
                vm.storages = [];
                vm.publishers = [];
                vm.languages = [];
                vm.series = [];
                vm.selectedAuthor="";
                vm.selectedCategory="";
                vm.selectedStorage="";
                vm.selectedPublisher="";
                vm.selectedLanguage="";
                vm.selectedSeries="";

                vm.selectBook = function (newBook) {
                    vm.book = newBook;
                    console.log(newBook);
                }

                vm.refresh = function () {
                    if(vm.book) {
                        console.log("[NEW BOOK] Got from Ozon parser:");
                        console.log(vm.book); 

                        vm.selectedAuthor = vm.getMatchedOrDefault(vm.getAuthors(), vm.book.Author);
                        vm.selectedPublisher = vm.getMatchedOrDefault(vm.getPublishers(), vm.book.Publisher);
                        vm.selectedLanguage = vm.getMatchedOrDefault(vm.getLanguages(), vm.book.Language);
                        vm.selectedSeries = vm.getMatchedOrDefault(vm.getLanguages(), vm.book.Series);
                        vm.selectedCategory = vm.getMatchedFromManyOrDefault(vm.getCategories(), vm.book.Categories);
                        vm.selectedStorage = vm.getMatchedOrDefault(vm.getStorages(), "рентгена");
                    }
                }

                vm.hasDirties = function() {
                    return vm.selectedAuthor.dirty ||
                           vm.selectedPublisher.dirty ||
                           vm.selectedLanguage.dirty ||
                           vm.selectedSeries.dirty ||
                           vm.selectedCategory.dirty ||
                           vm.selectedStorage.dirty;
                }

                vm.getImageContents = function() {
                    if(vm.book) {
                        return "data:image/png;base64," + vm.book.ImageUri;
                    }
                }
                
                vm.getMatchedFromManyOrDefault = function(arr, items) {

                    if(!items) {
                        items = [];
                    }

                    for (var i = items.length - 1; i >= 0; i--) {
                        var match = vm.getMatchedOrDefault(arr, items[i]);
                        if(!match.dirty) {
                            return match;
                        }
                        if(i === 0) {
                            return match;
                        }
                    }

                    return [];
                }

                vm.getMatchedOrDefault = function(arr, item) {

                    if(!item) {
                        item = "";
                    }

                    var best = vm.__bestMatch(arr, { Name: item });

                    if(best.length > 0 && best[0].fullMatch) {
                        return best[0].item;
                    }

                    return {Name: item, dirty: item !== ""};
                }

                vm.addIfNotExists = function(arr, val) {
                    for (var i = arr.length - 1; i >= 0; i--) {
                        if(arr[i].Name === val) {
                            return arr;
                        }
                    }
                    
                    return arr.unshift({Name:val, dirty:true});
                }

                vm.getAuthors = function(searchString) {
                    if(vm.authors.length==0) {
                        vm.authors = findUniques(vm.__library.authors, 'Name');
                    }
                    return vm.addIfNotExists(vm.authors, searchString);
                }

                vm.getCategories = function(searchString) {
                    if(vm.categories.length==0) {
                        vm.categories = findUniques(vm.__library.categories, 'Name'); 
                    }
                    return vm.addIfNotExists(vm.categories, searchString);
                }

                vm.getStorages = function(searchString) {
                    if(vm.storages.length==0) {
                        vm.storages = findUniques(vm.__library.storages, 'Name'); 
                    }
                    return vm.addIfNotExists(vm.storages, searchString);
                }

                vm.getPublishers = function(searchString) {
                    if(vm.publishers.length==0) {
                        vm.publishers = findUniques(vm.__library.publishers, 'Name');
                    }
                    return vm.addIfNotExists(vm.publishers, searchString);
                }

                vm.getLanguages = function(searchString) {
                    if(vm.languages.length==0) {
                        vm.languages = findUniques(vm.__library.langs, 'Name');
                    }
                    return vm.addIfNotExists(vm.languages, searchString);
                }
                
                vm.getSeries = function(searchString) {
                    if(vm.series.length==0) {
                        vm.series = findUniques(vm.__library.series, 'Name');
                    }
                    return vm.addIfNotExists(vm.series, searchString);
                }

                function findUniques(arr, prop) {
                    var unique = arr.filter(
                            function(x, i){ 
                                var ok = false;
                                for(var j=0; j<i; j++){
                                    if(arr[j] && arr[j][prop] == x[prop])
                                    {
                                        ok = true;
                                        break;
                                    }
                                }
                                return !ok; 
                            }
                        )
                    var nonempty = unique.filter(function(x){ return !!x;})
                    return nonempty.sort(function(x) {return x.Name;});
                }

                vm.triggerClosed = function() {
                    vm.onClosed();
                }

                vm.finishBookAdd = function() {

                }
            }]
        }
    }

})(window.angular);
