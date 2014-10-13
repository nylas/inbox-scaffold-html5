(function() {
  define(["angular"], function(angular, events) {
    return angular.module('baobab.service.namespace', []).service('$namespaces', [
      '$inbox', '$auth', function($inbox, $auth) {
        this._namespaces = [];
        this.current = (function(_this) {
          return function() {
            return _this._namespaces[0];
          };
        })(this);
        if ($auth.token || !$auth.needToken()) {
          this.promise = $inbox.namespaces().then((function(_this) {
            return function(namespaces) {
              return _this._namespaces = namespaces;
            };
          })(this), function(err) {
            if (window.confirm("/n/ returned no namespaces. Click OK to belogged out, or Cancel if you think this is a temporary issue.")) {
              return $auth.clearToken();
            }
          });
        } else {
          this.promise = Promise.reject("No auth token");
        }
        return this;
      }
    ]).factory('$namespaces-promise', [
      '$namespaces', function($n) {
        return $n.promise;
      }
    ]);
  });

}).call(this);
