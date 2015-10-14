'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const google = require('google');

const spider = {

  google,

  sites: {
    'stackoverflow': '//stackoverflow.com/',
    'github': '//github.com/',
  },

  filterGoogle(links, sites) {
    sites = (!_.isArray(sites)) ? [sites] : sites;
    const matches = [];
    const uniq = {}
    for (let i = 0; i < links.length; ++i) {
      for (let j = 0; j < sites.length; ++j) {
        if (String(links[i].link).indexOf(spider.sites[sites[j]]) > -1) {
          if (sites[j] === 'github') {
            links[i].link = String(links[i].link).split('/').slice(0, 5);
            if (links[i].link.length < 5) {
              continue;
            }
            links[i].link = links[i].link.join('/');
            if (uniq[links[i].link] === undefined) {
              uniq[links[i].link] = true;
              matches.push(links[i]);
            }
          } else {
            matches.push(links[i]);
          }
          break;
        }
      }
    }
    return matches;
  }
};

module.exports = function (app) {
  spider.app = app;
  spider.stackoverflow = require('./stackoverflow')(app);
  spider.github = require('./github')(app);
  return spider;
};
