(function() {
  define(['angular', 'dropzone', 'underscore'], function(angular, Dropzone, _) {
    var DropzoneException, ensureDefined;
    Dropzone.autoDiscover = false;
    DropzoneException = function(message) {
      return this.message = message;
    };
    DropzoneException.prototype = Error;
    ensureDefined = function(value, msg) {
      if (value === void 0) {
        throw new DropzoneException(msg);
      }
    };
    Dropzone.prototype.putFile = function(file) {
      file.upload = {
        progress: 100,
        total: file.size,
        bytesSent: file.size
      };
      file.status = Dropzone.SUCCESS;
      this.files.push(file);
      return this.emit("addedfile", file);
    };
    return angular.module('baobab.directive.dropzone', []).directive('dropzone', function() {
      return {
        link: function(scope, elem, attr) {
          ensureDefined(attr.dropzone, 'No Dropzone config');
          return scope.$watch(attr.dropzone, function(config) {
            var dropzone;
            if (!config) {
              return;
            }
            ensureDefined(config.options, 'No dropzone options');
            ensureDefined(config.eventHandlers, 'No dropzone handlers');
            elem.addClass('dropzone');
            dropzone = new Dropzone(elem[0], config.options);
            angular.forEach(config.eventHandlers, function(handler, event) {
              return dropzone.on(event, handler);
            });
            if (config.dropzoneReady) {
              return config.dropzoneReady(dropzone);
            }
          });
        }
      };
    });
  });

}).call(this);
