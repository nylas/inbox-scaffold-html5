"use strict";
var BaobabControllers; //globals

BaobabControllers
.controller('AppCtrl', ['$scope', '$me', '$inbox', '$auth', '$location', '$cookieStore', '$sce', function($scope, $me, $inbox, $auth, $location, $cookieStore, $sce) {
  var self = this;
  window.AppCtrl = this;

  this.inboxAuthURL = $sce.trustAsResourceUrl('https://www.inboxapp.com/oauth/authorize');
  this.inboxClientID = $inbox.appId();
  this.inboxRedirectURL = window.location.protocol + "//" + window.location.host + "/";
  this.loginHint = '';

  this.clearToken = $auth.clearToken;
  this.token = function() {
    return $auth.token;
  };
  this.namespace = function() {
    return $me._namespace;
  };

  this.theme = $cookieStore.get('baobab_theme') || 'light';
  this.setTheme = function(theme) {
    self.theme = theme;
    $cookieStore.put('baobab_theme', theme);
  };

  this.cssForTab = function(path) {
    return ($location.path().indexOf(path) != -1) ? 'active' : '';
  };
}]);