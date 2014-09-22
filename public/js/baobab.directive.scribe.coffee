define ['angular', 'scribe'], (angular, Scribe) ->
  angular.module 'baobab.directive.scribe', []
  .directive 'scribe', () ->
    require: 'ngModel'
    link: (scope, elem, attr, model) ->
      window.Scribe = Scribe
      scribe = new Scribe(elem[0])

      safeApply = (fn) ->
        if scope.$$phase || scope.$root.$$phase
          fn()
        else
          scope.$apply fn

      model.$render = () ->
        scribe.setContent (model.$viewValue || "")

      model.$isEmpty = (value) ->
        !value || scribe.allowsBlockElements() && value == '<p><br></p>'

      scribe.on "content-changed", () ->
        value = scribe.getContent()
        safeApply () -> model.$setViewValue(value)