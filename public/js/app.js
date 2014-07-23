angular.module('baobab', [
  'inbox',
  'ngSanitize',
  'ngCookies',
  'baobab.controllers'
]).
config(['$inboxProvider', function($inboxProvider) {
  $inboxProvider.
    baseUrl('https://gunks.inboxapp.com:2222').
    appId('e7yqrisa0x09rahjzs85x5qmv');
}]).
service('$namespaces', ['$inbox', function($inbox) {
  var updateId = null, updateRate = null;
  var self = this;
  self.namespaces = null;
  Events(self);
  function setNamespaces(value) {
    self.namespaces = value;
    self.emit('update', value);
  }

  function updateList() {
    $inbox.namespaces().then(function(namespaces) {
      setNamespaces(namespaces);
    }, function(error) {
      setNamespaces(null);
    });
  }

  function clearScheduledUpdate() {
    if (updateId !== null) {
      clearInterval(updateId);
      updateId = null;
    }
  }

  function updateRate(ms) {
    clearScheduledUpdate();
    if (arguments.length > 0) {
      updateRate = ms;
    }
    updateId = setInterval(updateList, updateRate);
  }

  self.scheduleUpdate = updateRate;
  updateList();
}]).
filter('shorten', function() {
  return function(input) {
    if (typeof input === 'string' && input.length > 64) {
      return input.substring(0, 60) + ' ...';
    }
    return input;
  }
});
