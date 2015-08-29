'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var google = require('google');
var stackoverflow = require('./spider.stackoverflow');

var spider = {

  google: google,

  stackoverflow: stackoverflow,

  sites: {
    'stackoverflow': 'stackoverflow'
  },

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