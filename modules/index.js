'use strict';

var createProxy = require('react-proxy').createProxy;
var getForceUpdate = require('react-proxy').getForceUpdate;

/**
 * Returns a function that will patch React class with new versions of itself
 * on subsequent invocations. Both legacy and ES6 style classes are supported.
 */
function makePatchReactClass(React) {
  var forceUpdate = getForceUpdate(React);
  var proxy;

  return function patchReactClass(NextClass) {
    if (!proxy) {
      proxy = createProxy(NextClass);
    } else {
      var mountedInstances = proxy.update(NextClass);
      if (mountedInstances.length > 0) {
        setTimeout(function () {
          mountedInstances.forEach(forceUpdate);
        });
      }
    }

    return proxy.get();
  };
};

/**
 * Returns a function that, when invoked, patches a React class with a new
 * version of itself. To patch different classes, pass different IDs.
 */
module.exports = function makeMakeHot(React) {
  if (arguments.length === 2) {
    // Support legacy signature
    React = arguments[1];
  }

  if (typeof React !== 'object' || typeof React.Component !== 'function') {
    throw new Error('React is now the single required argument, and React Hot API now requires React 0.13+.');
  }

  var patchers = {};

  return function makeHot(NextClass, persistentId) {
    persistentId = persistentId || NextClass.displayName || NextClass.name;

    if (!persistentId) {
      console.error(
        'Hot reload is disabled for one of your types. To enable it, pass a ' +
        'string uniquely identifying this class within this current module ' +
        'as a second parameter to makeHot.'
      );
      return NextClass;
    }

    if (!patchers[persistentId]) {
      patchers[persistentId] = makePatchReactClass(React);
    }

    var patchReactClass = patchers[persistentId];
    return patchReactClass(NextClass);
  };
};