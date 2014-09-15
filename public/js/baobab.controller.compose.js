"use strict";

define(["angular", "underscore"], function(angular, _) {
  angular.module("baobab.controller.compose", [])
  .controller('ComposeCtrl', ['$scope', '$me', function($scope, $me) {
    var self = this;

    self.reply = false;
    clearDraft();

    function clearDraft() {
      $scope.$emit("compose-cleared");
      $me.namespacePromise.then(function ($namespace) {
        self.reply = false;
        self.draft = $namespace.draft();
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
