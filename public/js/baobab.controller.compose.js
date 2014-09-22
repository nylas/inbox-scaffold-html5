"use strict";

define(["angular", "underscore"], function(angular, _) {
  angular.module("baobab.controller.compose", [])
  .controller('ComposeCtrl', ['$scope', '$me', function($scope, $me) {
    var self = this;

    self.reply = false;
    clearDraft();

    this.completionOptions = {
      complete: function(search) {
        if (_.isEmpty(search)) {
          return [];
        }
        return $me.contacts().filter(function (contact) {
          return (
            contact.email.toLowerCase().indexOf(search.toLowerCase()) === 0 ||
            !_.isEmpty(contact.name) && contact.name.toLowerCase().indexOf(search.toLowerCase()) === 0
          );
        });
      },
      parse: function(text) {
        var candidates = $me.contacts().filter(function (contact) {
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
      $me.namespacePromise.then(function ($namespace) {
        self.reply = false;
        self.draft = $namespace.draft();
        self.draft.to = []; // Gross
        $scope.$emit("compose-active");
      });
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
      self.draft = draft;
      self.reply = _.isString(draft.thread);
      $scope.$emit("compose-replying");
      $scope.$emit("compose-active");
    });
  }]);
});
