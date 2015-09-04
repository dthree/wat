'use strict';

/**
 * Module dependencies.
 */

var chalk = require('chalk');

var js = {

  rules: {
    links: /(\[(.*?)\]\()(.+?)(\))'/g,
    startHash: /^#+/g,
    startHashWithSpace: /^#+ /g,
    methodHashes: /([a-z])(#)([a-z])/g,
    parameters: /\((.*)\)/,
    optionalParameters: /(\[(?![^\[\]]*\[)[^\]]+\])/g,
    brackets: /\[|\]/g,
    commasAndBrackets: /\[|\]|,/g,
    bracketCommaBracket: /(\],.\[?)/g,
    bracketBracketComma: /(\]\[,.?)/g,
    trailingSemicolon: /;$/,
    leftParam: /\(/,
    rightParam: /\)/,
    questionMark: /\?/g,
    startPeriod: /^\./
  },

  parseCommandSyntax: function parseCommandSyntax(str) {

    console.log(chalk.yellow(str));

    var self = this;
    var result = {};
    var syn = String(str).trim();
    var errors = [];

    var missingRightParam = syn.match(self.rules.leftParam) && !syn.match(self.rules.rightParam);

    if (missingRightParam) {
      errors.push('method-missing-right-param');
    }

    // Get rid of links.
    syn = syn.replace(self.rules.links, '$2');

    // Remove starting header #s with spaces.
    syn = syn.replace(self.rules.startHash, '');

    // Remove starting header #s without spaces.
    syn = syn.replace(self.rules.startHashWithSpace, '');

    // Turn #s into .s on method / prop definitions.
    syn = syn.replace(self.rules.methodHashes, '$1.$3');

    if (syn.match(self.rules.trailingSemicolon)) {
      errors.push('no-trailing-semicolon');
    }

    // Remove trailing semi-colon.
    syn = syn.replace(self.rules.trailingSemicolon, '');

    // If someone forgot a right param, add it.
    syn = missingRightParam ? syn + ')' : syn;

    if (syn.match(self.rules.bracketCommaBracket) || syn.match(self.rules.bracketBracketComma)) {
      errors.push('embed-optional-parameters');
    }

    // If we have params, we are a method.
    var isMethod = syn.match(self.rules.parameters) ? true : false;

    // Pull out parameters.
    var params = syn.match(self.rules.parameters);
    syn = syn.replace(self.rules.parameters, '');

    var paramArray = [];
    var requiredParamEncountered = false;

    var orderedParams = [];

    if (params) {
      var i;

      (function () {
        var iterate = function iterate() {
          var brackets = params.match(self.rules.optionalParameters);
          if (brackets) {
            for (var _i = 0; _i < brackets.length; ++_i) {
              // All brackets and commas.
              var optionalParam = String(brackets[_i]).replace(self.rules.commasAndBrackets, '').replace(self.rules.questionMark, '').replace(/ +/g, '').trim();
              for (var j = 0; j < orderedParams.length; ++j) {
                if (orderedParams[j] === optionalParam) {
                  orderedParams[j] = '[' + orderedParams[j] + ']';
                }
              }
            }
            params = params.replace(self.rules.optionalParameters, '');
            iterate();
          }
        };

        params = params[1];

        orderedParams = String(params).replace(self.rules.brackets, '').replace(self.rules.questionMark, '').replace(/ +/g, '').split(',');

        iterate();

        var remainder = String(params).split(',');
        for (i = remainder.length - 1; i > -1; --i) {
          var isOptional = remainder[i].match(self.rules.questionMark);
          var param = String(remainder[i]).replace(self.rules.questionMark, '').replace(/ +/g, '');

          if (param === '') {
            continue;
          }

          if (isOptional) {
            errors.push('use-brackets-for-optional-params');
          }

          if (isOptional && requiredParamEncountered) {
            errors.push('no-optional-params-before-required-params');
          }

          if (isOptional && !requiredParamEncountered) {

            for (var j = 0; j < orderedParams.length; ++j) {
              if (orderedParams[j] === param) {
                orderedParams[j] = '[' + orderedParams[j] + ']';
              }
            }
          } else {
            requiredParamEncountered = true;
          }
        }
      })();
    }

    var isImplicitChild = undefined;
    if (syn.match(self.rules.startPeriod)) {
      isImplicitChild = true;
      syn = syn.replace(self.rules.startPeriod, '');
    }

    var nameParts = String(syn).split('.');
    var name = nameParts.pop();
    var parents = nameParts;

    result.params = orderedParams;
    result.type = isMethod ? 'method' : 'property';
    result.name = name;
    result.parents = parents || [];
    result.errors = errors;
    result.isImplicitChild = isImplicitChild;

    console.log(result);

    var stringer = this.stringifyCommandSyntax(result);
    console.log(chalk.magenta(stringer));

    console.log('\n------------------\n');

    return result;
  },

  stringifyCommandSyntax: function stringifyCommandSyntax(obj) {

    var self = this;
    var params = obj.params;

    var result = '';
    var pResult = '';

    for (var i = params.length - 1; i > -1; --i) {
      var param = params[i];
      var optional = params[i].match(self.rules.brackets);
      if (optional) {
        param = param.replace(self.rules.brackets, '');
      }
      if (optional && i !== 0) {
        pResult = '[, ' + param + pResult + ']';
      } else if (optional) {
        pResult = '[' + param + pResult + ']';
      } else if (i !== 0) {
        pResult = ', ' + param + pResult;
      } else {
        pResult = param + pResult;
      }
    }

    result = obj.name;
    if (obj.parents.length > 0 || obj.isImplicitChild) {
      result = '.' + result;
    }

    if (obj.type === 'method') {
      result = result + '(' + pResult + ')';
    }

    return result;
  }

};

module.exports = js;