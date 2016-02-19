'use strict';

module.exports.handler = function(event, context) {
  const response = {}; // Invalid ES5 syntax
  context.done(null, response);
};
