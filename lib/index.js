
"use strict";

/**
 * Module dependencies.
 */

var _ = require("lodash")
  , chalk = require("chalk")
  , safeStringify = require("json-stringify-safe")
  ;

/**
 * Expose a function that passes in a Vantage
 * object and options.
 */

module.exports = function(vantage) {

  vantage
    .mode("repl", "Enters REPL mode.")
    .delimiter("repl:")
    .init(function(args, cb){
      this.log("Entering REPL Mode. To exit, type 'exit'");
      cb(void 0, "Entering REPL Mode. To exit, type 'exit'.");
    })
    .action(function(command, cb) {
      var self = this;
      var globalEval = eval;
      try {
        var res = globalEval(command);
        var log = (_.isString(res)) ? chalk.white(res) : res;
        if (_.isObject(log) && !_.isArray(log)) {
          try {
            log = safeStringify(log, null, 2);
          } catch(e) {
            console.log(e.stack);
          }
        }
        self.log(log);
        cb(void 0, res);
      } catch(e) {
        self.log(e);
        cb(e);
      }
    });
};
