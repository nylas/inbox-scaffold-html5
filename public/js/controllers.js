angular.module('baobab.controllers', ['inbox', 'ngSanitize', 'ngCookies']).

controller('AppCtrl', ['$scope', '$namespaces', '$inbox', '$cookieStore', function($scope, $namespaces, $inbox, $cookieStore) {

  $scope.inbox_url = $inbox.baseUrl();
  $scope.inbox_client_id = $inbox.appId();
  $scope.inbox_redirect_url = window.location.href;
  $scope.authorized = false;
  $scope.login_hint = '';

  $scope.setToken = function(authToken) {
    if ((authToken == null) || (authToken == ''))
      return $scope.clearToken();

    $cookieStore.put('inbox_auth_token', authToken);
    $inbox.withCredentials(true);
    $inbox.setRequestHeader('Authorization', 'Basic '+btoa(authToken+':')); 
    $scope.authorized = true;
    $namespaces.updateList();
  }

  $scope.clearToken = function() {
    $cookieStore.remove('inbox_auth_token');
    $inbox.setRequestHeader('Authorization', ''); 
    $scope.authorized = false;
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

  var queryAuthToken = $scope.valueForQueryParam('access_token')
  $scope.setToken(queryAuthToken || $cookieStore.get('inbox_auth_token'));

  if (queryAuthToken)
    // We've stored the token in a cookie - wipe it from the location bar
    window.location.href = '/'

}]).

controller('threadsCtrl', ['$scope', '$namespaces', function(scope, $namespaces) {
  var threads = scope.threads = {};
  var filters = scope.filters = {};
  var self = this;
  function loadThreads(namespace, idx) {
    var _2WeeksAgo = ((new Date().getTime() - 1209600000) / 1000) >>> 0;
    if (!threads[namespace.id]) threads[namespace.id] = [];
    namespace.threads(threads[namespace.id], {
      lastMessageAfter: _2WeeksAgo,
      limit: 1000
    }).then(function(threads) {
      threads.sort(function(a, b) {
        a = a.lastMessageDate.getTime();
        b = b.lastMessageDate.getTime();
        return b - a;
      });
      return threads;
    }, function(error) {
      console.log(error);
    });
  }
  function update(namespaces) {
    if (namespaces) {
      var seen = {};
      var key;
      for (var i=0; i<namespaces.length; ++i) {
        seen[namespaces[i].id] = true;
        loadThreads(namespaces[i], i);
      }
      for (key in threads) {
        if (!seen[key]) delete threads[key];
      }
    }
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
      }, function() {
        // show error message
      });
    }
  }

  this.selectedThreadMessages = null;

  $namespaces.on('update', update);
  update($namespaces.namespaces);
}]);
