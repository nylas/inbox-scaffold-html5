(function() {
  define(["angular", "underscore", "error", "FileSaver"], function(angular, _, error, saveAs) {
    return angular.module("baobab.controller.thread", []).controller('ThreadCtrl', [
      '$scope', '$namespaces', '$threads', '$modal', '$routeParams', '$location', '$scrollState', function($scope, $namespaces, $threads, $modal, $routeParams, $location, $scrollState) {
        var dragging, resizeReply, threadReady;
        this.thread = $threads.item($routeParams['id']);
        this.messages = null;
        this.drafts = null;
        $scope.replying = false;
        this.currentAttachment = null;
        this.currentAttachmentDataURL = null;
        threadReady = (function(_this) {
          return function() {
            _this.thread.messages().then(function(messages) {
              var scrollTo;
              _this.messages = messages.sort(function(a, b) {
                return a.date.getTime() - b.date.getTime();
              });
              scrollTo = messages[messages.length - 1];
              messages.every(function(message) {
                if (message.unread) {
                  scrollTo = message;
                  return false;
                }
                return true;
              });
              messages.every(function(message) {
                return message.attachmentData = message.attachments();
              });
              if (scrollTo !== void 0) {
                $scrollState.scrollTo('msg-' + scrollTo.id);
                if (_this.thread.hasTag('unread')) {
                  return _this.thread.removeTags(['unread']).then(function(response) {
                    return messages.forEach(function(message) {
                      return message.unread = false;
                    });
                  }, error._handleAPIError);
                }
              }
            }, error._handleAPIError);
            return _this.thread.drafts().then(function(drafts) {
              return _this.drafts = drafts.sort(function(a, b) {
                return a.date.getTime() - b.date.getTime();
              });
            }, error._handleAPIError);
          };
        })(this);
        $scope.$on("compose-replying", (function(_this) {
          return function(event) {
            return $scope.replying = true;
          };
        })(this));
        $scope.$on("compose-cleared", (function(_this) {
          return function(event) {
            _this.draft = null;
            return $scope.replying = false;
          };
        })(this));
        this.viewAttachment = (function(_this) {
          return function(msg, id) {
            _this.currentAttachmentLoading = true;
            return msg.attachment(id).download().then(function(blob) {
              var fileReader;
              _this.currentAttachment = blob;
              if (blob.type.indexOf('image/') !== -1) {
                fileReader = new FileReader();
                fileReader.onload = function() {
                  _this.currentAttachmentDataURL = fileReader.result;
                  _this.currentAttachmentLoading = false;
                  if (!$scope.$$phase) {
                    return $scope.$apply();
                  }
                };
                return fileReader.readAsDataURL(blob);
              } else {
                _this.currentAttachmentLoading = false;
                return _this.downloadCurrentAttachment();
              }
            });
          };
        })(this);
        this.hideAttachment = (function(_this) {
          return function() {
            _this.currentAttachmentDataURL = null;
            return _this.currentAttachment = null;
          };
        })(this);
        this.downloadCurrentAttachment = (function(_this) {
          return function() {
            return saveAs(_this.currentAttachment, _this.currentAttachment.fileName);
          };
        })(this);
        this.replyClicked = (function(_this) {
          return function(replyAll) {
            var draft, lastMessage, me;
            if ($scope.replying) {
              return;
            }
            draft = _this.draft = _this.thread.reply();
            me = $namespaces.current().emailAddress;
            lastMessage = _this.messages[_this.messages.length - 1];
            draft.to = lastMessage.from;
            if (replyAll) {
              draft.cc = _.union(lastMessage.to, lastMessage.cc);
              draft.cc = _.reject(draft.cc, function(p) {
                return p.email === me;
              });
            }
            return $scope.$broadcast("compose-set-draft", draft);
          };
        })(this);
        this.draftClicked = (function(_this) {
          return function(msg) {
            _this.draft = msg;
            return $scope.$broadcast("compose-set-draft", msg);
          };
        })(this);
        this.archiveClicked = (function(_this) {
          return function() {
            return _this.thread.removeTags(['inbox']).then(function(response) {
              $threads.itemArchived(_this.thread.id);
              return $location.path('/inbox');
            }, error._handleAPIError);
          };
        })(this);
        dragging = false;
        resizeReply = function(event) {
          var height;
          if (event.which !== 1 || !dragging) {
            dragging = false;
            return;
          }
          height = angular.element(window).height() - event.clientY + "px";
          angular.element(".thread-container.replying").css("padding-bottom", height);
          angular.element(".composer-reply").css("height", height);
          return event.preventDefault();
        };
        angular.element("#content").on("mouseup", function() {
          return dragging = false;
        }).on("mousemove", _.throttle(resizeReply, 1000 / 60, true));
        angular.element("[resizebar]").on("mousedown", function(event) {
          if (event.which !== 1) {
            return;
          }
          dragging = true;
          return event.preventDefault();
        });
        if (this.thread) {
          threadReady();
        } else {
          $namespaces.current().thread($routeParams['id']).then((function(_this) {
            return function(thread) {
              _this.thread = thread;
              return threadReady();
            };
          })(this), error._handleAPIError);
        }
        return this;
      }
    ]);
  });

}).call(this);
