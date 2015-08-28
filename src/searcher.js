
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
const stackoverflow = require('./searcher.stackoverflow');

const searcher = {

  google(command, cb) {
    google(command, cb);
  },

  sites: {
    'stackoverflow': 'stackoverflow'
  },

  stackoverflow: stackoverflow,

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
  }

}

module.exports = searcher;

