'use strict';

module.exports.handler = function(event, context) {
  var response = {};
  if (response) response.foo = 'bar'; // Not so curly here!

  context.done(null, response);
};
