'use strict';

/**
 * Module dependencies.
 */

const _ = require('lodash');
const util = require('./util');
const moment = require('moment');
const chalk = require('chalk');
const mdast = require('mdast');
const stripBadges = require('mdast-strip-badges');
const parser = require('./parser');

let currentRepo;



function assemble(items) {

  var header = [];
  var depth = 100;

  var curr = {}
  var last;
  var res = [];

  function getParentI(depth) {
    for (var i = depth - 1; i > -1; --i) {
      if (curr[i]) {
        return i;
      }
    }
  }

  let urls = [];

  function getURLs(nodes) {
    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i].type === 'link') {
        let href = github.cleanLink(nodes[i].href);
        let isLocalLink = github.isLocalLink(href);
        let details = github.parseSearchLink(href);
        let isMd = github.isMarkdownLink(href);
        let isSameRepo = (details && (details.owner === currentRepo.owner) && (details.name === currentRepo.name));
        if (href === '') { 
          continue;
        }

        if (!isLocalLink && isSameRepo && isMd) {
          if (href.indexOf('/issues/') === -1) {
            urls.push(href);
          }
        } else if (isLocalLink && isMd) {
          urls.push(href);
        }
      }
      if (nodes[i].children && nodes[i].children.length > 0) {
        getURLs(nodes[i].children);
      }
    }
  }
  getURLs(items);
  urls = _.uniq(urls);

  console.log(urls);

  for (var i = 0; i < items.length; ++i) {

    var item = items[i];
    item.fold = item.fold || [];
    last = item;

    if (item.type === 'heading') {


      var lastDepth = depth;
      depth = item.depth - 1;

      if (depth < lastDepth) {

        var parentI = getParentI(depth);
        if (parentI) {
          curr[parentI].fold.push(item);
          curr[depth] = item;
          for (var j = depth + 1; j < 6; ++j) {
            delete curr[j];
          }
        } else {
          // If no parent, push to top.
          res.push(item);
          for (var j = 0; j < 6; ++j) {
            delete curr[j];
          }
          curr[depth] = item;
        }
      } else if (depth === lastDepth) {

        //console.log(item.children)

        curr[depth] = item;
        var parentI = getParentI(depth);
        if (parentI) {
          curr[parentI].fold.push(item);
        } else {
          res.push(item);
        }

      } else if (depth > lastDepth) {

        //console.log(item.depth - 1, ': ', item.children[0].value)
        if (curr[lastDepth]) {
          //console.log('pusing to ', curr[lastDepth])
          curr[lastDepth].fold.push(item);
        } else {
          console.log('WTFWTF');
        }

      }
    } else {
      last.fold.push(item);

    }
  }


  let api = [];
  let readme = [];

  let structure = [];

  function loop(obj, lvl) {
    let subheading = '';
    for (var i = 0; i < obj.length; ++i) {
      let item = obj[i];

      if (item.type === 'heading') {
        if (subheading != '') {
          //console.log(chalk.green(subheading));
          subheading = '';
        }
        let text = '';
        for (var j = 0; j < lvl; ++j) {
          text += ' ';
        }
        text += item.children[0].value + ' (h' + item.depth + ')'
        let stringer = mdast.stringify(item);
        let syntax = parser.javascript.parseCommandSyntax(stringer);
        console.log(chalk.cyan(text)); 
        console.log(stringer);
        console.log(syntax)
      } else if (item.type === 'paragraph') {
        subheading += mdast.stringify(item).replace(/\n/g, ' ') + '\n';
      } else if (item.type === '') {

      } else {
        subheading += mdast.stringify(item) + '\n';
      }
      loop(item.fold, lvl + 1);
    }
    if (subheading != '') {
      //console.log(chalk.green(subheading));
      subheading = '';
    }
  }
  loop(res, 0);

  return res;

};

function attacher(mdast, options) {

  function transformer(node) {

    //console.log(node);

    var items = node.children;

    var res = assemble(items);

    //console.log(res);

    for (var i = 0; i < items.length; ++i) {

      //console.log(items[i]);  
    }

  }

  return transformer;
}

const github = {

  init(parent) {
    this.parent = parent;
  },

  getPage(searchResult, callback) {
    callback = callback || {};
    const self = this;

    let details = this.parseSearchLink(searchResult.link);
    let readmeUrl = this.getRepoReadmeUrl(details);


    currentRepo = details;

    function request(urls, cb) {
      let url = urls.shift();
      if (url) {
        util.fetchRemote(url, function (err, data) {
          let results;
          if (!err) {


            var md = mdast().use(stripBadges).use(attacher);

            results = md.process(data);

            //results = self.parent.cosmetician.markdownToTerminal(data, {lineWidth: (process.stdout.columns - 2)});
            cb(undefined, String(results).slice(0, 0));
          } else {
            request(urls, cb);
          }
        });
      } else {
        cb('Not found.');
      }
    }

    request([readmeUrl.upper, readmeUrl.lower, readmeUrl.title, readmeUrl.out], callback);
  },

  isMarkdownLink(str) {
    let parts = String(str).split('.');
    let last = parts[parts.length-1];
    return (last.toLowerCase() === 'md');
  },

  isLocalLink(str) {
    const keywords = ['https://', 'http://', '.com', '.net', '.io'];
    let local = true;
    let url = String(str).toLowerCase();
    for (let i = 0; i < keywords.length; ++i) {
      if (url.indexOf(keywords[i]) > -1) {
        local = false;
        break;
      }
    }
    return local;
  },

  cleanLink(str) {
    let url = String(str);
    let hashIdx = String(url).indexOf('#');
    if (hashIdx > -1) {
      url = url.slice(0, hashIdx);
    }
    let qIdx = String(url).indexOf('?');
    if (qIdx > -1) {
      url = url.slice(0, qIdx);
    }
    return String(url).trim();
  },

  parseSearchLink(url) {
    let res = String(url).split('//github.com/')[1];
    let result;
    if (res) {
      let parts = String(res).split('/');
      let owner = parts[0];
      let name = parts[1];
      if (owner && name) {
        result = { owner, name };
      }
    }
    return result;
  },

  getRepoReadmeUrl(repo) {
    let result;
    if (repo) {
      result = {
        upper: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/master/README.md`,
        title: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/master/Readme.md`,
        lower: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/master/readme.md`,
        out: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/master/readme.markdown`
      }
    }
    return result;
  },

};

module.exports = github;
