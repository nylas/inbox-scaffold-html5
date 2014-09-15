"use strict";
define(["angular"], function (angular) {
  angular.module('baobab.directive.inParticipants', [])

  .directive('inParticipants', function() {
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
});
