'use strict';

/**
 * Serverless CORS Plugin
 */
module.exports = function(S) {
  const _ = require('lodash'),
    path = require('path'),
    Promise = require('bluebird'),
    SCli = require(S.getServerlessPath('utils/cli')),
    SError = require(S.getServerlessPath('Error')),
    chalk = require('chalk'),
    jshint = require('jshint').JSHINT,
    readFile = Promise.promisify(require('fs').readFile),
    util = require('util');

  class ServerlessJSHint extends S.classes.Plugin {
    constructor(config) {
      super();
      if (!config) config = {};
      this.log = config.logger || SCli.log;
    }

    static getName() {
      return 'com.joostfarla.' + ServerlessJSHint.name;
    }

    registerActions() {
      S.addAction(this.functionJSHint.bind(this), {
        handler: 'functionJSHint',
        description: 'Detects errors and potential problems in your Lambda function',
        context: 'function',
        contextAction: 'jshint',
        options: [
          {
            option: 'all',
            shortcut: 'a',
            description: 'Optional - Deploy all Functions'
          }
        ],
        parameters: [
          {
            parameter: 'names',
            description: 'One or multiple function names',
            position: '0->'
          }
        ]
      });

      return Promise.resolve();
    }

    functionJSHint(evt) {
      return this._validateAndPrepare(evt.options.names,evt.options)
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

    _getFuncs(names, options) {
      // user passed the --all option
      if (options.all) {
        return S.getProject().getAllFunctions().filter(function(func) {
          return func.runtime === 'nodejs';
        });
      }

      // no names or options so use cwd behavior
      // will return all functions if none in cwd
      if (S.cli && names.length === 0) {
        return S.utils.getFunctionsByCwd(S.getProject().getAllFunctions()).filter(function(func) {
          return func.runtime === 'nodejs';
        });
      }

      // return by passed name(s)
      return _.map(names, name => {
        const func = S.getProject().getFunction(name);
        if (!func) throw new SError(`Function ${name} does not exist in your project`);
        if (func.runtime !== 'nodejs') throw new SError(`JSHint doesn't support runtimes other than "nodejs".`);
        return func;
      });
    }

    _validateAndPrepare(names, options) {
      try {
        const funcs = this._getFuncs(names, options);
        if (funcs.length == 0) throw new SError("No nodejs functions found by jshint");
        return Promise.resolve(funcs);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    _lint(functions) {
      return Promise.each(functions, func => {
        const file = func.getRootPath(func.handler.split('/').pop().split('.')[0] + '.js');

        return this._getConfig()
          .then(config => {
            return readFile(file, 'utf-8')
              .then(data => {
                jshint(data, _.merge({
                  node: true
                }, config));

                if (jshint.errors.length > 0) {
                  return Promise.reject(jshint.errors);
                }

                return Promise.resolve();
              });
          });
      });
    }

    _getConfig() {
      return readFile(S.getProject().getRootPath('.jshintrc'), 'utf-8')
        .then(config => {
          return JSON.parse(config);
        })
        .catch(err => {
          return {};
        });
    }
  }

  return ServerlessJSHint;
};
