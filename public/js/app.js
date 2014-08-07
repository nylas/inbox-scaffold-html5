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
  // if (window.location.href.indexOf('localhost') > 0)
  //   $inboxProvider.
  //     baseUrl('http://localhost:5000').
  //     appId('3rxk5nvnsaz03rcgmbvmkxt0v');
  // else
    $inboxProvider.
      baseUrl('https://beta.inboxapp.com').
      appId('874wihqp9t7o29f5u2pd748hl');

  $sceDelegateProvider.resourceUrlWhitelist([
      'self',
      $inboxProvider.baseUrl() + "/**"]);

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
filter('pretty_size', function() {
  return function(input) {
      return prettySize(input);
  }
}).
filter('type_to_glyph', function() {
  return function(type) {
    if(type == "application/pdf") {
      return "book"
    } else if(type.match(/image/)) {
      return "picture"
    } else if(type.match(/audio/)) {
      return "music"
    } else if(type.match(/video/)) {
      return "video"
    } else if(type.match(/text/)) {
      return "list-alt"
    } else if(type == "application/gzip") {
      return "compressed";
    } else {
      return "file";
    }
  }
}).
filter('attachment_type_to_glyph', function() {
  return function(input) {
    type = input.contentType;
    if(typeof type === "undefined") {
      return "file";
    }

    if(type == "application/pdf") {
      return "book"
    } else if(type.match(/image/)) {
      return "picture"
    } else if(type.match(/audio/)) {
      return "music"
    } else if(type.match(/video/)) {
      return "video"
    } else if(type.match(/text/)) {
      return "list-alt"
    } else if(type == "application/gzip") {
      return "compressed";
    } else {
      return "file";
    }
  }
}).

directive('makeParticipants', function() {
  function format(value) {
    if (value && Object.prototype.toString.call(value) === '[object Array]') {
      var str = '';
      var p;
      for (var i=0; i<value.length; ++i) {
        p = value[i];
        if (p && typeof p === 'object' && p.email) {
          str += str ? ', ' + p.email : p.email;
        }
      }
      return str;
    }
  }

  function parse(value) {
    if (typeof value === 'string') {
      value = value.split(/\s*,\s*/);
      for (var i=value.length; --i >= 0;) {
        if (!value[i]) value.splice(i, 1);
        else {
          value[i] = {
            name: '',
            email: value[i]
          };
        }
      }
    }
    return value;
  }
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$formatters.push(format);
      ngModel.$parsers.push(parse);
    }
  };
}).
directive('summerNote', function() {
  return {
    require: '?ngModel',
    link: function(scope, element, attr, ngModel) {
      element = $(element);
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

      setTimeout(function() {
        element.code(ngModel.$viewValue);
      }, 0);

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
