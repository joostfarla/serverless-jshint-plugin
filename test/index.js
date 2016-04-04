'use strict';

const path = require('path'),
  chai = require('chai'),
  should = chai.should(),
  chaiAsPromised = require('chai-as-promised'),
  Serverless = require('serverless');

chai.use(chaiAsPromised);

let s, plugin, logs, JSHintPlugin;

const logger = function(log) {
  logs.push(log);
};

describe('ServerlessJSHint', function() {
  beforeEach(function(done) {
    this.timeout(0);

    s = new Serverless();
    logs = [];

    s.init().then(function() {
      JSHintPlugin = require('..')(s);
      plugin = new JSHintPlugin({ logger: logger });

      s.addPlugin(plugin);
      s.config.projectPath = path.join(__dirname, 'test-prj');
      s.setProject(new s.classes.Project({
        stages: {
          dev: { regions: { 'eu-west-1': {} }}
        },
        variables: {
          project: 'serverless-project',
          stage: 'dev',
          region: 'eu-west-1'
        }
      }));

      done();
    });
  });

  describe('#getName()', function() {
    it('should return the correct name', function() {
      JSHintPlugin.getName().should.equal('com.joostfarla.ServerlessJSHint');
    });
  });

  describe('#registerActions()', function() {
    it('should register actions', function() {
      s.actions.should.have.property('functionJSHint');
      s.actions.functionJSHint.should.be.a('function');
    });
  });

  // different function lookup methods
  describe('#_validateAndPrepare', function() {
    beforeEach(function() {
      s.cli = true;
      _bootstrapFunction('validNodeFunction', 'nodejs');
      _bootstrapFunction('otherValidNodeFunction', 'nodejs');
      _bootstrapFunction('validPythonFunction', 'python2.7');

      var me = this;
      process.cwd = function() {
        return me.tmpCwd || s.config.projectPath;
      };
    });

    afterEach(function() {
      this.tmpCwd = null;
    });

    it('should do all functions with --all flag', function() {
      return plugin._validateAndPrepare([],{all: true}).should.be.fulfilled.then(function(funcs) {
        funcs.should.lengthOf(2);
      });
    });

    it('should do function in working dir', function() {
      this.tmpCwd = `${s.config.projectPath}/otherValidNodeFunction`;
      return plugin._validateAndPrepare([],{}).should.be.fulfilled.then(function(funcs) {
        funcs.should.lengthOf(1);
        funcs[0].getName().should.equal('otherValidNodeFunction');
      });
    });

    it('should do all functions if no function in working dir', function() {
      return plugin._validateAndPrepare([],{}).should.be.fulfilled.then(function(funcs) {
        funcs.should.lengthOf(2);
      });
    });

    it('should do function with provided name', function() {
      return plugin._validateAndPrepare(['validNodeFunction'],{}).should.be.fulfilled.then(function(funcs) {
        funcs.should.lengthOf(1);
        funcs[0].getName().should.equal('validNodeFunction');
      });
    });
  });

  describe('#functionJSHint()', function() {
    it('should fail for non-existing functions', function() {
      return plugin.functionJSHint({ options: { names: ['someFunction'] }}).should.be.rejected.then(function() {
        logs.should.be.empty;
      });
    });

    it('should error when no functions to lint', function() {
      return plugin.functionJSHint({ options: { names: [] }}).should.be.rejected;
    });

    it('should succeed for all functions', function() {
      _bootstrapFunction('validNodeFunction', 'nodejs');

      return plugin.functionJSHint({ options: { names: [], all: true }}).should.be.fulfilled.then(function() {
        logs[0].should.contain('Success!');
      });
    });

    it('should report errors for invalid functions', function() {
      _bootstrapFunction('invalidNodeFunction', 'nodejs');

      return plugin.functionJSHint({ options: { names: ['invalidNodeFunction'] }}).should.be.fulfilled.then(function() {
        logs[0].should.contain('Error!');
      });
    });

    it('should apply a custom configuration file', function() {
      s.config.projectPath = path.join(__dirname, 'test-prj-2');
      _bootstrapFunction('curlyFunction', 'nodejs');

      return plugin.functionJSHint({ options: { names: ['curlyFunction'] }}).should.be.fulfilled.then(function() {
        logs[0].should.contain('Error!');
      });
    });

    it('should fail on non-Node components', function() {
      _bootstrapFunction('pythonFunction', 'python2.7');

      return plugin.functionJSHint({ options: { names: ['pythonFunction'] }}).should.be.rejected;
    });
  });
});

function _bootstrapFunction(name, runtime) {
  const func = new s.classes.Function({
    name: name,
    runtime: runtime
  }, path.join(s.config.projectPath, name, 's-function.json'));

  s.getProject().setFunction(func);

  return func;
}
