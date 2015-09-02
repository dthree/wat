'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const google = require('google');
const stackoverflow = require('./spider.stackoverflow');
const github = require('./spider.github');

const spider = {

  google,

  stackoverflow,

  github,

  sites: {
    'stackoverflow': '//stackoverflow.com/',
    'github': '//github.com/',
  },

  init(parent) {
    this.parent = parent;
    this.stackoverflow.init(parent);
    this.github.init(parent);
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
