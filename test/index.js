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

  describe('#functionJSHint()', function() {
    it('should fail for non-existing functions', function() {
      return plugin.functionJSHint({ options: { names: ['someFunction'] }}).should.be.rejected.then(function() {
        logs.should.be.empty;
      });
    });

    it('should succeed for valid functions', function() {
      _bootstrapFunction('validNodeFunction', 'nodejs');

      return plugin.functionJSHint({ options: { names: ['validNodeFunction'] }}).should.be.fulfilled.then(function() {
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
