// Helpers

var _clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

var _displayErrors = true;
window.onbeforeunload = function () {
  _displayErrors = false;
};

var _handleAPIError = function(error) {
  if (!_displayErrors)
    return;
  var msg = "An unexpected error occurred. (HTTP code " + error['status'] + "). Please try again.";
  if (error['message'])
      msg = error['message'];
  alert(msg);
};

// Controllers

angular.module('baobab.controllers', ['inbox', 'ngSanitize', 'ngCookies']).

controller('AppCtrl', ['$scope', '$me', '$inbox', '$auth', '$location', '$cookieStore', '$sce', function($scope, $me, $inbox, $auth, $location, $cookieStore, $sce) {
  var self = this;
  window.AppCtrl = this;

  this.inboxAuthURL = $sce.trustAsResourceUrl('https://beta.inboxapp.com/oauth/authorize');
  this.inboxClientID = $inbox.appId();
  this.inboxRedirectURL = window.location.protocol + "//" + window.location.host + "/";
  this.loginHint = '';

  this.clearToken = $auth.clearToken;
  this.hasToken = function() {
    return !!$auth.token;
  }

  this.theme = $cookieStore.get('baobab_theme') || 'light';
  this.setTheme = function(theme) {
    self.theme = theme;
    $cookieStore.put('baobab_theme', theme);
  }

  this.cssForTab = function(path) {
    return ($location.path().indexOf(path) != -1) ? 'active' : '';
  }
}]).


controller('ComposeCtrl', ['$scope', '$me', function($scope, $me) {
  var self = this;

  if (!_.isObject($scope.draft)) {
    // Create a new draft if the outer context didn't provide one
    newDraft();
  }

  function newDraft() {
    $me.namespacePromise.then(function ($namespace) {
      var $draftscope = $scope;
      while ($draftscope.$parent && !$draftscope.draft) {
        $draftscope = $draftscope.$parent;
      }
      if (!$draftscope.$parent) {
        $draftscope = $scope;
      }
      $draftscope.draft = $namespace.draft();
    });
  }

  this.discardClicked = function () {
    $scope.draft.dispose().then(newDraft);
  };

  this.sendClicked = function () {
    $scope.draft.save().then(function () {
      $scope.draft.send().then(newDraft);
    });
  };
}]).

controller('ThreadCtrl', ['$scope', '$namespace', '$threads', '$modal', '$routeParams', '$location', '$scrollState', function($scope, $namespace, $threads, $modal, $routeParams, $location, $scrollState) {
  var self = this;

  this.thread = $threads.item($routeParams['id']);
  this.messages = null;
  this.drafts = null;

  // internal methods

  if (this.thread) {
    threadReady();
  } else {
    $namespace.thread($routeParams['id']).then(function(thread) {
      self.thread = thread;
      threadReady();
    }, _handleAPIError);
  }


  function threadReady() {
    self.thread.messages().then(function(messages) {
      self.messages = messages;

      // scroll to the first unread message, or the last message
      // if the entire conversation is read.
      var scrollTo = messages[messages.length - 1];
      for (var ii = 0; ii < messages.length; ii++) {
        if (messages[ii].unread) {
          scrollTo = messages[ii];
          break;
        }
      }
      $scrollState.scrollTo('msg-' + scrollTo.id);

      // mark the thread as read
      if (self.thread.hasTag('unread')) {
        self.thread.removeTags(['unread']).then(function(response) {
          for (var ii = 0; ii < messages.length; ii++) {
            messages[ii].unread = false;
          }
        }, _handleAPIError);
      }

    }, _handleAPIError);

    self.thread.drafts().then(function(drafts) {
      self.drafts = drafts;
    }, _handleAPIError);
  }

  // exposed methods

  this.downloadAttachment = function(msg, id) {
    msg.attachment(id).download().then(function(response) {
      saveAs(response.blob, response.filename);
    }, _handleAPIError);
  };

  this.composeClicked = function() {
  }

  this.replyClicked = function() {
    self.launchDraftModal(thread.reply());
  }

  this.archiveClicked = function() {
    self.thread.removeTags(['inbox']).then(function(response) {
      $threads.itemArchived(self.thread.id);
      $location.path('/inbox');
    }, _handleAPIError);
  }

}]).


controller('ThreadListCtrl', ['$scope', '$me', '$threads', '$modal', '$location', '$routeParams', function($scope, $me, $threads, $modal, $location, $routeParams) {
  var self = this;

  $scope.search = $threads.filters()['any_email'] || '';
  $scope.searchTypeahead = '';
  $scope.$watch('search', function() {
    updateAutocomplete();
  })

  $threads.setFilters({tag: $routeParams['tag'] || 'inbox'});

  this.list = $threads.list();
  this.extendList = $threads.extendList;

  $threads.on('update', function() {
    self.list = $threads.list();
  });

  this.viewName = $routeParams['tag'];
  this.autocomplete = [];
  this.autocompleteSelection = null;

  // internal methods

  function updateAutocomplete() {
    var contacts = $me.contacts();
    var term = $scope.search.toLowerCase();
    var results = []

    if ((term.length == 0) || (term == $threads.filters()['any_email'])) {
      $scope.searchTypeahead = '';
      self.autocomplete = [];
      return;
    }

    for (var ii = 0; ii < contacts.length; ii ++) {
      if ((contacts[ii].email.toLowerCase().indexOf(term) == 0) || (contacts[ii].name.toLowerCase().indexOf(term) == 0))
        results.push(contacts[ii]);
      if (results.length == 3)
        break;
    }

    self.autocomplete = results;
    setAutocompleteSelection(results[0]);
  }

  function updateTypeaheadWithSelection() {
    var contact = self.autocompleteSelection;
    var term = $scope.search.toLowerCase();

    if (contact && (term == contact.email.toLowerCase().substr(0,term.length))) {
      $scope.searchTypeahead = $scope.search + contact.email.substr($scope.search.length);
    } else if (contact && (term == contact.name.toLowerCase().substr(0,term.length))) {
      $scope.searchTypeahead = $scope.search + contact.name.substr($scope.search.length);
    } else {
      $scope.searchTypeahead = '';
    }
  }

  function setAutocompleteSelection(item) {
    self.autocompleteSelection = item;
    updateTypeaheadWithSelection();
  }

  // exposed methods

  this.showNoMore = function() {
    return $threads.listIsCompleteSet() && $threads.listIsMultiplePages();
  }

  this.tokenizedFilters = function() {
    var filters = $threads.filters();
    delete filters['any_email'];
    return filters;
  }

  this.composeClicked = function() {
  }

  this.threadClicked = function(thread) {
    $location.path('/thread/'+thread.id);
  };

  this.archiveClicked = function(thread, event) {
    thread.removeTags(['inbox']).then(function(response) {
      $threads.itemArchived(thread.id);
    }, _handleAPIError);

    event.stopPropagation();
  }

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

    self.autocomplete = [];
    setAutocompleteSelection(null);
  }

  this.searchCleared = function() {
    $scope.search = "";
    $scope.searchFocused = false;
    $threads.appendFilters({'any_email': null});
  }

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
  }

}]);

