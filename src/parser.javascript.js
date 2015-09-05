'use strict';

/**
 * Module dependencies.
 */

const chalk = require('chalk');

const js = {

  rules: {
    links: /(\[(.*?)\]\()(.+?)(\))'/g,
    startHash: /^#+/g,
    startHashWithSpace: /^#+ /g,
    methodHashes: /([a-zA-Z])(#)([a-zA-Z])/g,
    startWordDotWord: /^[a-zA-Z]+\.[a-zA-Z]+/,
    parameters: /\((.*)\)/,
    parametersWithParens: /\(.*\)/g,
    optionalParameters: /(\[(?![^\[\]]*\[)[^\]]+\])/g,
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

  parseCommandSyntax(str) {

    //console.log(chalk.yellow(str))

    const self = this;
    const result = {}
    let syn = String(str).trim();
    let errors = [];

    const missingRightParam = (syn.match(self.rules.leftParen) && !(syn.match(self.rules.rightParen)));

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
    syn = (missingRightParam) ? `${syn})` : syn;

    if (syn.match(self.rules.bracketCommaBracket) || syn.match(self.rules.bracketBracketComma)) {
      errors.push('embed-optional-parameters');
    }

    // If we have params, we are a method.
    const isMethod = (syn.match(self.rules.parameters)) ? true : false;

    // Pull out parameters.
    let params = syn.match(self.rules.parameters);
    syn = syn.replace(self.rules.parameters, '');

    let paramArray = [];
    let requiredParamEncountered = false;

    let orderedParams = [];

    if (params) {
      params = params[1];

      orderedParams = String(params).replace(self.rules.brackets, '').replace(self.rules.questionMark, '').replace(/ +/g, '').split(',');

      function iterate() {
        let brackets = params.match(self.rules.optionalParameters);
        if (brackets) {
          for (let i = 0; i < brackets.length; ++i) {
            // All brackets and commas.
            let optionalParam = String(brackets[i]).replace(self.rules.commasAndBrackets, '').replace(self.rules.questionMark, '').replace(/ +/g, '').trim();
            for (let j = 0; j < orderedParams.length; ++j) {
              if (orderedParams[j] === optionalParam) {
                orderedParams[j] = `[${orderedParams[j]}]`;
              }
            }
          }
          params = params.replace(self.rules.optionalParameters, '');
          iterate();
        }
      }

      iterate();

      let remainder = String(params).split(',');
      for (var i = remainder.length-1; i > -1; --i) {
        let isOptional = remainder[i].match(self.rules.questionMark);
        let param = String(remainder[i]).replace(self.rules.questionMark, '').replace(/ +/g, '');

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

          for (let j = 0; j < orderedParams.length; ++j) {
            if (orderedParams[j] === param) {
              orderedParams[j] = `[${orderedParams[j]}]`;
            }
          }

        } else {
          requiredParamEncountered = true;
        }
      }

    }

    
    let isImplicitChild;
    if (syn.match(self.rules.startPeriod)) {
      isImplicitChild = true;
      syn = syn.replace(self.rules.startPeriod, '');
    }

    let nameParts = String(syn).split('.');
    let name = nameParts.pop();
    let parents = nameParts;
    
    parents = parents.map(function (item) {
      return String(item).trim();
    }).filter(function (item) {
      return item !== '';
    });

    result.params = orderedParams;
    result.type = (isMethod) ? 'method' : 'property';
    result.name = name;
    result.parents = parents || [];
    result.errors = errors;
    result.isImplicitChild = isImplicitChild;

    //console.log(result);

    let stringer = this.stringifyCommandSyntax(result);
    //console.log(chalk.magenta(stringer));

    //console.log('\n------------------\n')

    return result;
  },

  stringifyCommandSyntax(obj) {

    const self = this;
    let params = obj.params;

    let result = '';
    let pResult = '';

    for (let i = params.length - 1; i > -1; --i) {
      let param = params[i];
      let optional = params[i].match(self.rules.brackets);
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

  isCommandSyntax(str) {


    const self = this;

    let cmd = String(str).trim();
    cmd = cmd.replace(self.rules.startHash, '');
    cmd = cmd.replace(self.rules.startHashWithSpace, '').trim();
    let cmdWithoutParens = cmd.replace(self.rules.parametersWithParens, '');

    let startsWithWords = cmd.match(self.rules.startsWithWords);
    let startDot = cmd.match(self.rules.startPeriod);
    let startWordDotWord = cmd.match(self.rules.startWordDotWord);
    let hasParens = (cmd.match(self.rules.leftParen) && cmd.match(self.rules.rightParen));
    let hasLeftParen = (cmd.match(self.rules.leftParen));
    let hasBrackets = (cmd.match(self.rules.orderedBrackets));
    let hasMultipleWords = cmdWithoutParens.match(self.rules.multipleWords);

    //console.log(chalk.blue(cmd));

    //console.log('Starts with words: ', startsWithWords);
    //console.log('Starts with dot: ', startDot);
    //console.log('Starts with word.word: ', startWordDotWord);
    //console.log('Has parentheses: ', hasParens);
    //console.log('Has left paren: ', hasLeftParen);
    //console.log('Has brackets: ', hasBrackets);
    //console.log('Has multiple words: ', hasMultipleWords);

    let isSyntax = false;
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
  },

};

module.exports = js;
