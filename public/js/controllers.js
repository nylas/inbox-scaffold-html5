// Helpers

var _clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

var _handleAPIError = function(error) {
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

controller('AppCtrl', ['$scope', '$namespaces', '$inbox', '$cookieStore', '$sce', function($scope, $namespaces, $inbox, $cookieStore, $sce) {
  var self = this;

  this.inboxAuthURL = $sce.trustAsResourceUrl($inbox.baseUrl() + '/oauth/authorize');
  this.inboxClientID = $inbox.appId();
  this.inboxRedirectURL = window.location.href;
  this.loginHint = '';
  this.me = null;

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
    self.me = null;
  }

  this.hasToken = function() {
    return !!$cookieStore.get('inbox_auth_token');
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
      self.me = {email_address: namespaces[0].emailAddress};
    else
      self.me = null

    if (self.hasToken() && !namespaces) {
      if (confirm("/n/ returned no namespaces for your API token. Click OK to be logged out, or Cancel if you think this is a temporary issue."))
          self.clearToken();
    }
  });

}]).


controller('ComposeCtrl', ['$scope', '$namespaces', function($scope, $namespaces) {
  var self = this;

  this.disposeClicked = function() {
    $scope.draft.dispose().then(function() {
      $scope.$root.$broadcast('reload-selected-thread');
    });
    $scope.$hide();
  };

  this.saveClicked = function() {
    $scope.draft.save().then(function() {
      $scope.$root.$broadcast('reload-selected-thread');
    });
    $scope.$hide();
  };

  this.sendClicked = function() {
    $scope.draft.send();
    $scope.$hide();
  };

}]).


controller('MailCtrl', ['$scope', '$namespaces', '$modal', function($scope, $namespaces, $modal) {
  var self = this;
  
  this.threads = [];
  this.tags = [];
  this.filters = {tag: 'inbox'};
  this.search = '';

  this.draftModal = $modal({
    scope: $scope,
    animation:'am-fade',
    placement:'center',
    container: '#mail-ctrl',
    template: '/partials/compose.html',
    backdrop: 'static',
    show: false
  });

  this.selectedThread = null;
  this.selectedThreadMessages = null;
  this.selectedThreadDrafts = null;

  // internal methods 

  function update(namespaces) {
    if (namespaces && namespaces.length) {
        loadThreads(namespaces[0]);
        loadTags(namespaces[0]);
    } else {
      self.threads = [];
      self.tags = [];
    }
  }

  function loadTags(namespace) {
    namespace.tags().then(function(tags) {
      self.tags = tags;
    }, _handleAPIError);
  }

  function loadThreads(namespace) {
    var _2WeeksAgo = ((new Date().getTime() - 1209600000) / 1000) >>> 0;
    var params = {
      order: 'date',
      lastMessageAfter: _2WeeksAgo,
      limit: 1000
    };
    for (var key in self.filters) {
      params[key] = self.filters[key];
    }

    self.selectedThread = null;
    self.selectedThreadMessages = null;
    self.selectedThreadDrafts = null;
    self.threads = null;

    namespace.threads({}, params).then(function(threads) {
      threads.sort(function(a, b) {
        return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
      });
      self.threads = threads;
      return threads;
    }, _handleAPIError);
  }

  function loadSelectedThread() {
    self.selectedThreadMessages = null;
    self.selectedThreadDrafts = null;

    if (self.selectedThread) {
      self.selectedThread.messages().then(function(messages) {
        self.selectedThreadMessages = messages;
      }, _handleAPIError);

      self.selectedThread.drafts().then(function(drafts) {
        self.selectedThreadDrafts = drafts;
      }, _handleAPIError);
    }
  }

  function applyFilters(filtersToAppend) {
    for (var key in filtersToAppend)
      self.filters[key] = filtersToAppend[key];

    loadThreads($namespaces.namespaces[0]);
    updateSearchWithFilters();
  }

  function updateSearchWithFilters() {
    var filterKeys = Object.keys(self.filters)
    var search = ''
    for (var ii = 0; ii < filterKeys.length; ii++)
      search += filterKeys[ii] + ':' + self.filters[filterKeys[ii]];
    self.search = search;
  }

  function updateFiltersWithSearch() {
    self.filters = {};
    var search_filters = self.search.split(' '); 
    for (var ii = 0; ii < search_filters.length; ii++) {
      var filter_parts = search_filters[ii].split(':');
      if (filter_parts.length == 2)
        self.filters[filter_parts[0]] = filter_parts[1];
    }
    loadThreads($namespaces.namespaces[0]);
  }
  
  // exposed methods

  this.downloadAttachment = function(msg, attachment_id) {
    msg.attachments().then(function(attachments) {
      for(i = 0; i < attachments.length; i++)
      {
        if(attachments[i].id == attachment_id)
          attachments[i].download();
      }
    }, _handleAPIError)
  };

  this.launchDraftModal = function(draft) {
    $scope.draft = draft;
    self.draftModal.$promise.then(self.draftModal.show);
  };

  this.tagClicked = function(tag) {
    applyFilters({"tag": tag.tagName});
  };

  var selectedNode;
  this.threadClicked = function(thread, event) {
    if (event) {
      if (event.currentTarget === selectedNode) return;
      angular.element(selectedNode).removeClass('active');
      selectedNode = event.currentTarget;
      angular.element(selectedNode).addClass('active');
    }

    self.selectedThread = thread;
    loadSelectedThread();
  }

  this.composeClicked = function() {
    self.launchDraftModal($namespaces.namespaces[0].draft());
  }

  this.replyClicked = function(thread) {
    self.launchDraftModal(thread.reply());
  }

  this.searchClicked = function() {
    updateFiltersWithSearch();
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
    var tag = tag_obj.tagName || tag_obj.name;
    if(tag.match("sending|send|sent|unread|all|unseen|unstarred|replied")) {
        return false;
    }
    return true;
  }

  $namespaces.on('update', update);
  $scope.$on('reload-selected-thread', loadSelectedThread);

  update($namespaces.namespaces);
  updateSearchWithFilters();
}]);
