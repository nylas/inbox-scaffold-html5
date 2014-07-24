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
      appId('5shrj3xn5r3abzial4jrkaidb');
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

  tagSort = function(tag) {
      console.log(tag)
      if (tag == "All") {
          return 0;
      } else if (tag == "Inbox") {
          return 1;
      } else if (tag == "Archive") {
          return 2;
      } else if (tag == "Drafts") {
          return 3;
      } else if (tag == "Spam") {
          return 4;
      } else if (tag == "Send") {
          return 5;
      } else if (tag == "Sent") {
          return 6;
      } else if (tag == "Trash") {
          return 7;
      } else if (tag == "Starred") {
          return 8;
      } else if (tag == "Unread") {
          return 9;
      } else if (tag == "Sending") {
          return 10;
      } else {
          return 11;
      }
  }

  self.tagSort = tagSort;
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
}).
filter('tag_expand', function() {
  return function(input) {
      var tags="";
      for (index = 0; index < input.length; ++index) {
          tags += input[index].name + " ";
      }
      return tags;
  }
}).
filter('pretty_date', function() {
  return function(input) {
      return prettyDate(input);
  }
});
