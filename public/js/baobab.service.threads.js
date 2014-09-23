"use strict";
var _handleAPIError;

define(["angular", "Events", "underscore"], function (angular, Events, _) {
  angular.module("baobab.service.threads", [])

  .service('$threads', ['$namespaces', function($namespaces) {
    var self = this;
    var events = Events; // Lint thinks this is a constructor (rightly so)
    events(self);

    self._list = null;
    self._listVersion = 0;
    self._listPendingParams = {};
    self._listIsCompleteSet = false;
    self._filters = {};
    self._page = 0;
    self._pageSize = 100;

    function makeAPIRequest() {
      var pageSize = self._pageSize;
      var params = _.extend({}, self._filters, {
        limit: pageSize,
        offset: self._page * pageSize
      });

      // bail if params are identical to the previous request
      if (_.isEqual(params, self._listPendingParams))
        return;

      // bail if the last request returned fewer items than requested
      if (self._listIsCompleteSet)
        return;

      // increment the list verison number so any pending requests with old
      // params will be ignored when they complete.
      self._listVersion += 1;
      self._listPendingParams = params;
      self.setSilentRefreshEnabled(false);

      var requested = self._listVersion;
      $namespaces.current().threads({}, params).then(function(threads) {
        // ignore this response if we've moved on to new params
        if (self._listVersion != requested)
          return;

        // if we received fewer items than we requested, this must
        // be the last page in the list
        self._listIsCompleteSet = (threads.length < pageSize);

        if (self._list)
          threads = threads.concat(self._list);

        self.setList(threads);
        self.setSilentRefreshEnabled(true);
        self._page += 1;

      }, _handleAPIError);
    }

    self.reload = function() {
      self._page = 0;
      self._listPendingParams = {};
      self._listIsCompleteSet = false;
      self.setList(null);
      makeAPIRequest();
    };

    self.list = function() {
      return self._list;
    };

    self.setList = function(list) {
      if (list) {
        list.sort(function(a, b) {
          return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
        });
      }
      self._list = list;
      self.emit('update', self);
    };

    self.extendList = function() {
      makeAPIRequest();
    };

    self.listIsCompleteSet = function() {
      return self._listIsCompleteSet;
    };

    self.listIsMultiplePages = function() {
      return (self._page > 1);
    };

    self.item = function(id) {
      return _.find(self._list, function(t) { return t.id == id; });
    };

    self.itemArchived = function(id) {
      if (self._filters['tag'] == 'archive')
        return;
      self.setList(_.filter(self._list, function(t) {return t.id != id; }));
    };

    self.filters = function() {
      return self._filters;
    };

    self.setFilters = function(filters) {
      if (_.isEqual(filters, self._filters))
        return;

      for (var key in filters) {
         if (filters[key] === '')
          delete filters[key];
      }
      self._filters = filters;
      self.reload();
    };

    self.appendFilters = function(filtersToAppend) {
      self.setFilters(_.extend({}, self._filters, filtersToAppend));
      self.reload();
    };

    self.silentRefresh = function() {
      var params = _.extend({}, self._filters, {
        offset: 0,
        limit: self._page * self._pageSize
      });

      self.setSilentRefreshEnabled(false);

      var requested = self._listVersion;
      $namespaces.current().threads({}, params).then(function(threads) {
        // ignore this response if we've moved on to new params
        if (self._listVersion != requested)
          return;

        self.setList(threads);
        self.setSilentRefreshEnabled(true);

      }, _handleAPIError);
    }

    self.setSilentRefreshEnabled = function(enabled) {
      if (self._timer)
        clearInterval(self._timer);
      if (enabled)
        self._timer = setInterval(self.silentRefresh, 10000);
      console.log('silent refresh: '+enabled);
    }

  }]);
});
