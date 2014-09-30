(function() {
  define([], function() {
    var _displayErrors;
    _displayErrors = true;
    window.onbeforeunload = function() {
      _displayErrors = false;
    };
    return this._handleAPIError = function(error) {
      var msg;
      if (!_displayErrors) {
        return;
      }
      msg = "An unexpected error occurred. (HTTP code " + error['status'] + "). Please try again.";
      if (error['message']) {
        msg = error['message'];
      }
      return alert(msg);
    };
  });

}).call(this);
