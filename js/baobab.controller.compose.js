(function() {
  define(["angular", "underscore"], function(angular, _) {
    angular.module("baobab.controller.compose", []).controller('ComposeCtrl', function($scope, $auth, $namespaces, $contacts, $routeParams, $location, $timeout) {
      var clearDraft, self, setAttachments, setDraft;
      self = this;
      clearDraft = function() {
        $scope.$emit("compose-cleared");
        self.reply = false;
        $scope.cc = false;
        if ($routeParams.draft_id) {
          $location.path("/mail/compose");
        }
        setDraft($namespaces.current().draft());
      };
      setDraft = function(draft) {
        setAttachments(draft.attachments());
        self.draft = draft;
        self.draft.to = self.draft.to || [];
        self.draft.cc = self.draft.cc || [];
        self.draft.bcc = self.draft.bcc || [];
        self.draft.fileData = self.draft.fileData || [];
        if (!_.isEmpty(self.draft.cc) || !_.isEmpty(self.draft.bcc)) {
          $scope.cc = true;
        }
        $scope.$emit("compose-active");
      };
      setAttachments = function() {};
      if (_.isEmpty($routeParams.draft_id)) {
        clearDraft();
      } else {
        $namespaces.current().draft($routeParams.draft_id).then(function(draft) {
          return setDraft(draft);
        });
      }
      this.alert = function(message) {
        $scope.message = message;
        angular.element("#message-box").show();
        return $timeout((function() {
          return $scope.$apply(function() {
            $scope.message = void 0;
            return angular.element("#message-box").hide();
          });
        }), 2000);
      };
      this.completionOptions = {
        complete: function(search) {
          if (_.isEmpty(search)) {
            return [];
          }
          return $contacts.list().filter(function(contact) {
            return !_.isEmpty(contact.email) && (contact.email.toLowerCase().indexOf(search.toLowerCase()) === 0 || !_.isEmpty(contact.name) && contact.name.toLowerCase().indexOf(search.toLowerCase()) === 0);
          });
        },
        parse: function(text) {
          var candidates;
          candidates = $contacts.list().filter(function(contact) {
            return !_.isEmpty(contact.email) && contact.email.toLowerCase() === text.toLowerCase();
          });
          if (candidates.length === 1) {
            return candidates[0];
          } else {
            return {
              email: text
            };
          }
        }
      };
      this.discardClicked = function() {
        return self.draft.dispose().then(function() {
          $scope.$emit("compose-discard");
          clearDraft();
        });
      };
      this.sendClicked = function() {
        return self.draft.save().then(function(draft) {
          $scope.$emit("compose-saved");
          self.draft = draft;
          return draft.send().then(function() {
            $scope.$emit("compose-sent");
            clearDraft();
          });
        });
      };
      this.leaveClicked = function() {
        return self.draft.save().then(function() {
          $scope.$emit("compose-saved");
          $scope.$emit("compose-cleared");
          self.draft = null;
        });
      };
      $scope.$on("compose-set-draft", function(event, draft) {
        setDraft(draft);
        self.reply = _.isString(draft.thread);
        $scope.$emit("compose-replying");
      });
      $scope.$on("compose-sent", (function(_this) {
        return function() {
          return _this.alert("Sent");
        };
      })(this));
      $scope.$on("compose-saved", (function(_this) {
        return function() {
          return _this.alert("Saved");
        };
      })(this));
      $scope.$on("$destroy", function() {
        if (_.isEmpty(self.draft.to) && _.isEmpty(self.draft.from) && _.isEmpty(self.draft.cc) && _.isEmpty(self.draft.bcc) && _.isEmpty(self.draft.subject) && _.isEmpty(self.draft.body)) {
          return;
        }
        console.log("Saving...");
        self.draft.save().then(function() {
          return console.log("Saved.");
        });
      });
      this.dropzoneConfig = {
        options: {
          'url': $namespaces.current().resourceUrl() + '/files',
          'autoProcessQueue': true,
          'headers': {
            'Authorization': 'Basic ' + btoa($auth.token + ':')
          },
          'addRemoveLinks': true,
          'previewsContainer': '.dropzone-previews',
          'createImageThumbnails': false,
          'dictFallbackText': null,
          'dictRemoveFile': '✘',
          'previewTemplate': "<div class=\"dz-preview dz-file-preview\">\n  <a class=\"attachment\">\n    <div class=\"pull-left file-type-icon\"><span class=\"corner\"></span><span class=\"type\"></span></div>\n    <div class=\"pull-left file-name dz-filename\"><span data-dz-name></span></div>\n  </a>\n  <div class=\"dz-progress\"><span class=\"dz-upload\" data-dz-uploadprogress=\"\"></span></div>\n</div>"
        },
        eventHandlers: {
          success: function(file, response, e) {
            return self.draft.addAttachment(response[0]);
          },
          removedfile: function(file) {
            return self.draft.removeAttachment(file);
          }
        },
        dropzoneReady: function(dropzone) {
          return setAttachments = function(newFiles) {
            dropzone.removeAllFiles(true);
            return _.forEach(newFiles, function(file) {
              file.name = file.filename;
              return dropzone.putFile(file);
            });
          };
        }
      };
    });
  });

}).call(this);
