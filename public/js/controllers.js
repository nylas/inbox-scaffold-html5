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

controller('AppCtrl', ['$scope', '$namespaces', '$inbox', '$cookieStore', '$sce', function($scope, $namespaces, $inbox, $cookieStore, $sce) {
  var self = this;

  this.theme = $cookieStore.get('baobab_theme') || 'light';

  this.inboxAuthURL = $sce.trustAsResourceUrl($inbox.baseUrl() + '/oauth/authorize');
  this.inboxClientID = $inbox.appId();
  this.inboxRedirectURL = window.location.href;
  this.loginHint = '';
  this.me = null;

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


controller('ComposeCtrl', ['$scope', '$namespaces', '$inbox', function($scope, $namespaces, $inbox) {
  var self = this;
  this.statusMessage = "";
  
  this.disposeClicked = function() {
    $scope.draft.dispose().then(function() {
      $scope.$root.$broadcast('reload-selected-thread');
    });
    $scope.$hide();
  };

  this.saveClicked = function() {
    self.statusMessage = 'Saving...';
    $scope.draft.save().then(function() {
      $scope.$root.$broadcast('reload-selected-thread');
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
        $scope.$root.$broadcast('reload-selected-thread');
        $scope.$hide();
      });
    });
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
      order_by: 'date',
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
      if(self.selectedThread.hasTag('unread'))
      {
        self.selectedThread.removeTags(['unread']).then(function(response) {
        }, _handleAPIError);
      }
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
      search += filterKeys[ii] + ':' + self.filters[filterKeys[ii]] + ' ';
    self.search = search;
  }

  function updateFiltersWithSearch() {
    self.filters = {};
    var search_filters = self.search.split(' '); 
    for (var ii = 0; ii < search_filters.length; ii++) {
      var filter_parts = search_filters[ii].split(':');
      if (filter_parts.length == 2)
        self.filters[filter_parts[0]] = filter_parts[1].trim();
    }
    loadThreads($namespaces.namespaces[0]);
  }

  // exposed methods

  this.downloadAttachment = function(msg, attachment) {
    msg.getAttachments().then(function(attachments) {
      for(i = 0; i < attachments.length; i++)
      {
        if(attachments[i].id == attachment.id)
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

  this.participantClicked = function(participant) {
    applyFilters({"email": participant.email})
  }

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
    self.search = "";
    self.filters = {};
    loadThreads($namespaces.namespaces[0]);
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
          loadSelectedThread();
          break;
        }
      }
    }
  }

  this.keypressCallback = function(e)
  {
    if(e.keyCode == 40)
      self.selectThreadRelative(1);
    if(e.keyCode == 38)
      self.selectThreadRelative(-1);
  }

  $namespaces.on('update', update);
  $scope.$on('reload-selected-thread', loadSelectedThread);

  update($namespaces.namespaces);
  updateSearchWithFilters();
}]);
