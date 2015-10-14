'use strict';

/**
 * Module dependencies.
 */

var _ = require('lodash');
var google = require('google');

var spider = {

  google: google,

  sites: {
    'stackoverflow': '//stackoverflow.com/',
    'github': '//github.com/'
  },

  filterGoogle: function filterGoogle(links, sites) {
    sites = !_.isArray(sites) ? [sites] : sites;
    var matches = [];
    var uniq = {};
    for (var i = 0; i < links.length; ++i) {
      for (var j = 0; j < sites.length; ++j) {
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