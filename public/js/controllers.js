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


var _valueForQueryParam = function(param_name) {
  var search = window.location.search;
  var tokenStart = search.indexOf(param_name+'=');
  if (tokenStart != -1) {
    tokenStart += (param_name+'=').length;

    var tokenEnd = search.indexOf('&', tokenStart);
    if (tokenEnd == -1) tokenEnd = search.length - tokenStart;

    return search.substr(tokenStart, tokenEnd);
  } else {
    return null;
  }
}

// Controllers

angular.module('baobab.controllers', ['inbox', 'ngSanitize', 'ngCookies']).

controller('AppCtrl', ['$scope', '$me', '$inbox', '$location', '$cookieStore', '$sce', function($scope, $me, $inbox, $location, $cookieStore, $sce) {
  var self = this;
  window.AppCtrl = this;

  this.theme = $cookieStore.get('baobab_theme') || 'light';

  this.inboxAuthURL = $sce.trustAsResourceUrl('https://beta.inboxapp.com/oauth/authorize');
  this.inboxClientID = $inbox.appId();
  this.inboxRedirectURL = window.location.href;
  this.loginHint = '';

  this.setTheme = function(theme) {
    self.theme = theme;
    $cookieStore.put('baobab_theme', theme);
  }

  this.setToken = function(authToken) {
    if ((authToken == null) || (authToken == ''))
      return self.clearToken();

    $cookieStore.put('inbox_auth_token', authToken);
    $inbox.withCredentials(true);
    $inbox.setRequestHeader('Authorization', 'Basic '+btoa(authToken+':'));
    $inbox.namespaces().then(function(namespaces) {
      $me.setNamespace(namespaces[0]);

    }, function(err) {
      $me.setNamespace(null);
      if (confirm("/n/ returned no namespaces for your API token. Click OK to be logged out, or Cancel if you think this is a temporary issue."))
          self.clearToken();
    });
  }

  this.clearToken = function() {
    $cookieStore.remove('inbox_auth_token');
    $inbox.setRequestHeader('Authorization', '');
    self.setMe(null);
  }

  this.hasToken = function() {
    return !!$cookieStore.get('inbox_auth_token');
  }

  this.cssForTab = function(path) {
    return ($location.path().indexOf(path) != -1) ? 'active' : '';
  }

  var queryAuthToken = _valueForQueryParam('access_token')
  this.setToken(queryAuthToken || $cookieStore.get('inbox_auth_token'));
}]).


controller('ComposeCtrl', ['$scope', '$inbox', function($scope, $inbox) {
  var self = this;
  this.statusMessage = "";
  
  this.disposeClicked = function() {
    $scope.draft.dispose().then(function() {
    });
    $scope.$hide();
  };

  this.saveClicked = function() {
    self.statusMessage = 'Saving...';
    $scope.draft.save().then(function() {
      $scope.$hide();
    });
  };

  this.downloadAttachment = function(attachment) {
    $scope.draft.getAttachments().then(function(attachments) {
      for(i = 0; i < attachments.length; i++)
      {
        if(attachments[i].id == attachment.id)
          attachments[i].download().then(function(response) {
            saveAs(response.blob, response.filename);
          }, function(err) {
            console.log('error:' + err);
          });
      }
    }, _handleAPIError)
  };

  this.removeAttachment = function(attachment) {
    $scope.draft.removeAttachment(attachment);
  }

  this.attached = function() {
      var file_node = document.getElementById('upload');
      self.file = file_node.files[0];
      $scope.draft.uploadAttachment(self.file).then(function(in_file){
          self.statusMessage = '';
      }, function(err){
          console.log('error:' + err);
      }, function(){
        // progress??
      });
      self.statusMessage = 'uploading: ' + self.file.name;
  }

  this.attachClicked = function(file_node) {
    var self = this;
    var file_node = document.getElementById('upload');
    if(self.change_attached != true)
    {
      self.change_attached = true;
      $(file_node).on("change", this.attached);
    }
    file_node.click();
    return false;
  };

  this.sendClicked = function() {
    self.statusMessage = 'Saving...';
    $scope.draft.save().then(function() {
      self.statusMessage = 'Sending...';
      $scope.draft.send().then(function() {
        $scope.$hide();
      });
    });
  };

}]).


controller('MailCtrl', ['$scope', '$me', '$modal', '$routeParams', function($scope, $me, $modal, $routeParams) {
  $scope.MailCtrl = self;

  // sidebar, etc. logic here

}]).


controller('ThreadCtrl', ['$scope', '$me', '$threads', '$modal', '$routeParams', '$location', function($scope, $me, $threads, $modal, $routeParams, $location) {
  var self = this;
  
  this.thread = null;
  this.messages = null;
  this.drafts = null;

  // internal methods 

  function load() {
    // load the thread from the $threads provider if it's available
    var cached = $threads.item($routeParams['id']);
    if (cached) {
      loadWithThread(cached);
    } else {
      // load the thread from the API
      if (!$me.namespace()) {
        $me.on('update', load);
      }
      $me.namespace().thread($routeParams['id']).then(function(thread) {
        loadWithThread(thread);
      }, _handleAPIError);
    }
  }
  load();

  function loadWithThread(thread) {
    self.thread = thread;
    if (thread) {
      if (thread.hasTag('unread')) {
        thread.removeTags(['unread']).then(function(response) {
        }, _handleAPIError);
      }
      thread.messages().then(function(messages) {
        self.messages = messages;
      }, _handleAPIError);

      thread.drafts().then(function(drafts) {
        self.drafts = drafts;
      }, _handleAPIError);
    }
  }

  // exposed methods

  this.downloadAttachment = function(msg, id) {
    msg.attachment(id).download().then(function(response) {
      saveAs(response.blob, response.filename);
    }, _handleAPIError);
  };

  this.composeClicked = function() {
    self.launchDraftModal($me.namespace().draft());
  }

  this.replyClicked = function() {
    self.launchDraftModal(thread.reply());
  }

  this.archiveClicked = function() {
    self.thread.removeTags(['inbox']).then(function(response) {
      $location.path('/inbox');
    }, _handleAPIError);
  }

}]).


controller('ThreadListCtrl', ['$scope', '$me', '$threads', '$modal', '$routeParams', function($scope, $me, $threads, $modal, $routeParams) {
  var self = this;

  $scope.search = '';
  $scope.$watch('search', function() {
    updateAutocomplete();
  })

  $threads.setFilters({tag: $routeParams['tag'] || 'inbox'});

  this.threads = $threads.list();
  this.viewName = $routeParams['tag'];
  this.autocomplete = [];
  this.autocompleteSelection = null;

  // internal methods 

  function updateSearchWithFilters() {
    var filters = $threads.filters();
    var filterKeys = Object.keys(filters);
    var search = ''
    for (var ii = 0; ii < filterKeys.length; ii++)
      search += filterKeys[ii] + ':' + filters[filterKeys[ii]] + ' ';
    $scope.search = search;
  }

  function updateFiltersWithSearch() {
    var filters = {};
    var search_filters = $scope.search.split(' '); 
    for (var ii = 0; ii < search_filters.length; ii++) {
      var filter_parts = search_filters[ii].split(':');
      if (filter_parts.length == 2)
        filters[filter_parts[0]] = filter_parts[1].trim();
    }
    $threads.setFilters(filters);
  }

  function updateAutocomplete() {
    var contacts = $me.contacts();
    var term = $scope.search.toLowerCase();
    var results = []

    if (term.length == 0)
      return self.autocomplete = [];

    for (var ii = 0; ii < contacts.length; ii ++) {
      if ((contacts[ii].email.toLowerCase().indexOf(term) == 0) || (contacts[ii].name.toLowerCase().indexOf(term) == 0))
        results.push(contacts[ii]);
      if (results.length == 3)
        break;
    }
    self.autocomplete = results;
  }

  // exposed methods

  this.tagClicked = function(tag) {
    $threads.appendFilters({"tag": tag.tagName});
    updateSearchWithFilters();
  };

  this.composeClicked = function() {
    var draft = $me.namespace.draft()
    self.launchDraftModal(draft);
  }

  this.replyClicked = function(thread) {
    self.launchDraftModal(thread.reply());
  }

  this.archiveClicked = function(thread) {
    thread.removeTags(['inbox']).then(function(response) {
      if(self.filters['tag'] == 'inbox') {
        self.threads = _.without(self.threads, thread);
      }
    }, _handleAPIError);
  }

  this.searchClicked = function() {
    updateFiltersWithSearch();
  }

  this.searchCleared = function() {
    $scope.search = "";
    $threads.setFilters({});
  }

  this.tagOrder = function(tag_obj) {
    var tag = tag_obj.tagName || tag_obj.name;
    ordered = ["all", "inbox", "archive", "drafts", "spam", "send", "sending", "sent",
               "trash", "starred", "unread", "file", "attachment", "important", "unseen",
               "starred", "replied"];
    for(i = 0; i < ordered.length; i++) {
        if(ordered[i] == tag) {
            return i;
        }
    }
    return ordered.length;
  }

  this.tagFilter = function(tag_obj) {
    if(tag_obj.id.match("sending|send|sent|unread|all|unseen|unstarred|replied")) {
        return false;
    }
    return true;
  }

  this.threadTagFilter = function(tag_obj) {
    if(self.tagFilter(tag_obj) == false)
      return false;
    if(self.filters['tag'] == (tag_obj.tagName || tag_obj.name))
      return false;
    return true;
  }

  this.selectThreadRelative = function(direction) {
    for(i = 0; i < self.threads.length; i++) {
      if(self.threads[i] == self.selectedThread) {
        if(i + direction < self.threads.length - 1 && i + direction > 0) {
          self.selectedThread = self.threads[i + direction];
          angular.element(selectedNode).removeClass('active');
          selectedNode = document.getElementById(self.selectedThread.id);
          angular.element(selectedNode).addClass('active');
          break;
        }
      }
    }
  }

  this.keypressInAutocomplete = function(e) {
    var index = self.autocomplete.indexOf(self.autocompleteSelection);

    if(e.keyCode == 40) {
      if (self.autocompleteSelection == null)
        self.autocompleteSelection = self.autocomplete[0]
      else {
        if (index == -1)
          self.autocompleteSelection = self.autocomplete[0]
        else if (index + 1 < self.autocomplete.length)
          self.autocompleteSelection = self.autocomplete[index+1];
      }
      e.preventDefault();
    }

    if(e.keyCode == 38) {
      if (index > 0) {
        self.autocompleteSelection = self.autocomplete[index-1];
      }
      e.preventDefault();
    }

    if (e.keyCode == 13) {
      if (self.autocompleteSelection)
        $scope.search = "email:"+self.autocompleteSelection.email
      self.searchClicked();
    }

  }

  this.keypressCallback = function(e) {
    if(e.keyCode == 40)
      self.selectThreadRelative(1);
    if(e.keyCode == 38)
      self.selectThreadRelative(-1);
  }

  $threads.on('update', function() {
    self.threads = $threads.list();
  });
  updateSearchWithFilters();

}]);

