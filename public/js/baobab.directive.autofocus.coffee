define(["angular"], (angular) ->

  angular.module('baobab.directive.autofocus', [])

  .directive('autofocus', ['$timeout', ($timeout) ->
    (scope, elem, attr) ->
      findTargetWithin = (elem) ->
        focusable = $(elem).find("input, textarea")
        targets = focusable.filter (i, input) ->
          model = angular.element(input).attr("ng-model")
          return _.isEmpty(scope.$eval(model))

        if _.isEmpty(targets)
          focusable.last()
        else
          targets.first()

      performFocus = (target) ->
        animatingParent = target.closest('.ng-animate')
        if animatingParent.length
          animatingParent.on('transitionend webkitTransitionEnd', () ->
            $timeout(_.bind(target.focus, target),1)
          );
        else
          $timeout(_.bind(target.focus, target),1)

      scope.$on(attr.autofocus, (e) ->
        $timeout(() ->
          target = findTargetWithin(elem)
          performFocus(target)
        )
      )
  ])
)
