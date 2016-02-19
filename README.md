# Serverless JSHint Plugin

A Serverless Plugin for the [Serverless Framework](http://www.serverless.com) which
adds support for [JSHint](http://jshint.com/) linting.

[![npm version](https://badge.fury.io/js/serverless-jshint-plugin.svg)](https://badge.fury.io/js/serverless-jshint-plugin)
[![Build Status](https://travis-ci.org/joostfarla/serverless-jshint-plugin.svg?branch=develop)](https://travis-ci.org/joostfarla/serverless-jshint-plugin)
[![Dependencies Status](https://david-dm.org/joostfarla/serverless-jshint-plugin.svg)](https://david-dm.org/joostfarla/serverless-jshint-plugin)
[![DevDependencies Status](https://david-dm.org/joostfarla/serverless-jshint-plugin/dev-status.svg)](https://david-dm.org/joostfarla/serverless-jshint-plugin#info=devDependencies)

**THIS PLUGIN REQUIRES SERVERLESS V0.4 OR HIGHER!**

## Introduction

This plugins adds capabilities to lint your Lambda functions before deploying.

## Installation

In your project root, run:

```bash
npm install --save serverless-jshint-plugin
```

Add the plugin to `s-project.json`:

```json
"plugins": [
  "serverless-jshint-plugin"
]
```

## Usage

Run the *jshint* action to check a function for errors:

```
serverless function jshint someComponent/someFunction
```

To apply custom configuration, add a `.jshintrc` file in the project root.

## Roadmap

* Improve documentation
* Add parameters to check whole projects and components
* Add hooks to automate linting upon run or deployment

## License

ISC License. See the [LICENSE](LICENSE) file.
