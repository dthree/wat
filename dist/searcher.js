
"use strict";

/**
 * Module dependencies.
 */

var _ = require('lodash');
var util = require('./util');
var _google = require('google');
var cosmetician = require('./cosmetician');
var moment = require('moment');
var chalk = require('chalk');

var searcher = {

  google: function google(command, cb) {
    _google(command, cb);
  },

  sites: {
    'stackoverflow': 'stackoverflow'
  },

  filterGoogle: function filterGoogle(links, sites) {
    sites = !_.isArray(sites) ? [sites] : sites;
    var matches = [];
    for (var i = 0; i < links.length; ++i) {
      for (var j = 0; j < sites.length; ++j) {
        if (String(links[i].link).indexOf(searcher.sites[sites[j]]) > -1) {
          matches.push(links[i]);
          break;
        }
      }
    }
    return matches;
  },

  stackOverflow: {

    parseQuestionId: function parseQuestionId(obj) {
      var res = String(obj.link).split('/questions/')[1];
      if (res) {
        res = String(res).split('/')[0];
        res = !isNaN(res) ? res : undefined;
      }
      return res;
    },

    getAnswers: function getAnswers(questionId, callback) {
      callback = callback || {};
      var filter = '!t)I()ziOdWLVHc78tC981)pqWLzTas-';
      var url = 'http://api.stackexchange.com/2.2/questions/' + questionId + '/answers?order=asc&sort=votes&site=stackoverflow&filter=' + filter;
      util.fetchRemote({
        url: url,
        gzip: true
      }, function (err, answ, response) {
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
          answers = searcher.stackOverflow.sortAnswers(answers);
          answers = searcher.stackOverflow.filterAnswers(answers);
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
        var order = aScore > bScore ? -1 : aScore < bScore ? 1 : 0;
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
      var accepted = answ.is_accepted;
      var markdown = answ.body_markdown;
      var score = answ.score;
      var creation = moment(parseFloat(answ.creation_date) * 1000).format('DD MMM YYYY');
      var owner = answ.owner;

      var scoreSpace = cosmetician.pad(score, margin - 4, ' ');
      scoreSpace = accepted === true ? chalk.green(scoreSpace) : scoreSpace;
      var creator = '  ' + scoreSpace + '  ' + chalk.cyan(owner.display_name + ' on ' + creation);
      var formatted = cosmetician.tab(cosmetician.markdownToTerminal(markdown), margin - 2);

      return creator + '\n' + formatted;
    },

    getQuestion: function getQuestion(questionId, callback) {
      callback = callback || {};
      var url = 'http://api.stackexchange.com/2.2/questions/' + questionId + '/answers?site=stackoverflow';
      util.fetchRemote({
        url: url,
        gzip: true
      }, function (err, data, response) {
        if (!err) {
          var json = undefined;
          var parseError = undefined;
          try {
            json = JSON.parse(data);
          } catch (e) {
            parseError = e;
          }
          if (json) {
            var items = json.items || [];
            callback(undefined, items);
          } else {
            callback(parseError);
          }
        } else {
          callback(err);
        }
      });
    }

  }

};

module.exports = searcher;