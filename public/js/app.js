angular.module('baobab', [
  'inbox',
  'ngSanitize',
  'ngCookies',
  'baobab.controllers'
]).
config(['$inboxProvider', function($inboxProvider) {
  if (window.location.href.indexOf('localhost') > 0)
    $inboxProvider.
      baseUrl('http://localhost:5000').
      appId('3rxk5nvnsaz03rcgmbvmkxt0v');
  else
    $inboxProvider.
      baseUrl('https://gunks.inboxapp.com:2222').
      appId('874wihqp9t7o29f5u2pd748hl');

}]).
service('$namespaces', ['$inbox', function($inbox) {
  var updateId = null, updateRate = null;
  var self = this;
  self.namespaces = null;
  Events(self);

  setNamespaces = function(value) {
    self.namespaces = value;
    self.emit('update', value);
  }

  updateList = function() {
    $inbox.namespaces().then(function(namespaces) {
      setNamespaces(namespaces);
    }, function(error) {
      setNamespaces(null);
    });
  }

  clearScheduledUpdate = function() {
    if (updateId !== null) {
      clearInterval(updateId);
      updateId = null;
    }
  }

  updateRate = function(ms) {
    clearScheduledUpdate();
    if (arguments.length > 0) {
      updateRate = ms;
    }
    updateId = setInterval(updateList, updateRate);
  }

  self.updateList = updateList;
  self.scheduleUpdate = updateRate;
}]).
filter('shorten', function() {
  return function(input) {
    if (typeof input === 'string' && input.length > 64) {
      return input.substring(0, 60) + ' ...';
    }
    return input;
  }
});
