define ['angular', 'dropzone', 'underscore'], (angular, Dropzone, _) ->
  Dropzone.autoDiscover = false

  DropzoneException = (message) -> @message = message
  DropzoneException.prototype = Error
  ensureDefined = (value, msg) ->
    throw new DropzoneException msg if value == undefined

  Dropzone.prototype.putFile = (file) ->
    file.upload =
      progress: 100
      total: file.size
      bytesSent: file.size
    file.status = Dropzone.SUCCESS
    @files.push file
    @emit "addedfile", file

  angular.module 'baobab.directive.dropzone', []
  .directive 'dropzone', () ->
    link: (scope, elem, attr) ->
      ensureDefined attr.dropzone, 'No Dropzone config'

      scope.$watch attr.dropzone, (config) ->
        return if !config

        ensureDefined config.options, 'No dropzone options'
        ensureDefined config.eventHandlers, 'No dropzone handlers'

        elem.addClass('dropzone')
        dropzone = new Dropzone(elem[0], config.options)

        angular.forEach config.eventHandlers, (handler, event) ->
          dropzone.on event, handler

        if config.dropzoneReady
          config.dropzoneReady(dropzone)
