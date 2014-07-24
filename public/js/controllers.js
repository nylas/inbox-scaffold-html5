// Helpers

_handleAPIError = function(err) {
  var msg = "An unexpected error occurred. (HTTP code " + error['status'] + "). Please try again.";
  if (error['message'])
      msg = error['message'];
  alert(msg);
};

// Controllers

angular.module('baobab.controllers', ['inbox', 'ngSanitize', 'ngCookies']).

controller('AppCtrl', ['$scope', '$namespaces', '$inbox', '$cookieStore', '$sce', function($scope, $namespaces, $inbox, $cookieStore, $sce) {

  $scope.inbox_url = $inbox.baseUrl();
  $scope.inbox_client_id = $inbox.appId();
  $scope.inbox_redirect_url = window.location.href;
  $scope.login_hint = '';
  $scope.me = null;

  $scope.actionUrl = $sce.trustAsResourceUrl($scope.inbox_url)

  $scope.setToken = function(authToken) {
    if ((authToken == null) || (authToken == ''))
      return $scope.clearToken();

    $cookieStore.put('inbox_auth_token', authToken);
    $inbox.withCredentials(true);
    $inbox.setRequestHeader('Authorization', 'Basic '+btoa(authToken+':')); 
    $namespaces.updateList();
  }

  $scope.clearToken = function() {
    $cookieStore.remove('inbox_auth_token');
    $inbox.setRequestHeader('Authorization', ''); 
    $scope.me = null;
  }

  $scope.valueForQueryParam = function(param_name) {
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

  $namespaces.on('update', function(namespaces) {
    if (namespaces.length > 0)
      $scope.me = {email_address: namespaces[0].emailAddress};
    else
      $scope.me = null
  });

  var queryAuthToken = $scope.valueForQueryParam('access_token')
  $scope.setToken(queryAuthToken || $cookieStore.get('inbox_auth_token'));

  if (queryAuthToken)
    // We've stored the token in a cookie - wipe it from the location bar
    window.location.href = '/'

}]).

controller('tagsCtrl', ['$scope', '$namespaces', function($scope, $namespaces) {
  $scope.tags = [];

  $scope.filterByTag = function(tag) {
    $scope.$root.$broadcast('append-filter', {'tag':tag.tagName});
  };

  function loadTags(namespace) {
    namespace.tags().then(function(tags) {
      $scope.tags = tags;
    }, _handleAPIError);
  }

  function update(namespaces) {
    if (namespaces && namespaces.length) {
      loadTags(namespaces[0]);
    } else {
      $scope.tags = [];
    }
  };

  $namespaces.on('update', update);
  update($namespaces.namespaces);

}]).

controller('threadsCtrl', ['$scope', '$namespaces', function($scope, $namespaces) {
  
}]).


controller('MailCtrl', ['$scope', '$namespaces', function($scope, $namespaces) {
  $scope.threads = [];
  $scope.filters = {};
  $scope.search = '';

  var self = this;
  this.selectedThreadMessages = null;

  function loadThreads(namespace) {
    var _2WeeksAgo = ((new Date().getTime() - 1209600000) / 1000) >>> 0;
    var params = {
      order: 'date',
      lastMessageAfter: _2WeeksAgo,
      limit: 1000
    };

    for (var key in $scope.filters) {
      params[key] = $scope.filters[key];
    }

    namespace.threads({}, params).then(function(threads) {
      threads.sort(function(a, b) {
        return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
      });
      $scope.threads = threads;
      return threads;
    }, _handleAPIError);
  }

  var selectedNode;
  this.select = function(thread, event) {
    if (event) {
      if (event.currentTarget === selectedNode) return;
      angular.element(selectedNode).removeClass('active');
      selectedNode = event.currentTarget;
      angular.element(selectedNode).addClass('active');
    }
    if (thread) {
      thread.messages().then(function(messages) {
        self.selectedThreadMessages = messages;
      }, _handleAPIError);
    }
  }

  function update(namespaces) {
    if (namespaces && namespaces.length) {
        loadThreads(namespaces[0]);
    } else {
      $scope.threads = [];
    }
  }

  $scope.$root.$on('append-filter', function(event, filtersToAppend){
    for (var key in filtersToAppend)
        $scope.filters[key] = filtersToAppend[key];

    loadThreads($namespaces.namespaces[0]);

    var filterKeys = Object.keys($scope.filters)
    var search = ''
    for (var ii = 0; ii < filterKeys.length; ii++)
      search += filterKeys[ii] + ':' + $scope.filters[filterKeys[ii]];
    
    $scope.search = search;
  });

  $scope.updateFiltersWithSearch = function() {
    $scope.filters = {};
    var search_filters = $scope.search.split(' '); 
    for (var ii = 0; ii < search_filters.length; ii++) {
      var filter_parts = search_filters[ii].split(':');
      if (filter_parts.length == 2)
        $scope.filters[filter_parts[0]] = filter_parts[1];
    }
    loadThreads($namespaces.namespaces[0]);
  };

  $scope.tagOrder = function(tag_obj) {
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

  $scope.tagFilter = function(tag_obj) {
    var tag = tag_obj.tagName || tag_obj.name;
    if(tag.match("sending|send|sent|unread|all|unseen|unstarred|replied")) {
        return false;
    }
    return true;
  }

  $namespaces.on('update', update);
  update($namespaces.namespaces);
}]);
