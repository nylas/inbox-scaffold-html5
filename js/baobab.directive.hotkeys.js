(function() {
  define(["angular"], function(angular) {
    return angular.module('baobab.directive.hotkeys', []).directive('bindKeys', [
      "$rootScope", function($rootScope) {
        return {
          restrict: 'A',
          link: function(scope, element, attrs) {
            var isMeta, meta;
            meta = false;
            isMeta = function(event) {
              return event.ctrlKey;
            };
            element.bind('keyup', function(event) {
              if (isMeta(event) || !meta) {
                return true;
              }
              meta = false;
              $rootScope.$broadcast("meta-up");
              return true;
            });
            element.bind('keydown', function(event) {
              if (!isMeta(event) || meta) {
                return true;
              }
              meta = true;
              $rootScope.$broadcast("meta-down");
              return true;
            });
            return element.bind('keypress', function(event) {
              var action;
              if (!isMeta(event)) {
                return true;
              }
              action = $rootScope.keybindings[event.which];
              if (action) {
                event.preventDefault();
                $rootScope.$broadcast("meta-used");
                action();
                return false;
              }
              return true;
            });
          }
        };
      }
    ]).directive('hotkey', [
      "$rootScope", "$parse", "$location", function($rootScope, $parse, $location) {
        return {
          restrict: 'A',
          link: function(scope, element, attrs) {
            var action, clearHint, hideHint, hint, key, mapping, showHint, timeout;
            $rootScope.keybindings = $rootScope.keybindings || {};
            action = void 0;
            if (attrs['ngClick']) {
              action = _.bind($parse(attrs['ngClick']), this, scope, {});
            } else if (element.is("a") && !!attrs["href"]) {
              action = function() {
                $location.path(attrs["href"].replace(/^#/, ""));
                scope.$apply();
                return console.log(attrs["href"]);
              };
            } else {
              return;
            }
            mapping = {
              "enter": 13
            };
            key = mapping[attrs['hotkey']] || attrs['hotkey'].charCodeAt(0);
            $rootScope.keybindings[key & ~(64 | 32)] = action;
            timeout = void 0;
            hint = $("<div class='hotkey-overlay'></div>");
            showHint = function() {
              var el;
              el = element;
              hint.css("top", el.position().top).css("left", el.position().left).css("position", "absolute").width(el.outerWidth()).height(el.outerHeight()).css("line-height", el.outerHeight() + "px").text(attrs['hotkey']);
              hint.insertAfter(element);
              return element.css('opacity', 0.2);
            };
            hideHint = function() {
              element.css('opacity', '');
              return hint.remove();
            };
            clearHint = function() {
              if (timeout) {
                window.clearTimeout(timeout);
              }
              return hideHint();
            };
            scope.$on("meta-down", function() {
              return timeout = window.setTimeout(showHint, 500);
            });
            scope.$on("meta-up", clearHint);
            scope.$on("meta-used", clearHint);
            return scope.$on("$destroy", function() {
              if ($rootScope.keybindings[key & ~(64 | 32)] === action) {
                return $rootScope.keybindings[key & ~(64 | 32)] = void 0;
              }
            });
          }
        };
      }
    ]);
  });

}).call(this);
