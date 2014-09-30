(function() {
  define(['angular'], function(angular) {
    return angular.module("baobab.controller.app", []).controller('AppCtrl', [
      '$scope', '$namespaces', '$inbox', '$auth', '$location', '$cookieStore', '$sce', function($scope, $namespaces, $inbox, $auth, $location, $cookieStore, $sce) {
        window.AppCtrl = this;
        this.inboxAuthURL = $sce.trustAsResourceUrl('https://www.inboxapp.com/oauth/authorize');
        this.inboxClientID = $inbox.appId();
        this.inboxRedirectURL = window.location.href.split('/#')[0].replace('index.html', '');
        this.loginHint = '';
        this.clearToken = $auth.clearToken;
        this.token = (function(_this) {
          return function() {
            return $auth.token;
          };
        })(this);
        this.namespace = (function(_this) {
          return function() {
            return $namespaces.current();
          };
        })(this);
        this.theme = $cookieStore.get('baobab_theme') || 'light';
        this.setTheme = (function(_this) {
          return function(theme) {
            _this.theme = theme;
            return $cookieStore.put('baobab_theme', theme);
          };
        })(this);
        this.toggleTheme = (function(_this) {
          return function() {
            return _this.setTheme({
              light: 'dark',
              dark: 'light'
            }[_this.theme]);
          };
        })(this);
        this.cssForTab = (function(_this) {
          return function(path) {
            if ($location.path().indexOf(path) !== -1) {
              return 'active';
            } else {
              return '';
            }
          };
        })(this);
        return this;
      }
    ]);
  });

}).call(this);
