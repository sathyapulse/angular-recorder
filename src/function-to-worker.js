/**
 * This script adds a new function to a function prototype,
 * which allows a function to be converted to a web worker.
 *
 * Please note that this method copies the function's source code into a Blob, so references to variables
 * outside the function's own scope will be invalid.
 *
 * You can however pass variables that can be serialized into JSON, to this function using the params parameter
 *
 * @usage
 * ```
 * myFunction.toWorker({param1: p1, param2: p2...})
 *```
 *
 */
(function () {
  'use strict';


  var workerToBlobUrl = function (fn, params) {
    if (typeof fn !== 'function') {
      throw("The specified parameter must be a valid function");
    }
    var fnString = fn.toString();
    if (fnString.match(/\[native\s*code\]/i)) {
      throw("You cannot bind a native function to a worker");
    }
    ;

    params = params || {};
    if (typeof params !== 'object') {
      console.warn('Params must be an object that is serializable with JSON.stringify, specified is: ' + (typeof params));
    }

    var blobURL = window.URL.createObjectURL(new Blob(['(', fnString, ')(this,', JSON.stringify(params), ')'], {type: 'application/javascript'}));

    return blobURL;
  };

  Function.prototype.toWorker = function (params) {
    var url = workerToBlobUrl(this, params);
    return new Worker(url);
  };
})();