'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var moment = require('moment');
var chalk = require('chalk');
var util = require('../util');

var stackoverflow = {

  getPage: function getPage(searchResult, callback) {
    callback = callback || {};
    var self = this;
    var questionId = _.isObject(searchResult) ? this.parseQuestionId(searchResult) : searchResult;

    self.getJSON(questionId, function (err, page) {
      if (err) {
        callback(err);
        return;
      }

      var question = page.question;
      var answers = page.answers;

      if (answers.length < 1) {
        callback('NO_ANSWERS');
        return;
      }

      var margin = String(_.max(answers, function (answ) {
        return String(answ.score).length;
      }).score).length + 4;
      margin = String(question.score).length + 4 > margin ? String(question.score).length + 4 : margin;

      var headerLength = String(question.title).length + 2;
      var viewLength = String(question.view_count).length + 8;
      var padding = process.stdout.columns - (headerLength + viewLength);
      var header = '  ' + chalk.cyan(question.title) + self.app.cosmetician.pad('', padding) + question.view_count + ' views';
      var quest = self.formatAnswer(question, margin);
      var title = chalk.yellow('Stack Overflow');
      var hr = self.app.cosmetician.hr(2);

      var result = '  ' + title + '\n' + header + '\n\n' + quest + '\n\n  Answers\n  ' + hr + '\n';
      for (var l = 0; l < answers.length; ++l) {
        result += self.formatAnswer(answers[l], margin) + '\n';
        if (l < answers.length - 1) {
          result += self.app.cosmetician.pad('', margin) + self.app.cosmetician.hr(margin) + '\n';
        }
      }
      callback(undefined, result);
    });
  },

  parseQuestionId: function parseQuestionId(obj) {
    var res = String(obj.link).split('/questions/')[1];
    if (res) {
      res = String(res).split('/')[0];
      res = !isNaN(res) ? res : undefined;
    }
    return res;
  },

  getJSON: function getJSON(questionId, cb) {
    var self = this;
    var result = {};
    var dones = 0;
    var returned = false;
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

  getQuestion: function getQuestion(questionId, callback) {
    callback = callback || {};
    var url = 'http://api.stackexchange.com/2.2/questions/' + questionId + '?order=desc&sort=votes&site=stackoverflow&filter=!)Ehu.SDh9PeCcJmhDxT60pU1mT_mgvdo9d3mN8WYbPzQzO6Te';
    util.fetchRemote({
      url: url,
      gzip: true
    }, function (err, answ) {
      if (!err) {
        var answers = undefined;
        var error = undefined;
        try {
          answers = JSON.parse(answ);
        } catch (e) {
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

  getAnswers: function getAnswers(questionId, callback) {
    callback = callback || {};
    var self = this;
    var filter = '!t)I()ziOdWLVHc78tC981)pqWLzTas-';
    var url = 'http://api.stackexchange.com/2.2/questions/' + questionId + '/answers?order=desc&sort=votes&site=stackoverflow&filter=' + filter;
    util.fetchRemote({
      url: url,
      gzip: true
    }, function (err, answ) {
      if (!err) {
        var answers = undefined;
        var error = undefined;
        try {
          answers = JSON.parse(answ);
        } catch (e) {
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

  sortAnswers: function sortAnswers(answ) {
    var result = answ.sort(function (a, b) {
      var aScore = a.is_accepted ? a.score + 5 : a.score;
      var bScore = b.is_accepted ? b.score + 5 : b.score;
      var order = 0;
      if (aScore > bScore) {
        order = -1;
      } else if (aScore < bScore) {
        order = 1;
      }
      return order;
    });
    return result;
  },

  filterAnswers: function filterAnswers(answers) {
    var results = [];
    var sum = 0;
    var best = 0;
    for (var i = 0; i < answers.length; ++i) {
      var score = answers[i].score;
      best = score > best ? score : best;
      sum += score;
    }
    var avg = sum > 0 ? sum / answers.length : 0;
    answers = answers.slice(0, 3);
    for (var i = 0; i < answers.length; ++i) {
      if (answers[i].score >= avg || answers[i].is_accepted === true) {
        results.push(answers[i]);
      }
    }
    return results;
  },

  formatAnswer: function formatAnswer(answ, margin) {
    margin = margin || 8;
    var accepted = answ.is_accepted || false;
    var markdown = answ.body_markdown;
    var score = answ.score;
    var creation = moment(parseFloat(answ.creation_date) * 1000).format('DD MMM YYYY');
    var owner = answ.owner;

    var scoreSpace = this.app.cosmetician.pad(score, margin - 4, ' ');
    scoreSpace = accepted === true ? chalk.green(scoreSpace) : scoreSpace;
    var creator = '  ' + scoreSpace + '  ' + chalk.cyan(owner.display_name + ' on ' + creation);
    var formatted = this.app.cosmetician.tab(this.app.cosmetician.markdownToTerminal(markdown, {
      lineWidth: function lineWidth() {
        return process.stdout.columns - margin - 2;
      }
    }), margin - 2);

    return creator + '\n' + formatted;
  }
};

module.exports = function (app) {
  stackoverflow.app = app;
  return stackoverflow;
};