"use strict";
var _handleAPIError; //globals

define(["angular", "underscore"], function(angular, _) {
  angular.module("baobab.controller.threadlist", [])
  .controller('ThreadListCtrl', [
    '$scope', '$contacts', '$threads', '$location', '$routeParams',
    function($scope, $contacts, $threads, $location, $routeParams) {
    var self = this;

    $scope.search = $threads.filters()['any_email'] || '';
    $scope.searchTypeahead = '';
    $scope.$watch('search', function() {
      updateAutocomplete();
    });

    $threads.setFilters({tag: $routeParams['tag'] || 'inbox'});

    this.list = $threads.list();
    this.extendList = $threads.extendList;

    $threads.on('update', function() {
      self.list = $threads.list();
    });

    this.viewName = $routeParams['tag'];
    setAutocomplete([]);

    // internal methods

    function updateAutocomplete() {
      var contacts = $contacts.list();
      var term = $scope.search.toLowerCase();
      var search = $threads.filters()['any_email'];
      var results = [];

      // don't show autocompletions if the field is empty, or if the
      // field contents have already been applied to the $thread filters
      if ((term.length === 0) || (search && (term.toLowerCase() == search.toLowerCase()))) {
        setAutocomplete([]);
        return;
      }

      for (var ii = 0; ii < contacts.length; ii ++) {
        if ((contacts[ii].email.toLowerCase().indexOf(term) === 0) || (contacts[ii].name.toLowerCase().indexOf(term) === 0))
          results.push(contacts[ii]);
        if (results.length == 3)
          break;
      }

      setAutocomplete(results);
    }

    function updateTypeaheadWithSelection() {
      var contact = self.autocompleteSelection;
      var term = $scope.search.toLowerCase();

      if (!contact || (term.length === 0)) {
        $scope.searchTypeahead = '';
      } else if (term == contact.email.toLowerCase().substr(0,term.length)) {
        $scope.searchTypeahead = $scope.search + contact.email.substr($scope.search.length);
      } else if (term == contact.name.toLowerCase().substr(0,term.length)) {
        $scope.searchTypeahead = $scope.search + contact.name.substr($scope.search.length);
      } else {
        $scope.searchTypeahead = '';
      }
    }

    function setAutocomplete(items) {
      self.autocomplete = items;
      setAutocompleteSelection(items[0]);
    }

    function setAutocompleteSelection(item) {
      self.autocompleteSelection = item;
      updateTypeaheadWithSelection();
    }

    // exposed methods

    this.showNoMore = function() {
      return $threads.listIsCompleteSet() && $threads.listIsMultiplePages();
    };

    this.tokenizedFilters = function() {
      var filters = $threads.filters();
      delete filters['any_email'];
      return filters;
    };

    this.threadClicked = function(thread) {
      $location.path('/thread/'+thread.id);
    };

    this.archiveClicked = function(thread, event) {
      thread.removeTags(['inbox']).then(function(response) {
        $threads.itemArchived(thread.id);
      }, _handleAPIError);

      event.stopPropagation();
    };

    this.searchClicked = function() {
      var filters = {};
      var search = $scope.search;

      if (search.indexOf(':') > 0) {
        _.each(search.split(' '), function(term) {
          var parts = term.split(':');
          if (parts.length == 2) {
            filters[parts[0]] = parts[1];
            search = search.replace(term, '');
          }
        });

      } else {
        filters['any_email'] = search;
      }

      $threads.appendFilters(filters);
      $scope.search = search;

      setAutocomplete([]);
    };

    this.searchCleared = function() {
      $scope.search = "";
      $scope.searchFocused = false;
      $threads.appendFilters({'any_email': null});
    };

    this.keypressInAutocomplete = function(e) {
      var index = self.autocomplete.indexOf(self.autocompleteSelection);

      if(e.keyCode == 40) { // down arrow
        if ((self.autocompleteSelection == null) || (index == -1))
          setAutocompleteSelection(self.autocomplete[0]);
        else if (index + 1 < self.autocomplete.length)
          setAutocompleteSelection(self.autocomplete[index+1]);
        e.preventDefault();
      }

      if (e.keyCode == 38) { // up arrow
        if (index > 0) {
          setAutocompleteSelection(self.autocomplete[index-1]);
        }
        e.preventDefault();
      }

      if (e.keyCode == 39) { // right arrow
        $scope.search = $scope.searchTypeahead;
      }

      if (e.keyCode == 13) { // enter
        if (self.autocompleteSelection)
          $scope.search = self.autocompleteSelection.email;
        self.searchClicked();
      }

      updateTypeaheadWithSelection();
    };

  }]);
});
