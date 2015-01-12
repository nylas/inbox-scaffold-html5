define(["angular", "underscore", "error"], function(angular, _, error) {
  return angular.module("baobab.controller.threadlist", []).controller('ThreadListCtrl', [
    '$scope', '$contacts', '$threads', '$location', '$routeParams', function($scope, $contacts, $threads, $location, $routeParams) {
      var setAutocomplete, setAutocompleteSelection, updateAutocomplete, updateTypeaheadWithSelection;
      setAutocomplete = (function(_this) {
        return function(items) {
          _this.autocomplete = items;
          return setAutocompleteSelection(items[0]);
        };
      })(this);
      setAutocompleteSelection = (function(_this) {
        return function(item) {
          _this.autocompleteSelection = item;
          return updateTypeaheadWithSelection();
        };
      })(this);
      updateTypeaheadWithSelection = (function(_this) {
        return function() {
          var contact, term;
          contact = _this.autocompleteSelection;
          term = $scope.search.toLowerCase();
          if (!contact || (term.length === 0)) {
            return $scope.searchTypeahead = '';
          } else if (term === contact.email.toLowerCase().substr(0, term.length)) {
            return $scope.searchTypeahead = $scope.search + contact.email.substr($scope.search.length);
          } else if (term === contact.name.toLowerCase().substr(0, term.length)) {
            return $scope.searchTypeahead = $scope.search + contact.name.substr($scope.search.length);
          } else {
            return $scope.searchTypeahead = '';
          }
        };
      })(this);
      $scope.search = $threads.filters()['any_email'] || '';
      $scope.searchTypeahead = '';
      $scope.$watch('search', function() {
        return updateAutocomplete();
      });
      $threads.setFilters({
        tag: $routeParams['tag'] || 'inbox'
      });
      this.list = $threads.list();
      this.extendList = $threads.extendList;
      $threads.on('update', (function(_this) {
        return function() {
          return _this.list = $threads.list();
        };
      })(this));
      this.viewName = $routeParams['tag'];
      setAutocomplete([]);
      updateAutocomplete = (function(_this) {
        return function() {
          var contacts, results, search, term;
          contacts = $contacts.list();
          term = $scope.search.toLowerCase();
          search = $threads.filters()['any_email'];
          results = [];
          if ((term.length === 0) || (search && (term.toLowerCase() === search.toLowerCase()))) {
            setAutocomplete([]);
            return;
          }
          contacts.every(function(c) {
            if ((c.email.toLowerCase().indexOf(term) === 0) || (c.name.toLowerCase().indexOf(term) === 0)) {
              results.push(c);
            }
            return results.length < 3;
          });
          return setAutocomplete(results);
        };
      })(this);
      this.showNoMore = (function(_this) {
        return function() {
          return $threads.listIsCompleteSet() && $threads.listIsMultiplePages();
        };
      })(this);
      this.tokenizedFilters = (function(_this) {
        return function() {
          var filters;
          filters = $threads.filters();
          delete filters['any_email'];
          return filters;
        };
      })(this);
      this.threadClicked = (function(_this) {
        return function(thread) {
          return $location.path('/thread/' + thread.id);
        };
      })(this);
      this.archiveClicked = (function(_this) {
        return function(thread, event) {
          thread.removeTags(['inbox']).then(function(response) {
            return $threads.itemArchived(thread.id);
          }, error._handleAPIError);
          return event.stopPropagation();
        };
      })(this);
      this.deleteClicked = (function(_this) {
        return function(thread, event) {
          event.stopPropagation();
          if (thread.messageIDs.length !== 0 || thread.draftIDs.length !== 1) {
            return;
          }
          return thread.drafts().then(function(drafts) {
            return drafts[0].dispose().then(function() {
              return $threads.itemRemoved(thread.id);
            });
          });
        };
      })(this);
      this.searchClicked = function() {
        var filters, search;
        filters = {};
        search = $scope.search;
        if (search.indexOf(':') > 0) {
          _.each(search.split(' '), function(term) {
            var parts;
            parts = term.split(':');
            if (parts.length === 2) {
              filters[parts[0]] = parts[1];
              return search = search.replace(term, '');
            }
          });
        } else {
          filters['any_email'] = search;
        }
        $threads.appendFilters(filters);
        $scope.search = search;
        return setAutocomplete([]);
      };
      this.searchCleared = function() {
        $scope.search = "";
        $scope.searchFocused = false;
        return $threads.appendFilters({
          'any_email': null
        });
      };
      this.keypressInAutocomplete = function(e) {
        var index;
        index = this.autocomplete.indexOf(this.autocompleteSelection);
        if (e.keyCode === 40) {
          if ((this.autocompleteSelection === null) || (index === -1)) {
            setAutocompleteSelection(this.autocomplete[0]);
          } else if (index + 1 < this.autocomplete.length) {
            setAutocompleteSelection(this.autocomplete[index + 1]);
          }
          e.preventDefault();
        }
        if (e.keyCode === 38) {
          if (index > 0) {
            setAutocompleteSelection(this.autocomplete[index - 1]);
          }
          e.preventDefault();
        }
        if (e.keyCode === 39) {
          $scope.search = $scope.searchTypeahead;
        }
        if (e.keyCode === 13) {
          if (this.autocompleteSelection) {
            $scope.search = this.autocompleteSelection.email;
          }
          this.searchClicked();
        }
        return updateTypeaheadWithSelection();
      };
      return this;
    }
  ]);
});
