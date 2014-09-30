(function() {
  define(["angular", "jQuery"], function(angular) {
    return angular.module('baobab.service.scrollstate', []).service('$scrollState', [
      '$rootScope', function($rootScope) {
        this._scrollID = null;
        this.scrollTo = (function(_this) {
          return function(id) {
            _this._scrollID = id;
            return _this.runScroll();
          };
        })(this);
        this.runScroll = (function(_this) {
          return function() {
            var offset;
            if (!_this._scrollID) {
              return;
            }
            offset = $('#' + _this._scrollID).offset();
            if (offset === void 0) {
              return;
            }
            return $('body').scrollTop(offset.top);
          };
        })(this);
        $rootScope.$on('$viewContentLoaded', this.runScroll);
        $rootScope.$on('$includeContentLoaded', this.runScroll);
        $rootScope.$on('inIframeLoaded', this.runScroll);
        $rootScope.$on('$routeChangeStart', (function(_this) {
          return function() {
            _this._scrollID = null;
            return $('body').scrollTop(0);
          };
        })(this));
        return this;
      }
    ]);
  });

}).call(this);
