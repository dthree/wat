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
    methodHashes: /([a-zA-Z])(#)([a-zA-Z])/g,
    startWordDotWord: /^[a-zA-Z]+\.[a-zA-Z]+/,
    parameters: /\((.*)\)/,
    parametersWithParens: /\(.*\)/g,
    optionalParameters: /(\[(?![^\[\]]*\[)[^\]]+\])/g,
    quotesAndTicks: /\`|\"|\'/g,
    brackets: /\[|\]/g,
    orderedBrackets: /\[.+\]/g,
    multipleWords: /[a-zA-Z]+ [a-zA-Z]+ /g,
    commasAndBrackets: /\[|\]|,/g,
    bracketCommaBracket: /(\],.\[?)/g,
    bracketBracketComma: /(\]\[,.?)/g,
    trailingSemicolon: /;$/,
    leftParen: /\(/,
    rightParen: /\)/,
    questionMark: /\?/g,
    startPeriod: /^\./,
    startsWithWords: /^[a-zA-Z]+ +/
  },

  parseCommandSyntax: function parseCommandSyntax(str) {

    //console.log(chalk.yellow(str))

    var self = this;
    var result = {};
    var syn = String(str).trim();
    var errors = [];

    var missingRightParam = syn.match(self.rules.leftParen) && !syn.match(self.rules.rightParen);

    if (missingRightParam) {
      errors.push('method-missing-right-param');
    }

    // Get rid of links.
    syn = syn.replace(self.rules.links, '$2');

    // Remove starting header #s with spaces.
    syn = syn.replace(self.rules.startHash, '');

    // Remove quotes and tick marks.
    syn = syn.replace(self.rules.quotesAndTicks, '');

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

    parents = parents.map(function (item) {
      return String(item).trim();
    }).filter(function (item) {
      return item !== '';
    });

    result.params = orderedParams;
    result.type = isMethod ? 'method' : 'property';
    result.name = name;
    result.parents = parents || [];
    result.errors = errors;
    result.isImplicitChild = isImplicitChild;

    //console.log(result);

    var stringer = this.stringifyCommandSyntax(result);
    //console.log(chalk.magenta(stringer));

    //console.log('\n------------------\n')

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
  },

  isCommandSyntax: function isCommandSyntax(str) {

    var self = this;

    var cmd = String(str).trim();
    cmd = cmd.replace(self.rules.startHash, '');
    cmd = cmd.replace(self.rules.startHashWithSpace, '').trim();
    var cmdWithoutParens = cmd.replace(self.rules.parametersWithParens, '');

    var startsWithWords = cmd.match(self.rules.startsWithWords);
    var startDot = cmd.match(self.rules.startPeriod);
    var startWordDotWord = cmd.match(self.rules.startWordDotWord);
    var hasParens = cmd.match(self.rules.leftParen) && cmd.match(self.rules.rightParen);
    var hasLeftParen = cmd.match(self.rules.leftParen);
    var hasBrackets = cmd.match(self.rules.orderedBrackets);
    var hasMultipleWords = cmdWithoutParens.match(self.rules.multipleWords);

    //console.log(chalk.blue(cmd));

    //console.log('Starts with words: ', startsWithWords);
    //console.log('Starts with dot: ', startDot);
    //console.log('Starts with word.word: ', startWordDotWord);
    //console.log('Has parentheses: ', hasParens);
    //console.log('Has left paren: ', hasLeftParen);
    //console.log('Has brackets: ', hasBrackets);
    //console.log('Has multiple words: ', hasMultipleWords);

    var isSyntax = false;
    if (hasParens && !startsWithWords) {
      isSyntax = true;
    } else if (startDot && !hasMultipleWords) {
      isSyntax = true;
    } else if (startWordDotWord && !hasMultipleWords) {
      isSyntax = true;
    } else if (hasBrackets && hasLeftParen) {
      isSyntax = true;
    }

    //console.log(chalk.magenta(isSyntax));
    //console.log('-----------')

    return isSyntax;
  }

};

module.exports = js;