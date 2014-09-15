"use strict";

require(["angular"], function (angular) {

  angular.module('baobab.service.auth', [])

  .service('$auth', ['$cookieStore', '$location', function($cookieStore, $location) {
    var self = this;

    this.clearToken = function() {
      $cookieStore.remove('inbox_auth_token');
      window.location = '/';
    };

    this.readTokenFromCookie = function() {
      try {
        self.token = $cookieStore.get('inbox_auth_token');
      } catch (e) {
        self.clearToken();
      }
      return (!!self.token);
    };

    this.readTokenFromURL = function() {
      var search = window.location.search;
      var tokenStart = search.indexOf('access_token=');
      if (tokenStart == -1)
        return;

      tokenStart += ('access_token=').length;

      var tokenEnd = search.indexOf('&', tokenStart);
      if (tokenEnd == -1) tokenEnd = search.length - tokenStart;

      var token = search.substr(tokenStart, tokenEnd);
      $cookieStore.put('inbox_auth_token', token);
      window.location.href = '/';
    };

    if (!this.readTokenFromCookie())
      this.readTokenFromURL();
  }]);

});
