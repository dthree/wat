
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');
const util = require('./util');
const google = require('google');
const cosmetician = require('./cosmetician');
const moment = require('moment');
const chalk = require('chalk');

const searcher = {

  google(command, cb) {
    google(command, cb);
  },

  sites: {
    'stackoverflow': 'stackoverflow'
  },

  filterGoogle(links, sites) {
    sites = (!_.isArray(sites)) ? [sites] : sites;
    let matches = [];
    for (let i = 0; i < links.length; ++i) {
      for (let j = 0; j < sites.length; ++j) {
        if (String(links[i].link).indexOf(searcher.sites[sites[j]]) > -1) {
          matches.push(links[i]);
          break;
        }
      }
    } 
    return matches;
  },

  stackOverflow: {

    parseQuestionId(obj) {
      let res = String(obj.link).split('/questions/')[1];
      if (res) {
        res = String(res).split('/')[0];
        res = (!isNaN(res)) ? res : undefined;
      }
      return res;
    },

    getAnswers(questionId, callback) {
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
          answers = searcher.stackOverflow.sortAnswers(answers);
          answers = searcher.stackOverflow.filterAnswers(answers);
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
      const accepted = answ.is_accepted;
      const markdown = answ.body_markdown;
      const score = answ.score;
      const creation = moment(parseFloat(answ.creation_date) * 1000).format('DD MMM YYYY');
      const owner = answ.owner;
      
      let scoreSpace = cosmetician.pad(score, margin - 4, ' ');
      scoreSpace = (accepted === true) ? chalk.green(scoreSpace) : scoreSpace;
      let creator = '  ' + scoreSpace + '  ' + chalk.cyan(owner.display_name + ' on ' + creation);
      let formatted = cosmetician.tab(cosmetician.markdownToTerminal(markdown), margin - 2);

      return creator + '\n' + formatted;
    },

    getQuestion(questionId, callback) {
      callback = callback || {}
      const url = 'http://api.stackexchange.com/2.2/questions/' + questionId + '/answers?site=stackoverflow';
      util.fetchRemote({
        url: url,
        gzip: true
      }, function (err, data, response) {
        if (!err) {
          let json;
          let parseError;
          try {
            json = JSON.parse(data);
          } catch(e) {
            parseError = e;
          }
          if (json) {
            let items = json.items || [];
            callback(undefined, items);
          } else {
            callback(parseError);
          }
        } else {
          callback(err);
        }
      });
    },

  }




}

module.exports = searcher;




