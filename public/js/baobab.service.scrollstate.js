"use strict";

define(["angular", "jQuery"], function(angular) {

  angular.module('baobab.service.scrollstate', [])

  .service('$scrollState', ['$rootScope', function($rootScope) {
    var self = this;

    self._scrollID = null;

    this.scrollTo = function(id) {
      self._scrollID = id;
      self.runScroll();
    };

    this.runScroll = function() {
      if (!self._scrollID) return;
      var offset = $('#'+self._scrollID).offset();
      if (offset === undefined) return;

      $('body').scrollTop(offset.top);
    };

    // update our scroll offset when components of the view load: angular views,
    // angular partials, and our own (async) iFrames for messages.
    $rootScope.$on('$viewContentLoaded', self.runScroll);
    $rootScope.$on('$includeContentLoaded', self.runScroll);
    $rootScope.$on('inIframeLoaded', self.runScroll);

    // reset the scroll offset when we visit a new route
    $rootScope.$on('$routeChangeStart', function() {
      self._scrollID = null;
      $('body').scrollTop(0);
    });

  }]);
});
