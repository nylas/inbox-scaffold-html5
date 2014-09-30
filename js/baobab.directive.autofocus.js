(function() {
  define(["angular"], function(angular) {
    return angular.module('baobab.directive.autofocus', []).directive('autofocus', [
      '$timeout', function($timeout) {
        return function(scope, elem, attr) {
          var findTargetWithin, performFocus;
          findTargetWithin = function(elem) {
            var focusable, targets;
            focusable = $(elem).find("input, textarea");
            targets = focusable.filter(function(i, input) {
              var model;
              model = angular.element(input).attr("ng-model");
              return _.isEmpty(scope.$eval(model));
            });
            if (_.isEmpty(targets)) {
              return focusable.last();
            } else {
              return targets.first();
            }
          };
          performFocus = function(target) {
            var animatingParent;
            animatingParent = target.closest('.ng-animate');
            if (animatingParent.length) {
              return animatingParent.on('transitionend webkitTransitionEnd', function() {
                return $timeout(_.bind(target.focus, target), 1);
              });
            } else {
              return $timeout(_.bind(target.focus, target), 1);
            }
          };
          return scope.$on(attr.autofocus, function(e) {
            return $timeout(function() {
              var target;
              target = findTargetWithin(elem);
              return performFocus(target);
            });
          });
        };
      }
    ]);
  });

}).call(this);
