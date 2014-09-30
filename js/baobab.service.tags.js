(function() {
  define(["angular", "error"], function(angular, error) {
    return angular.module('baobab.service.tags', []).service('$tags', [
      '$namespaces', function($namespaces) {
        this._list = [];
        this.list = (function(_this) {
          return function() {
            return _this._list;
          };
        })(this);
        $namespaces.current().tags().then((function(_this) {
          return function(tags) {
            return _this._list = tags;
          };
        })(this), error._handleAPIError);
        return this;
      }
    ]);
  });

}).call(this);
