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
  this.token = function() {
    return $auth.token;
  }
  this.namespace = function() {
    return $me._namespace;
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

  self.reply = false;
  clearDraft();

  function clearDraft() {
    $scope.$emit("compose-cleared");
    $me.namespacePromise.then(function ($namespace) {
      self.reply = false;
      self.draft = $namespace.draft();
    });
  }

  this.discardClicked = function () {
    self.draft.dispose().then(function () {
      $scope.$emit("compose-discard");
      clearDraft();
    });
  };

  this.sendClicked = function () {
    self.draft.save().then(function () {
      $scope.$emit("compose-saved");
      self.draft.send().then(function () {
        $scope.$emit("compose-sent");
        clearDraft();
      });
    });
  };

  $scope.$on("compose-set-draft", function (event, draft) {
    self.draft = draft;
    self.reply = _.isString(draft.thread);
    $scope.$emit("compose-replying");
  })
}]).

controller('ThreadCtrl', ['$scope', '$namespace', '$threads', '$modal', '$routeParams', '$location', '$scrollState', '$me', function($scope, $namespace, $threads, $modal, $routeParams, $location, $scrollState, $me) {
  var self = this;

  this.thread = $threads.item($routeParams['id']);
  this.messages = null;
  this.drafts = null;
  $scope.replying = false;

  this.currentAttachment = null;
  this.currentAttachmentDataURL = null;
  
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
      self.messages = messages.sort(function(a, b) {
        return a.date.getTime() - b.date.getTime(); //oldest -> newest
      });

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
      self.drafts = drafts.sort(function(a, b) {
        return a.date.getTime() - b.date.getTime(); // oldest-newest
      });

    }, _handleAPIError);
  }

  // exposed methods

  this.viewAttachment = function(msg, id) {
    self.currentAttachmentLoading = true;
    msg.attachment(id).download().then(function(blob) {
      self.currentAttachment = blob;
      if (blob.type.indexOf('image/') != -1) {
        var fileReader = new FileReader();
        fileReader.onload = function() {
          self.currentAttachmentDataURL = this.result;
          self.currentAttachmentLoading = false;
          if (!$scope.$$phase) $scope.$apply();
        };
        fileReader.readAsDataURL(blob);
      } else {
        self.currentAttachmentLoading = false;
        self.downloadCurrentAttachment();
      }
    });
  }

  this.hideAttachment = function() {
    self.currentAttachmentDataURL = null;
  }
 
  this.downloadCurrentAttachment = function() {
    saveAs(self.currentAttachment, self.currentAttachment.fileName);
  };

  this.composeClicked = function() {
  }

  this.replyClicked = function() {
    if (!$scope.replying) {
      var draft = self.draft = self.thread.reply();
      var me = $me.emailAddress();
      var participants = _.reject(self.thread.participants, function (p) {
        return p.email == me;
      });
      if (_.isEmpty(participants)) {
        participants = self.thread.participants; // Self-emails are people too
      }
      draft.addRecipients(participants);
      $scope.$broadcast("compose-set-draft", draft);
    } else if (_.isEmpty(self.draft.body)) { // We know self.draft is set by now
      $scope.replying = false;
    }
  }

  this.archiveClicked = function() {
    self.thread.removeTags(['inbox']).then(function(response) {
      $threads.itemArchived(self.thread.id);
      $location.path('/inbox');
    }, _handleAPIError);
  }

  $scope.$on("compose-replying", function (event) {
    $scope.replying = true;
  });

  $scope.$on("compose-cleared", function (event) {
    $scope.replying = false;
  })

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
  setAutocomplete([]);

  // internal methods

  function updateAutocomplete() {
    var contacts = $me.contacts();
    var term = $scope.search.toLowerCase();
    var search = $threads.filters()['any_email'];
    var results = []

    // don't show autocompletions if the field is empty, or if the
    // field contents have already been applied to the $thread filters
    if ((term.length == 0) || (search && (term.toLowerCase() == search.toLowerCase()))) {
      setAutocomplete([]);
      return;
    }

    for (var ii = 0; ii < contacts.length; ii ++) {
      if ((contacts[ii].email.toLowerCase().indexOf(term) == 0) || (contacts[ii].name.toLowerCase().indexOf(term) == 0))
        results.push(contacts[ii]);
      if (results.length == 3)
        break;
    }

    setAutocomplete(results);
  }

  function updateTypeaheadWithSelection() {
    var contact = self.autocompleteSelection;
    var term = $scope.search.toLowerCase();

    if (!contact || (term.length == 0)) {
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

    setAutocomplete([]);
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

