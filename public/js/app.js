angular.module('baobab', [
  'inbox',
  'ngSanitize',
  'ngCookies',
  'ngAnimate',
  'mgcrea.ngStrap.modal',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.popover',
  'baobab.controllers'
]).
config(['$inboxProvider', '$sceDelegateProvider', function($inboxProvider, $sceDelegateProvider) {
  if (window.location.href.indexOf('localhost') > 0)
    $inboxProvider.
      baseUrl('http://localhost:5000').
      appId('5shrj3xn5r3abzial4jrkaidb');
  else
    $inboxProvider.
      baseUrl('https://gunks.inboxapp.com:2222').
      appId('874wihqp9t7o29f5u2pd748hl');
  if (window.location.href.indexOf('localhost') > 0)
      $sceDelegateProvider.resourceUrlWhitelist([
          'self',
          "http://localhost:5000/**"]);
  else
      $sceDelegateProvider.resourceUrlWhitelist([
          'self',
          "https://gunks.inboxapp.com:2222/**"]);

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
}).
directive('summerNote', function() {
  return {
    require: '?ngModel',
    link: function(scope, element, attr, ngModel) {
      element.summernote({
        codemirror: {
          theme: 'monokai'
        },
        height: attr.height || 300,
        onpaste: listener,
        onChange: listener,
        onToolbarClick: listener,
        toolbar: [
          ['style', ['bold', 'italic', 'underline']],
          ['fontname', ['fontname']],
          ['color', ['color']],
          ['fontsize', ['fontsize']],
          ['para', ['ul', 'ol', 'paragraph']],
          ['extra', ['fullscreen', 'codeview', 'undo', 'redo', 'help']]
        ]
      });

      function listener() {
        var contents = element.code();
        if (ngModel && contents !== ngModel.$viewValue) {
          ngModel.$setViewValue(contents);
          scope.$apply();
        }
      }

      function destroy() {
        element.destroy();
      }

      scope.$on('$destroy', destroy);
    }
  };
});
