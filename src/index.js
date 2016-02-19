'use strict';

/**
 * Serverless CORS Plugin
 */
module.exports = function(SPlugin, serverlessPath) {
  const path = require('path'),
    Promise = require('bluebird'),
    SCli = require(path.join(serverlessPath, 'utils/cli')),
    SError = require(path.join(serverlessPath, 'ServerlessError')),
    chalk = require('chalk'),
    jshint = require('jshint').JSHINT,
    readFile = Promise.promisify(require('fs').readFile),
    util = require('util');

  class ServerlessJSHint extends SPlugin {
    constructor(S, config) {
      super(S, config);
      if (!config) config = {};
      this.log = config.logger || SCli.log;
    }

    static getName() {
      return 'com.joostfarla.' + ServerlessJSHint.name;
    }

    registerActions() {
      this.S.addAction(this.functionJSHint.bind(this), {
        handler: 'functionJSHint',
        description: 'Detects errors and potential problems in your Lambda function',
        context: 'function',
        contextAction: 'jshint',
        options: [
          {
            option: 'path',
            shortcut: 'p',
            description: 'Path of the function in this format: componentName/functionName'
          }
        ],
        parameters: [
          {
            parameter: 'path',
            description: 'Path of the function you want to run (componentName/functionName)',
            position: '0'
          }
        ]
      });

      return Promise.resolve();
    }

    functionJSHint(evt) {
      return this._validateAndPrepare(evt.options.path)
        .then(func => {
          return this._lint(func)
            .then(() => {
              this.log(chalk.bold.green('Success! - No linting errors found.'));
            })
            .catch(err => {
              this.log(chalk.bold.red('Error! - Linting errors found.'));
              jshint.errors.forEach(err => {
                this.log(chalk.red(util.format('Line %d: %s', err.line, err.reason)));
              });
            });
        });
    }

    _validateAndPrepare(path) {
      let functions = this.S.state.getFunctions({ paths: [path] });

      if (functions.length === 0) {
        return Promise.reject(util.format('No function found with path "%s".', path));
      }

      if (functions[0].getComponent().runtime !== 'nodejs') {
        return Promise.reject('JSHint does not support runtimes other than "nodejs".');
      }

      return Promise.resolve(functions[0]);
    }

    _lint(func) {
      let file = path.join(
        func._config.fullPath,
        func.handler.split('/').pop().split('.')[0] + '.js'
      );

      return readFile(file, 'utf-8')
        .then((data) => {
          jshint(data, {
            node: true
          });

          if (jshint.errors.length > 0) {
            return Promise.reject(jshint.errors);
          }

          return Promise.resolve();
        });
    }
  }

  return ServerlessJSHint;
};
