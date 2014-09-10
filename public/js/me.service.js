"use strict";
var Baobab, Events, _handleAPIError; // globals

Baobab

.service('$me', ['$inbox', '$auth', function($inbox, $auth) {
  var self = this;
  var events = Events; // Linter thinks Events is a constructor.
  events(self);

  self._namespace = null;
  self._tags = [];
  self._contacts = [];

  self.tags = function() {
    return self._tags;
  };

  self.contacts = function() {
    return self._contacts;
  };

  self.emailAddress = function() {
    return (self._namespace) ? self._namespace.emailAddress : null;
  };


  if ($auth.token) {
    $inbox.withCredentials(true);
    $inbox.setRequestHeader('Authorization', 'Basic '+btoa($auth.token+':'));

    self.namespacePromise = $inbox.namespaces().then(function(namespaces) {
      self._namespace = namespaces[0];

      self._namespace.tags().then(function(tags) {
        self._tags = tags;
        self.emit('update-tags', self);
      }, _handleAPIError);

      self._namespace.contacts().then(function(contacts) {
        self._contacts = contacts;
        self.emit('update-contacts', self);
      }, _handleAPIError);

      return self._namespace;

    }, function(err) {
      self.setNamespace(null);
      if (window.confirm("/n/ returned no namespaces. Click OK to be logged out, or Cancel if you think this is a temporary issue."))
          $auth.clearToken();
    });
  } else {
    self.namespacePromise = Promise.reject("No auth token");
  }

}]);