'use strict';

module.exports.handler = function(event, context) {
  var response = {};
  if (response) response.foo = 'bar';

  context.done(null, response);
};
