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
      setDraft($namespaces.current().draft());
    }

    function setDraft(draft) {
      setAttachments(draft.attachments())
      self.draft = draft
      self.draft.to = self.draft.to || []; // Gross
      self.draft.fileData = self.draft.fileData || [];
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
            dropzone.putFile(file);
          });
        };
      },
    };

  }]);
});
