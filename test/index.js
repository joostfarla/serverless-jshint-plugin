'use strict';

const path = require('path'),
  chai = require('chai'),
  should = chai.should(),
  chaiAsPromised = require('chai-as-promised'),
  SERVERLESS_PATH = path.join(process.cwd(), 'node_modules', 'serverless', 'lib'),
  Serverless = require('serverless'),
  utils = require(path.join(SERVERLESS_PATH, 'utils'));

chai.use(chaiAsPromised);

const JSHintPlugin = require('..')(
  require(path.join(SERVERLESS_PATH, 'ServerlessPlugin')),
  SERVERLESS_PATH
);

let s, plugin, logs;

const logger = function(log) {
  logs.push(log);
};

describe('ServerlessJSHint', function() {
  before(function() {
    this.timeout(0);
    s = new Serverless();
    plugin = new JSHintPlugin(s, { logger: logger });
    s.addPlugin(plugin);
  });

  beforeEach(function() {
    logs = [];
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
      return plugin.functionJSHint({ options: { path: 'nodejs/someFunction' }}).should.be.rejected.then(function() {
        logs.should.be.empty;
      });
    });

    it('should succeed for valid functions', function() {
      s.config.projectPath = path.join(__dirname, 'test-prj');
      s.state.setAsset(new s.classes.Component(s, { sPath: 'nodejs' }));
      s.state.setAsset(new s.classes.Function(s, { sPath: 'nodejs/validFunction' }));

      return plugin.functionJSHint({ options: { path: 'nodejs/validFunction' }}).should.be.fulfilled.then(function() {
        logs[0].should.contain('Success!');
      });
    });

    it('should report errors for invalid functions', function() {
      s.config.projectPath = path.join(__dirname, 'test-prj');
      s.state.setAsset(new s.classes.Component(s, { sPath: 'nodejs' }));
      s.state.setAsset(new s.classes.Function(s, { sPath: 'nodejs/invalidFunction' }));

      return plugin.functionJSHint({ options: { path: 'nodejs/invalidFunction' }}).should.be.fulfilled.then(function() {
        logs[0].should.contain('Error!');
      });
    });

    it('should apply a custom configuration file', function() {
      s.config.projectPath = path.join(__dirname, 'test-prj-2');
      s.state.setAsset(new s.classes.Component(s, { sPath: 'nodejs' }));
      s.state.setAsset(new s.classes.Function(s, { sPath: 'nodejs/curlyFunction' }));

      return plugin.functionJSHint({ options: { path: 'nodejs/curlyFunction' }}).should.be.fulfilled.then(function() {
        logs[0].should.contain('Error!');
      });
    });

    it('should fail on non-Node components', function() {
      let component = new s.classes.Component(s, { sPath: 'python' });
      component.runtime = 'python2.7';

      s.state.setAsset(component);
      s.state.setAsset(new s.classes.Function(s, { sPath: 'python/pyFunction' }));

      return plugin.functionJSHint({ options: { path: 'python/pyFunction' }}).should.be.rejected;
    });
  });
});
