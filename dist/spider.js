
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
var stackoverflow = require('./spider.stackoverflow');

var spider = {

  google: function google(command, cb) {
    _google(command, cb);
  },

  sites: {
    'stackoverflow': 'stackoverflow'
  },

  stackoverflow: stackoverflow,

  filterGoogle: function filterGoogle(links, sites) {
    sites = !_.isArray(sites) ? [sites] : sites;
    var matches = [];
    for (var i = 0; i < links.length; ++i) {
      for (var j = 0; j < sites.length; ++j) {
        if (String(links[i].link).indexOf(spider.sites[sites[j]]) > -1) {
          matches.push(links[i]);
          break;
        }
      }
    }
    return matches;
  }

};

module.exports = spider;