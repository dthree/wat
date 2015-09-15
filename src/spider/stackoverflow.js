'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const moment = require('moment');
const chalk = require('chalk');
const util = require('../util');

const stackoverflow = {

  getPage(searchResult, callback) {
    callback = callback || {};
    const self = this;
    const questionId = (_.isObject(searchResult))
      ? this.parseQuestionId(searchResult)
      : searchResult;

    self.getJSON(questionId, function (err, page) {
      if (err) {
        callback(err);
        return;
      }

      const question = page.question;
      const answers = page.answers;

      if (answers.length < 1) {
        callback('NO_ANSWERS');
        return;
      }

      let margin = String(_.max(answers, function (answ) {
        return String(answ.score).length;
      }).score).length + 4;
      margin = (String(question.score).length + 4) > margin ? String(question.score).length + 4 : margin;

      const headerLength = String(question.title).length + 2;
      const viewLength = String(question.view_count).length + 8;
      const padding = process.stdout.columns - (headerLength + viewLength);
      const header = `  ${chalk.cyan(question.title)}${self.app.cosmetician.pad('', padding)}${question.view_count} views`;
      const quest = self.formatAnswer(question, margin);
      const title = chalk.yellow('Stack Overflow');
      const hr = self.app.cosmetician.hr(2);

      let result = `  ${title}\n${header}\n\n${quest}\n\n  Answers\n  ${hr}\n`;
      for (let l = 0; l < answers.length; ++l) {
        result += `${self.formatAnswer(answers[l], margin)}\n`;
        if (l < answers.length - 1) {
          result += `${self.app.cosmetician.pad('', margin) + self.app.cosmetician.hr(margin)}\n`;
        }
      }
      callback(undefined, result);
    });
  },

  parseQuestionId(obj) {
    let res = String(obj.link).split('/questions/')[1];
    if (res) {
      res = String(res).split('/')[0];
      res = (!isNaN(res)) ? res : undefined;
    }
    return res;
  },

  getJSON(questionId, cb) {
    const self = this;
    const result = {};
    let dones = 0;
    let returned = false;
    function handler(err) {
      if (err && !returned) {
        returned = true;
        cb(err);
        return;
      }
      dones++;
      if (dones === 2) {
        cb(undefined, result);
      }
    }

    self.getQuestion(questionId, function (err, questions) {
      result.question = questions;
      handler(err, questions);
    });

    self.getAnswers(questionId, function (err, data) {
      result.answers = data;
      handler(err, data);
    });
  },

  getQuestion(questionId, callback) {
    callback = callback || {};
    const url = `http://api.stackexchange.com/2.2/questions/${questionId}?order=desc&sort=votes&site=stackoverflow&filter=!)Ehu.SDh9PeCcJmhDxT60pU1mT_mgvdo9d3mN8WYbPzQzO6Te`;
    util.fetchRemote({
      url,
      gzip: true
    }, function (err, answ) {
      if (!err) {
        let answers;
        let error;
        try {
          answers = JSON.parse(answ);
        } catch(e) {
          error = e;
        }

        if (answers === undefined) {
          callback(error);
          return;
        }

        callback(undefined, (answers.items || [])[0]);
      } else {
        callback(err);
      }
    });
  },

  getAnswers(questionId, callback) {
    callback = callback || {};
    const self = this;
    const filter = '!t)I()ziOdWLVHc78tC981)pqWLzTas-';
    const url = `http://api.stackexchange.com/2.2/questions/${questionId}/answers?order=desc&sort=votes&site=stackoverflow&filter=${filter}`;
    util.fetchRemote({
      url,
      gzip: true
    }, function (err, answ) {
      if (!err) {
        let answers;
        let error;
        try {
          answers = JSON.parse(answ);
        } catch(e) {
          error = e;
        }

        if (answers === undefined) {
          callback(error);
          return;
        }

        answers = answers.items || [];
        answers = self.sortAnswers(answers);
        answers = self.filterAnswers(answers);
        callback(undefined, answers);
      } else {
        callback(err);
      }
    });
  },

  sortAnswers(answ) {
    const result = answ.sort(function (a, b) {
      const aScore = (a.is_accepted) ? a.score + 5 : a.score;
      const bScore = (b.is_accepted) ? b.score + 5 : b.score;
      let order = 0;
      if (aScore > bScore) {
        order = -1;
      } else if (aScore < bScore) {
        order = 1;
      }
      return order;
    });
    return result;
  },

  filterAnswers(answers) {
    const results = [];
    let sum = 0;
    let best = 0;
    for (let i = 0; i < answers.length; ++i) {
      const score = answers[i].score;
      best = (score > best) ? score : best;
      sum += score;
    }
    const avg = (sum > 0) ? (sum / answers.length) : 0;
    answers = answers.slice(0, 3);
    for (let i = 0; i < answers.length; ++i) {
      if (answers[i].score >= avg || answers[i].is_accepted === true) {
        results.push(answers[i]);
      }
    }
    return results;
  },

  formatAnswer(answ, margin) {
    margin = margin || 8;
    const accepted = answ.is_accepted || false;
    const markdown = answ.body_markdown;
    const score = answ.score;
    const creation = moment(parseFloat(answ.creation_date) * 1000).format('DD MMM YYYY');
    const owner = answ.owner;

    let scoreSpace = cosmetician.pad(score, margin - 4, ' ');
    scoreSpace = (accepted === true) ? chalk.green(scoreSpace) : scoreSpace;
    const creator = `  ${scoreSpace}  ${chalk.cyan(`${owner.display_name} on ${creation}`)}`;
    const formatted = cosmetician.tab(cosmetician.markdownToTerminal(markdown, {lineWidth: (function(){ return process.stdout.columns - margin - 2})}), margin - 2);

    return `${creator}\n${formatted}`;
  }
};

module.exports = function (app) {
  stackoverflow.app = app;
  return stackoverflow;
};
