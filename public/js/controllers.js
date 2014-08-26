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

controller('AppCtrl', ['$scope', '$namespaces', '$inbox', '$location', '$cookieStore', '$sce', function($scope, $namespaces, $inbox, $location, $cookieStore, $sce) {
  var self = this;

  this.theme = $cookieStore.get('baobab_theme') || 'light';

  this.inboxAuthURL = $sce.trustAsResourceUrl('https://beta.inboxapp.com/oauth/authorize');
  this.inboxClientID = $inbox.appId();
  this.inboxRedirectURL = window.location.href;
  this.loginHint = '';
  this.me = null;

  this.setTheme = function(theme) {
    self.theme = theme;
    $cookieStore.put('baobab_theme', theme);
  }

  this.setMe = function(me) {
    $scope.me = this.me = me;
    $scope.$broadcast('me-changed');
  }

  this.setToken = function(authToken) {
    if ((authToken == null) || (authToken == ''))
      return self.clearToken();

    $cookieStore.put('inbox_auth_token', authToken);
    $inbox.withCredentials(true);
    $inbox.setRequestHeader('Authorization', 'Basic '+btoa(authToken+':'));
    $namespaces.updateList();
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

  if (queryAuthToken) {
    // We've stored the token in a cookie - wipe it from the location bar
    window.location.href = '/';
    return;
  }

  $namespaces.on('update', function(namespaces) {
    if (namespaces && (namespaces.length > 0))
      self.setMe({namespace: namespaces[0], email_address: namespaces[0].emailAddress});
    else
      self.setMe(null);

    if (self.hasToken() && !namespaces) {
      if (confirm("/n/ returned no namespaces for your API token. Click OK to be logged out, or Cancel if you think this is a temporary issue."))
          self.clearToken();
    }
  });

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


controller('MailCtrl', ['$scope', '$modal', '$routeParams', function($scope, $modal, $routeParams) {
  var self = this;
  $scope.MailCtrl = self;

  this.tags = [];
  this.contacts = [];

  this.draftModal = $modal({
    scope: $scope,
    animation:'am-fade',
    placement:'center',
    container: '#mail-ctrl',
    template: '/partials/compose.html',
    backdrop: 'static',
    show: false
  });

  // internal methods 

  function load() {
    if (!$scope.me) return;
    if ($scope.me.namespace) {
        loadTags();
        loadContacts();
    } else {
      self.tags = [];
      self.contacts = [];
    }
  }

  function loadTags() {
    var namespace = $scope.me.namespace;
    namespace.tags().then(function(tags) {
      self.tags = tags;
    }, _handleAPIError);
  }

  function loadContacts() {
    var namespace = $scope.me.namespace;
    namespace.contacts().then(function(contacts) {
      self.contacts = contacts;
    }, _handleAPIError);
  }

  // public methods

  this.launchDraftModal = function(draft) {
    $scope.draft = draft;
    self.draftModal.$promise.then(self.draftModal.show);
  };

  $scope.$on('me-changed', load);
  load();
}]).


controller('ThreadCtrl', ['$scope', '$modal', '$routeParams', function($scope, $modal, $routeParams) {
  var self = this;
  
  this.thread = null;
  this.messages = null;
  this.drafts = null;

  // internal methods 

  function load() {
    if (!$scope.me) return;
    var namespace = $scope.me.namespace;

    namespace.thread($routeParams['id']).then(function(thread) {
      loadWithThread(thread);
    }, _handleAPIError);
  }

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

  this.downloadAttachment = function(msg, attachment) {
    msg.getAttachments().then(function(attachments) {
      for(i = 0; i < attachments.length; i++)
      {
        if(attachments[i].id == attachment.id)
          attachments[i].download().then(function(response) {
            saveAs(response.blob, response.filename);
          }, _handleAPIError);
      }
    }, _handleAPIError)
  };

  this.composeClicked = function() {
    self.launchDraftModal($scope.me.namespace.draft());
  }

  this.replyClicked = function(thread) {
    self.launchDraftModal(thread.reply());
  }

  this.archiveClicked = function(thread) {
    if(!self.selectedThread.hasTag('inbox'))
        return;

    self.selectedThread.removeTags(['inbox']).then(function(response) {
      if(self.filters['tag'] == 'inbox') {
        for(i = 0; i < self.threads.length; i++) {
          if(self.threads[i] == thread) {
            self.threads.splice(i, 1);
            break;
          }
        }
        self.selectedThread = null;
      }
    }, _handleAPIError);
  }

  $scope.$on('me-changed', load);
  load();
}]).


controller('ThreadListCtrl', ['$scope', '$modal', '$routeParams', function($scope, $modal, $routeParams) {
  var self = this;

  $scope.search = '';
  $scope.$watch('search', function() {
    updateAutocomplete();
  })

  this.threads = [];
  this.filters = {tag: $routeParams['tag'] || 'inbox'};
  this.viewName = $routeParams['tag'];
  this.autocomplete = [];
  this.autocompleteSelection = null;

  // internal methods 

  function load() {
    if (!$scope.me) return;
    if ($scope.me.namespace) {
        loadThreads();
    } else {
      self.threads = [];
    }
  }

  function loadThreads() {
    var namespace = $scope.me.namespace;
    var _2WeeksAgo = ((new Date().getTime() - 1209600000) / 1000) >>> 0;
    var params = {
      order_by: 'date',
      lastMessageAfter: _2WeeksAgo,
      limit: 1000
    };
    for (var key in self.filters) {
      params[key] = self.filters[key];
    }

    self.threads = null;

    namespace.threads({}, params).then(function(threads) {
      threads.sort(function(a, b) {
        return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
      });
      self.threads = threads;
      return threads;
    }, _handleAPIError);
  }

  function applyFilters(filtersToAppend) {
    for (var key in filtersToAppend)
      self.filters[key] = filtersToAppend[key];

    loadThreads();
    updateSearchWithFilters();
  }

  function updateSearchWithFilters() {
    var filterKeys = Object.keys(self.filters)
    var search = ''
    for (var ii = 0; ii < filterKeys.length; ii++)
      search += filterKeys[ii] + ':' + self.filters[filterKeys[ii]] + ' ';
    $scope.search = search;
  }

  function updateFiltersWithSearch() {
    self.filters = {};
    var search_filters = $scope.search.split(' '); 
    for (var ii = 0; ii < search_filters.length; ii++) {
      var filter_parts = search_filters[ii].split(':');
      if (filter_parts.length == 2)
        self.filters[filter_parts[0]] = filter_parts[1].trim();
    }
    loadThreads();
  }

  function updateAutocomplete() {
    var contacts = $scope.MailCtrl.contacts;
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
    applyFilters({"tag": tag.tagName});
  };

  this.composeClicked = function() {
    var draft = $scope.me.namespace.draft()
    self.launchDraftModal(draft);
  }

  this.replyClicked = function(thread) {
    self.launchDraftModal(thread.reply());
  }

  this.archiveClicked = function(thread) {
    if(!self.selectedThread.hasTag('inbox'))
        return;

    self.selectedThread.removeTags(['inbox']).then(function(response) {
      if(self.filters['tag'] == 'inbox') {
        for(i = 0; i < self.threads.length; i++) {
          if(self.threads[i] == thread) {
            self.threads.splice(i, 1);
            break;
          }
        }
        self.selectedThread = null;
      }
    }, _handleAPIError);
  }

  this.searchClicked = function() {
    updateFiltersWithSearch();
  }

  this.searchCleared = function() {
    $scope.search = "";
    self.filters = {};
    loadThreads();
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

  this.selectThreadRelative = function(direction)
  {
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

  $scope.$on('me-changed', load);
  load();
  updateSearchWithFilters();

}]);

