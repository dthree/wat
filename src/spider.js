'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const google = require('google');
const stackoverflow = require('./spider.stackoverflow');

const spider = {

  google,

  stackoverflow,

  sites: {
    'stackoverflow': 'stackoverflow'
  },

  filterGoogle(links, sites) {
    sites = (!_.isArray(sites)) ? [sites] : sites;
    const matches = [];
    for (let i = 0; i < links.length; ++i) {
      for (let j = 0; j < sites.length; ++j) {
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
