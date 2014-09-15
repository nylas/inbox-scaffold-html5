"use strict";
var _handleAPIError, saveAs; //globals

define(["angular", "underscore"], function (angular, _) {
  return angular.module("baobab.controller.thread", [])
  .controller('ThreadCtrl', ['$scope', '$namespace', '$threads', '$modal', '$routeParams', '$location', '$scrollState', '$me', function($scope, $namespace, $threads, $modal, $routeParams, $location, $scrollState, $me) {
    var self = this;

    this.thread = $threads.item($routeParams['id']);
    this.messages = null;
    this.drafts = null;
    $scope.replying = false;

    this.currentAttachment = null;
    this.currentAttachmentDataURL = null;

    // internal methods

    if (this.thread) {
      threadReady();
    } else {
      $namespace.thread($routeParams['id']).then(function(thread) {
        self.thread = thread;
        threadReady();
      }, _handleAPIError);
    }


    function threadReady() {
      self.thread.messages().then(function(messages) {
        self.messages = messages.sort(function(a, b) {
          return a.date.getTime() - b.date.getTime(); //oldest -> newest
        });

        // scroll to the first unread message, or the last message
        // if the entire conversation is read.
        var scrollTo = messages[messages.length - 1];
        for (var ii = 0; ii < messages.length; ii++) {
          if (messages[ii].unread) {
            scrollTo = messages[ii];
            break;
          }
        }
      if (scrollTo != undefined)
        $scrollState.scrollTo('msg-' + scrollTo.id);

        // mark the thread as read
        if (self.thread.hasTag('unread')) {
          self.thread.removeTags(['unread']).then(function(response) {
            for (var ii = 0; ii < messages.length; ii++) {
              messages[ii].unread = false;
            }
          }, _handleAPIError);
        }

      }, _handleAPIError);

      self.thread.drafts().then(function(drafts) {
        self.drafts = drafts.sort(function(a, b) {
          return a.date.getTime() - b.date.getTime(); // oldest-newest
        });

      }, _handleAPIError);
    }

    // exposed methods

    this.viewAttachment = function(msg, id) {
      self.currentAttachmentLoading = true;
      msg.attachment(id).download().then(function(blob) {
        self.currentAttachment = blob;
        if (blob.type.indexOf('image/') != -1) {
          var fileReader = new FileReader();
          fileReader.onload = function() {
            self.currentAttachmentDataURL = this.result;
            self.currentAttachmentLoading = false;
            if (!$scope.$$phase) $scope.$apply();
          };
          fileReader.readAsDataURL(blob);
        } else {
          self.currentAttachmentLoading = false;
          self.downloadCurrentAttachment();
        }
      });
    };

  this.hideAttachment = function() {
    self.currentAttachmentDataURL = null;
    self.currentAttachment = null;
  };

    this.downloadCurrentAttachment = function() {
      saveAs(self.currentAttachment, self.currentAttachment.fileName);
    };

    this.replyClicked = function() {
      if (!$scope.replying) {
        var draft = self.draft = self.thread.reply();
        var me = $me.emailAddress();
        var participants = _.reject(self.thread.participants, function (p) {
          return p.email == me;
        });
        if (_.isEmpty(participants)) {
          participants = self.thread.participants; // Self-emails are people too
        }
        draft.addRecipients(participants);
        $scope.$broadcast("compose-set-draft", draft);
      } else if (_.isEmpty(self.draft.body)) { // We know self.draft is set by now
        $scope.replying = false;
      }
    };

    this.draftClicked = function (msg) {
      self.draft = msg;
      $scope.$broadcast("compose-set-draft", msg);
    };

    this.archiveClicked = function() {
      self.thread.removeTags(['inbox']).then(function(response) {
        $threads.itemArchived(self.thread.id);
        $location.path('/inbox');
      }, _handleAPIError);
    };

    $scope.$on("compose-replying", function (event) {
      $scope.replying = true;
    });

    $scope.$on("compose-cleared", function (event) {
      self.draft = null;
      $scope.replying = false;
    });

  }]);
});
