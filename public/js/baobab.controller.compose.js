"use strict";

define(["angular", "underscore"], function(angular, _) {
  angular.module("baobab.controller.compose", [])
  .controller('ComposeCtrl', ['$scope', '$auth', '$namespaces', '$contacts', function($scope, $auth, $namespaces, $contacts) {
    var self = this;

    self.reply = false;
    var setAttachments = function () {}; // noop, we set this later
    clearDraft();

    this.completionOptions = {
      complete: function(search) {
        if (_.isEmpty(search)) {
          return [];
        }
        return $contacts.list().filter(function (contact) {
          return (
            contact.email.toLowerCase().indexOf(search.toLowerCase()) === 0 ||
            !_.isEmpty(contact.name) && contact.name.toLowerCase().indexOf(search.toLowerCase()) === 0
          );
        });
      },
      parse: function(text) {
        var candidates = $contacts.list().filter(function (contact) {
          return contact.email.toLowerCase() == text.toLowerCase();
        });
        if (candidates.length == 1) {
          return candidates[0];
        } else {
          return {
            email: text
          };
        }
      }
    };

    function clearDraft() {
      $scope.$emit("compose-cleared");
      self.reply = false;
      $scope.cc = false;
      setDraft($namespaces.current().draft());
    }

    function setDraft(draft) {
      setAttachments(draft.attachments())
      self.draft = draft
      self.draft.to = self.draft.to || []; // Gross
      self.draft.cc = self.draft.cc || [];
      self.draft.bcc = self.draft.bcc || [];
      self.draft.fileData = self.draft.fileData || [];
      if (!_.isEmpty(self.draft.cc) || !_.isEmpty(self.draft.bcc)) {
        $scope.cc = true;
      }
      $scope.$emit("compose-active");
    }

    this.discardClicked = function () {
      self.draft.dispose().then(function () {
        $scope.$emit("compose-discard");
        clearDraft();
      });
    };

    this.sendClicked = function () {
      self.draft.save().then(function () {
        $scope.$emit("compose-saved");
        self.draft.send().then(function () {
          $scope.$emit("compose-sent");
          clearDraft();
        });
      });
    };

    this.leaveClicked = function () {
      self.draft.save().then(function() {
        $scope.$emit("compose-saved");
        $scope.$emit("compose-cleared");
        self.draft = null;
      });
    };

    $scope.$on("compose-set-draft", function (event, draft) {
      setDraft(draft);
      self.reply = _.isString(draft.thread);
      $scope.$emit("compose-replying");
    });

    $scope.$on("$destroy", function () {
      if (_.isEmpty(self.draft.to) && _.isEmpty(self.draft.from) && _.isEmpty(self.draft.cc) && _.isEmpty(self.draft.bcc)
          && _.isEmpty(self.draft.subject) && _.isEmpty(self.draft.body)) {
        return
      }
      console.log("Saving...");
      self.draft.save().then(function () { console.log("Saved.")})
    });

    self.dropzoneConfig = {
      options: {
        'url': $namespaces.current().resourceUrl() + '/files',
        'autoProcessQueue': true,
        'headers': {
          'Authorization': 'Basic '+btoa($auth.token+':')
        },
        'addRemoveLinks': true,
        'previewsContainer': '.dropzone-previews'
      },
      eventHandlers: {
        success: function (file, response, e) {
          self.draft.addAttachment(response[0]);
        },
        removedfile: function (file) {
          self.draft.removeAttachment(file);
        },
      },
      dropzoneReady: function (dropzone) {
        setAttachments = function (newFiles) {
          dropzone.removeAllFiles(true);
          _.forEach(newFiles, function (file) {
            file.name = file.filename;
            dropzone.putFile(file);
          });
        };
      },
    };

  }]);
});
