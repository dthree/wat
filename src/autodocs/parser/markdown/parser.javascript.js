'use strict';

const js = {

  /**
  * Regex rules for parsing Javascript syntax.
  */

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
    multipleWords: /[a-zA-Z]+ [a-zA-Z]+/g,
    nonAlphaNumerical: /\W+/g,
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

  /**
  * Takes an API command string, such as
  * `## lib.foo(text[, bar...])`, and parses
  * it into its component parts, noting any
  * errors in the process.
  *
  * Returns a rich object with the syntax
  * broken down.
  *
  * @param {String} str
  * @return {Object}
  * @api public
  */

  parseCommandSyntax(str) {
    const self = this;
    const result = {};
    let syn = String(str).trim();
    const errors = [];

    const missingRightParam = (syn.match(self.rules.leftParen) && !(syn.match(self.rules.rightParen)));

    if (missingRightParam) {
      errors.push('method-missing-right-param');
    }

    // Get rid of links.
    syn = syn.replace(self.rules.links, '$2');

    // Get rid of *s.
    syn = syn.replace(/\*/g, '');

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
    syn = (missingRightParam) ? `${syn})` : syn;

    if (syn.match(self.rules.bracketCommaBracket) || syn.match(self.rules.bracketBracketComma)) {
      errors.push('embed-optional-parameters');
    }

    // If we have params, we are a method.
    let isMethod = (syn.match(self.rules.parameters));

    // Pull out parameters.
    let params = syn.match(self.rules.parameters);
    syn = syn.replace(self.rules.parameters, '');

    // If optional methods (chalk.<foo>[<bar>...])
    syn = syn.replace(self.rules.orderedBrackets, '');

    let requiredParamEncountered = false;
    let orderedParams = [];

    if (params) {
      params = params[1];
      orderedParams = String(params).replace(self.rules.brackets, '').replace(self.rules.questionMark, '').replace(/ +/g, '').split(',');
      function iterate() {
        const brackets = params.match(self.rules.optionalParameters);
        if (brackets) {
          for (let i = 0; i < brackets.length; ++i) {
            // All brackets and commas.
            const optionalParam = String(brackets[i]).replace(self.rules.commasAndBrackets, '').replace(self.rules.questionMark, '').replace(/ +/g, '').trim();
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

      const remainder = String(params).split(',');
      for (let i = remainder.length - 1; i > -1; --i) {
        const isOptional = remainder[i].match(self.rules.questionMark);
        const param = String(remainder[i]).replace(self.rules.questionMark, '').replace(/ +/g, '');

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

    // Make sure we don't have trailing spaces.
    syn = syn.trim();

    let isImplicitChild;
    if (syn.match(self.rules.startPeriod)) {
      isImplicitChild = true;
      syn = syn.replace(self.rules.startPeriod, '');
    }

    const nameParts = String(syn).split('.');
    let name = String(nameParts.pop()).trim();
    let parents = nameParts;

    if (name.match(self.rules.nonAlphaNumerical)) {
      errors.push('invalid-signature-chars');
    }

    // Check for 'new Blah', meaning its an object.
    const objects = ['new'];
    const methods = ['function', 'method'];
    const nonsense = ['var'];
    let isObject = false;
    const nameWords = String(name).split(' ');
    if (nameWords.length > 1) {
      const looseWord = String(nameWords[0]).toLowerCase().trim();
      if (objects.indexOf(looseWord) > -1) {
        isObject = true;
        name = nameWords.slice(1, nameWords.length).join(' ');
      } else if (methods.indexOf(looseWord) > -1) {
        isMethod = true;
        name = nameWords.slice(1, nameWords.length).join(' ');
      } else if (nonsense.indexOf(looseWord) > -1) {
        name = nameWords.slice(1, nameWords.length).join(' ');
      }
    }

    parents = parents.map(function (item) {
      item = String(item).trim();
      let parts = item.split(' ');
      parts = parts.pop();
      return parts;
    }).filter(function (item) {
      return item !== '';
    });

    result.params = orderedParams;
    result.type = (isMethod) ? 'method' : 'property';
    result.type = (isObject) ? 'object' : result.type;
    result.name = name;
    result.parents = parents || [];
    result.errors = errors;
    result.isImplicitChild = isImplicitChild;

    return result;
  },

  /**
  * Takes an object returned by `.parseCommandSyntax`
  * above, and converts it into a properly formatted
  * Javascript syntax string.
  *
  * @param {Object} obj
  * @return {String}
  * @api public
  */

  stringifyCommandSyntax(obj) {
    const self = this;
    const params = obj.params;

    let result = '';
    let pResult = '';

    for (let i = params.length - 1; i > -1; --i) {
      let param = params[i];
      const optional = params[i].match(self.rules.brackets);
      if (optional) {
        param = param.replace(self.rules.brackets, '');
      }
      if (optional && i !== 0) {
        pResult = `[, ${param}${pResult}]`;
      } else if (optional) {
        pResult = `[${param}${pResult}]`;
      } else if (i !== 0) {
        pResult = `, ${param}${pResult}`;
      } else {
        pResult = param + pResult;
      }
    }

    result = obj.name;
    if (obj.parents.length > 0 || obj.isImplicitChild) {
      result = `.${result}`;
    }

    if (obj.type === 'method') {
      result = `${result}(${pResult})`;
    }

    return result;
  },

  /**
  * Reads a raw string (usually a markdown header)
  * and determines whether it is Javascript or not.
  * Used to determine which headers in a markdown
  * document are API declarations.
  *
  * @param {String} str
  * @param {Object} node
  * @return {Boolean}
  * @api public
  */

  isCommandSyntax(str, node) {
    const self = this;

    node = node || {};
    node.parentHeaders = node.parentHeaders || [];

    // Check to see if we're in an example section.
    // There shouldn't be any API declarations there:
    // rather, misleading things like the filename 'foo.js'
    // which would otherwise read as syntax.
    let isExample = false;
    let isHeader = false;
    for (let i = 0; i < node.parentHeaders.length; ++i) {
      const parent = String(node.parentHeaders[i]).trim().toLowerCase();
      if (parent.indexOf('example') > -1) {
        isExample = true;
      }
    }

    isHeader = (node.depth === 1);

    // To do: Have to deal with single-depth headers.
    // D3, for example, defines all API items with
    // single headers, but we don't wat the first item
    // in a doc.
    // If I properly pass in parent headers, I can
    // check to see if it is at the root of the doc...

    // End early.
    if (isExample || (isHeader && node.sequence === 0)) {
      return false;
    }

    let cmd = String(str).trim();
    cmd = cmd.replace(self.rules.startHash, '');
    cmd = cmd.replace(self.rules.startHashWithSpace, '').trim();
    const cmdWithoutParens = cmd.replace(self.rules.parametersWithParens, '');

    const startsWithWords = cmd.match(self.rules.startsWithWords);
    const startDot = cmd.match(self.rules.startPeriod);
    const startWordDotWord = cmd.match(self.rules.startWordDotWord);
    const hasParens = (cmd.match(self.rules.leftParen) && cmd.match(self.rules.rightParen));
    const hasLeftParen = (cmd.match(self.rules.leftParen));
    const hasBrackets = (cmd.match(self.rules.orderedBrackets));
    const hasMultipleWords = cmdWithoutParens.match(self.rules.multipleWords);

    let isSyntax = false;
    if (hasParens && !startsWithWords && !hasMultipleWords) {
      isSyntax = true;
    } else if (startDot && !hasMultipleWords) {
      isSyntax = true;
    } else if (startWordDotWord && !hasMultipleWords) {
      isSyntax = true;
    } else if (hasBrackets && hasLeftParen) {
      isSyntax = true;
    }

    /*
    // Leaving this here for future
    // debugging purposes.
    if (isSyntax) {
      console.log('|' + str);
      console.log('||' + cmdWithoutParens);
      console.log('Has Parens: ' + hasParens);
      console.log('Starts with Words: ' + startsWithWords);
      console.log('startDot: ' + startDot);
      console.log('Has Multiple Words: ' + hasMultipleWords, cmdWithoutParens, self.rules.multipleWords, cmdWithoutParens.match(self.rules.multipleWords));
      console.log('Start Word Dot Word: ' + startWordDotWord);
      console.log('Has Brackets: ' + hasBrackets);
      console.log('Has left paren: ' + hasLeftParen);
    }
    */

    return isSyntax;
  }
};

module.exports = js;
