
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');
const util = require('./util');
const cosmetician = require('./cosmetician');
const moment = require('moment');
const chalk = require('chalk');

const stackoverflow = {

  getPage(searchResult, callback) {
    let self = this;
    callback = callback || {}
    let questionId = (_.isObject(searchResult)) 
      ? this.parseQuestionId(searchResult) 
      : searchResult;

    self.getJSON(questionId, function(err, page) {
      if (err) {
        callback(err);
        return;
      }

      let question = page.question;
      let answers = page.answers;

      let margin = String(_.max(answers, function(answ){
        return String(answ.score).length;
      }).score).length + 4;

      let headerLength = String(question.title).length + 2;
      let viewLength = String(question.view_count).length + 8;
      let padding = process.stdout.columns - (headerLength + viewLength);
      let header = '  ' + chalk.cyan(question.title) + cosmetician.pad('', padding) + question.view_count + ' views';
      let quest = self.formatAnswer(question, margin);

      let result =
        '  ' + chalk.yellow('Stack Overflow') + '\n' + 
        header + '\n' + 
        '\n' + 
        quest + '\n\n' + 
        '  Answers\n' + 
        '  ' + cosmetician.hr(2) + '\n';

      for (let l = 0; l < answers.length; ++l) {
        result += self.formatAnswer(answers[l], margin) + '\n';
        if (l < answers.length - 1) {
          result += cosmetician.pad('', margin) + cosmetician.hr(margin) + '\n';
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
    let self = this;
    let dones = 0;
    let result = {};
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

    self.getQuestion(questionId, function(err, questions){
      result.question = questions;
      handler(err, questions);
    });

    self.getAnswers(questionId, function(err, data){
      result.answers = data;
      handler(err, data);
    });
  },

  getQuestion(questionId, callback) {
    callback = callback || {}
    const url = 'http://api.stackexchange.com/2.2/questions/' + questionId + '?order=desc&sort=activity&site=stackoverflow&filter=!)Ehu.SDh9PeCcJmhDxT60pU1mT_mgvdo9d3mN8WYbPzQzO6Te';
    util.fetchRemote({
      url: url,
      gzip: true 
    }, function(err, answ, response){
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
    const self = this;
    callback = callback || {}
    const filter = '!t)I()ziOdWLVHc78tC981)pqWLzTas-';
    const url = 'http://api.stackexchange.com/2.2/questions/' + questionId + '/answers?order=asc&sort=votes&site=stackoverflow&filter=' + filter;
    util.fetchRemote({
      url: url,
      gzip: true 
    }, function(err, answ, response){
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
    let result = answ.sort(function(a, b){
      let aScore = (a.is_accepted) ? a.score + 5 : a.score;
      let bScore = (b.is_accepted) ? b.score + 5 : b.score;
      let order = (aScore > bScore) ? -1 : (aScore < bScore) ? 1 : 0;
      return order;
    })
    return result;
  },

  filterAnswers(answers) {
    let results = [];
    let sum = 0;
    let best = 0;
    for (let i = 0; i < answers.length; ++i) {
      let score = answers[i].score;
      best = (score > best) ? score : best;
      sum += score;
    }
    let avg = (sum > 0) ? (sum / answers.length) : 0;
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
    let creator = '  ' + scoreSpace + '  ' + chalk.cyan(owner.display_name + ' on ' + creation);
    let formatted = cosmetician.tab(cosmetician.markdownToTerminal(markdown, { lineWidth: (process.stdout.columns - margin - 2) }), margin - 2);

    return creator + '\n' + formatted;
  },
}

module.exports = stackoverflow;

