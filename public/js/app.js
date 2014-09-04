angular.module('baobab', [
  'inbox',
  'ngSanitize',
  'ngCookies',
  'ngRoute',
  'ngAnimate',
  'mgcrea.ngStrap.modal',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.popover',
  'infinite-scroll',
  'baobab.controllers'
]).

config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider.when('/thread/:id', {
    templateUrl: '/partials/thread.html',
    controller: 'ThreadCtrl as ThreadCtrl',
    resolve: {
      "$namespace": function($me) { return $me.namespacePromise; },
    }
  });
  $routeProvider.when('/mail/compose', {
    templateUrl: '/partials/compose-zen.html',
  });
  $routeProvider.when('/:tag', {
    templateUrl: '/partials/thread_list.html',
    controller: 'ThreadListCtrl as ThreadListCtrl'
  });
  $routeProvider.otherwise({redirectTo: '/inbox'});
}]).

config(['$inboxProvider', '$sceDelegateProvider', function($inboxProvider, $sceDelegateProvider) {
  $inboxProvider.
    baseUrl('https://api.inboxapp.com').
    appId('xdfim6g4mbduytzjhn8ud490');

  $sceDelegateProvider.resourceUrlWhitelist([
      'self', $inboxProvider.baseUrl() + "/**"]);
}]).

service('$me', ['$inbox', '$auth', function($inbox, $auth) {
  var self = this;
  Events(self);

  self._namespace = null;
  self._tags = [];
  self._contacts = [];

  self.tags = function() {
    return self._tags;
  }

  self.contacts = function() {
    return self._contacts;
  }

  self.emailAddress = function() {
    return (self._namespace) ? self._namespace.emailAddress : null;
  }

  if ($auth.token) {
    $inbox.withCredentials(true);
    $inbox.setRequestHeader('Authorization', 'Basic '+btoa($auth.token+':'));

    self.namespacePromise = $inbox.namespaces().then(function(namespaces) {
      self._namespace = namespaces[0];

      self._namespace.tags().then(function(tags) {
        self._tags = tags;
        self.emit('update-tags', self);
      }, _handleAPIError);

      self._namespace.contacts().then(function(contacts) {
        self._contacts = contacts;
        self.emit('update-contacts', self);
      }, _handleAPIError);

      return self._namespace;

    }, function(err) {
      self.setNamespace(null);
      if (confirm("/n/ returned no namespaces. Click OK to be logged out, or Cancel if you think this is a temporary issue."))
          $auth.clearToken();
    });
  }

}]).

service('$scrollState', ['$rootScope', function($rootScope) {
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
  }

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

}]).

service('$auth', ['$cookieStore', '$location', function($cookieStore, $location) {
  var self = this;

  this.clearToken = function() {
    $cookieStore.remove('inbox_auth_token');
    window.location = '/';
  }

  this.readTokenFromCookie = function() {
    try {
      self.token = $cookieStore.get('inbox_auth_token');
    } catch (e) {
      self.clearToken();
    }
    return (!!self.token);
  }

  this.readTokenFromURL = function() {
    var search = window.location.search;
    var tokenStart = search.indexOf('access_token=');
    if (tokenStart == -1)
      return;

    tokenStart += ('access_token=').length;

    var tokenEnd = search.indexOf('&', tokenStart);
    if (tokenEnd == -1) tokenEnd = search.length - tokenStart;

    var token = search.substr(tokenStart, tokenEnd);
    $cookieStore.put('inbox_auth_token', token);
    window.location.href = '/';
  }

  if (!this.readTokenFromCookie())
    this.readTokenFromURL();

}]).

service('$threads', ['$me', function($me) {
  var self = this;
  Events(self);

  self._list = null;
  self._listVersion = 0;
  self._listPendingParams = {};
  self._listIsCompleteSet = false;
  self._filters = {};
  self._page = 0;

  function makeAPIRequest() {
    $me.namespacePromise.then(function(namespace) {
      var pageSize = 100;
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

      var requested = self._listVersion;
      namespace.threads({}, params).then(function(threads) {
        // ignore this response if we've moved on to new params
        if (self._listVersion != requested)
          return;

        // if we received fewer items than we requested, this must
        // be the last page in the list
        self._listIsCompleteSet = (threads.length < pageSize);

        if (self._list)
          threads = threads.concat(self._list);
        threads.sort(function(a, b) {
          return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
        });

        self.setList(threads);
        self._page += 1;

      }, _handleAPIError);
    });
  }

  self.reload = function() {
    self._page = 0;
    self._listPendingParams = {};
    self._listIsCompleteSet = false;
    self.setList(null);
    makeAPIRequest();
  }

  self.list = function() {
    return self._list;
  }

  self.setList = function(list) {
    self._list = list;
    self.emit('update', self);
  }

  self.extendList = function() {
    makeAPIRequest();
  }

  self.listIsCompleteSet = function() {
    return self._listIsCompleteSet;
  }

  self.listIsMultiplePages = function() {
    return (self._page > 1);
  }

  self.item = function(id) {
    return _.find(self._list, function(t) { return t.id == id; });
  }

  self.itemArchived = function(id) {
    if (self._filters['tag'] == 'archive')
      return;
    self.setList(_.filter(self._list, function(t) {return t.id != id; }));
  }

  self.filters = function() {
    return self._filters;
  }

  self.setFilters = function(filters) {
    if (_.isEqual(filters, self._filters))
      return;

    for (var key in filters) {
      if (filters[key] == '')
        delete filters[key];
    }
    self._filters = filters;
    self.reload();
  }

  self.appendFilters = function(filtersToAppend) {
    self.setFilters(_.extend({}, self._filters, filtersToAppend));
    self.reload();
  }

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

filter('pretty_size', function() {
  return function(filesize) {
    if(filesize < 1000)
      return filesize + " B";
    if(filesize < 1000000)
      return Math.floor(filesize/1000) + " KB";
    else
      return Math.floor(filesize/1000000) + " MB";
  }
}).

filter('participants', ['$me', function($me) {
  return function(participants, preset) {
    var meParts = $me.emailAddress().split('@');
    var str = '';

    preset = preset || 'short';

    _.each(participants, function(participant) {
      // If we are the participant, show "Me" instead of our name
      name = participant.name;
      if (participant.email == $me.emailAddress())
        name = 'Me';

      // If there are only two participants, and we're one of them,
      // just show the other participant's name.
      if ((participants.length == 2) && (name == 'Me'))
        return;

      // If no name is provided, use the email address
      if ((name == false) || (name.length == 0)) {
        name = participant.email;
        var parts = name.split('@');

        if (preset == 'short') {
          // If the name contains the user's domain name, strip it out
          // team@inboxapp.com => team
          if (parts[1] == meParts[1])
            name = parts[0];

          // If the participant is an automated responder, show the email domain
          else if (_.contains(['support', 'no-reply', 'info'], parts[0]))
            name = parts[1];
        }
      }

      if (preset == 'short') {
        // If the name contains parenthesis "Inbox Support (Ben Gotow)", trim it
        // to the contents of the parenthesis
        if (name.indexOf('(') > 0) {
          var start = name.indexOf('(') + 1;
          var end = name.indexOf(')');
          name = name.substr(start, end-start);
        }
      }

      // Append the name to the output string
      str += str ? ', ' + name : name;
    });

    return str;
  }
}]).

filter('timestamp_ago', function() {
  return function(date) {
    return moment(date).fromNow();
  }
}).

filter('timestamp_short', function(){
  return function(date){
    var date = moment(date);
    var dateYear = date.format('YYYY')/1;
    var nowYear = moment().format('YYYY')/1;
    var dateDay = date.format('DDD')/1 + 365 * dateYear;
    var nowDay = moment().format('DDD')/1 + 365 * nowYear;

    if (dateDay == nowDay)
      return date.format('h:mma');
    else if (nowDay - dateDay < 7)
      return date.format('dddd, h:mma')
    else if (nowYear == dateYear)
      return date.format('MMM Do');
    else
      return date.format('M/D/YYYY');
  };
}).

filter('extension', function() {
  return function(filename) {
    var parts = filename.split('.');
    if (parts.length > 1)
      return parts[parts.length-1];
    else
      return "";
  };
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

directive('inParticipantBubble', [function() {
  return {
      restrict: "E",
      template: '<div class="participant-bubble"></div>',
      link: function(scope, element, attrs, ctrl) {
        var email = attrs['email'].toLowerCase().trim();
        var url = "/avatar/"+email;
        var hue = 0;
        for (var ii = 0; ii < email.length; ii++)
          hue += email.charCodeAt(ii);

        var el = $(element).find('.participant-bubble');
        el.css('background-color', 'hsl('+hue+',70%,60%)');
        el.css('background-image', 'url('+url+')');
        el.css('background-size','cover');
      }
  };
}]).

directive('inBindIframeContents', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      // Specify how UI should be updated
      ngModel.$render = function() {
        var doc = element[0].contentWindow.document;
        element[0].onload = function() {
          var height = doc.body.scrollHeight + 'px';
          doc.body.className += ' ' + 'heightDetermined';
          $(element).height(height);
          scope.$emit('inIframeLoaded');
        }
        var style = $('#iframe-css').html()
        doc.open();
        doc.write(style);
        doc.write(ngModel.$viewValue);
        doc.close();
      };
    }
  };
}).

directive('inParticipants', function() {
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
});

/* Helpers */
angular.scope = function (selector) {
  return this.element(document.querySelector(selector)).scope();
}
