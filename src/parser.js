'use strict';

/**
 * Module dependencies.
 */

const stripBadges = require('mdast-strip-badges');
const javascript = require('./parser.javascript');
const mdast = require('./parser.mdast');  
const util = require('./util');
const chalk = require('chalk');
const fs = require('fs');
const pathx = require('path');
const os = require('os');
const _ = require('lodash');
const rimraf = require('rimraf');

const parser = {

  javascript,

  mdast,

  scaffold(name, options, callback) {
    callback = callback || {};
    options = options || {}
    const self = this;
    const urls = options.urls;
    const lang = options.language || 'javascript';
    const repoName = String(name).trim();

    const results = {}
    const errors = [];

    if (!repoName) {
      callback();
      return;
    }

    // If crawl is set to true, the parser
    // will crawl the given readme files for additional
    // markdown urls.
    const crawl = options.crawl || false;

    // Set appropriate parsing language.
    this.mdast.language(lang);

    const tree = {}
    const final = {}
    let finalAPI = [];
    let finalDocs = [];

    function traverse(node, path) {
      path = path || '';
      for (const item in node) {
        let fullPath = (path !== '') ? path + '/' + item : String(item);
        if (_.isObject(node[item])) {
          traverse(node[item], fullPath);
        } else {
          tree[fullPath] = node[item];
        }
      }
    }
    traverse(urls);

    let done = 0;
    let total = Object.keys(tree).length;
    function doneHandler() {
      done++;
      //console.log(done, total)
      if (options.onFile) {
        options.onFile.call(undefined, {
          total: total,
          downloaded: done
        });
      }
      if (done >= total) {
        parse();
      }
    }

    function fetchOne(key, value) {
      //console.log('Fetching', value);
      util.fetchRemote(value, function (err, data) {
        if (!err) {
          results[key] = data;
        } else {
          errors.push(err);
        }
        doneHandler();
      })
    }

    for (const url in tree) {
      fetchOne(url, tree[url]);
    }

    let autoDocPath = `${__dirname}/../autodocs/${repoName}`;
    try {
      rimraf.sync(autoDocPath);
    } catch(e) {}

    function parse() {
      for (const result in results) {

        let md = results[result];
        md = self.mdast.stripHTML(md);

        const ast = self.mdast.parse(md);
        const urls = self.mdast.getUrlsFromAst(ast);
        const repoUrls = self.mdast.filterUrlsByGithubRepo(urls, undefined, repoName);
        let headers = self.mdast.groupByHeaders(ast);

        let pathParts = String(result).split('/');
        let last = pathParts.pop();
        let resultRoot = (pathParts.length > 0) ? pathParts.join('/') : '';

        let api = self.mdast.filterAPINodes(headers, repoName);
        api = self.mdast.buildAPIPaths(api, repoName);

        //console.log('API', api);

        // Make an index for that doc set.
        if (headers.length === 1) {
          headers[0].children = [{ type: 'text', value: last, position: {} }];
        } else if (headers.length > 1) {
          headers = [{
            type: 'heading',
            depth: 1,
            children: [{ type: 'text', value: last, position: {} }],
            position: {},
            fold: headers,
            junk: [],
          }];
        }

        let docs = self.mdast.buildDocPaths(headers, `/autodocs/${repoName}/${resultRoot}`);

        finalAPI = finalAPI.concat(api);
        finalDocs = finalDocs.concat(docs);

        //console.log(docs)


        final[result] = {
          api: api,
          docs: docs,
          headers: headers,
          urls: urls
        }
      }

      //self.writeDocSet(finalDocs);
      for (const doc in final) {
        if (final.hasOwnProperty(doc)) {
          //console.log('Writing doc set', doc);
          self.writeDocSet(final[doc].docs);
        }
      }

      //console.log(finalAPI)

      self.writeAPI(finalAPI);

      callback();
    }

    /*
    const path = __dirname + file;
    let md;
    try {
      md = require('fs').readFileSync(path, { encoding: 'utf-8' });
    } catch(e) {
      console.log(e);
    }
    */
/*
    */
  },

  writeDocSet(docs) {

    let result = '';

    for (let i = 0; i < docs.length; ++i) {

      let local = '';

      if (!docs[i].docPath) {
        continue;
      }

      const temp = pathx.join(os.tmpdir(), '/.wat/.local');
      let path = String(docs[i].docPath);
      let parts = path.split('/');
      let file = parts.pop();
      let directory = parts.join('/');
      let fileAddon = (docs[i].fold.length > 0) ? '/' + file : '';
      let dir = __dirname + '/..' + directory;
      let tempDir = temp + directory;

      util.mkdirSafe(dir + fileAddon);
      util.mkdirSafe(tempDir + fileAddon);

      docs[i].junk = docs[i].junk || [];

      let fullPath = (docs[i].fold.length > 0)
        ? '/' + file + '/' + 'index.md'
        : '/' + file + '.md';
      
      let header = mdast.stringify(docs[i]);
      let allJunk = header + '\n\n';
      for (let j = 0; j < docs[i].junk.length; ++j) {
        allJunk += mdast.stringify(docs[i].junk[j]) + '\n\n';
      }


      local += allJunk;

      //console.log('Writing ' + dir + fullPath, allJunk.length);

      if (docs[i].fold.length > 0) {
        local += this.writeDocSet(docs[i].fold);
      }

      fs.writeFileSync(dir + fullPath, local);
      fs.writeFileSync(tempDir + fullPath, local);

      result += local;
    }

    return result;

  },

  writeAPI(api) {

    for (var i = 0; i < api.length; ++i) {
      if (!api[i].apiPath) {
        continue;
      }

      const temp = pathx.join(os.tmpdir(), '/.wat/.local');

      let path = String(api[i].apiPath);
      let parts = path.split('/');
      let file = parts.pop();
      let directory = parts.join('/');
      let dir = __dirname + '/..' + directory;
      let tempDir = temp + directory;

      util.mkdirSafe(dir);
      util.mkdirSafe(tempDir);

      //console.log(dir);
      //console.log(tempDir);

      let codeSampleFound = false;
      let basicText = `## ${api[i].formatted}\n\n`;
      let detailText = basicText;
      let lineX = 2;
      let lineXBasic = 2;


      for (let j = 0; j < api[i].junk.length; ++j) {
        let item = api[i].junk[j];
        let lines = item.position.end.line - item.position.start.line + 1;
        let content = mdast.stringify(item) + '\n\n';
        let isCode = (item.type === 'code');

        lineX += lines;

        let basic;
        if (lineX <= 20) {
          basic = true;
        } else if ((lineX - lines) > 10 && codeSampleFound) {
          basic = false;
        } else if (lineX > 20 && !codeSampleFound && isCode && lineX < 40) {
          basic = true;
        }

        if (basic) {
          lineXBasic = lineX;
          basicText += content;
        }
        detailText += content;

        if (isCode) {
          codeSampleFound = true;
        }

      }

      // If detail has no more content than
      // basic, just get rid of it.
      if (lineX === lineXBasic) {
        detailText = '';
      }

      try {
        fs.writeFileSync(tempDir + '/' + file + '.md', basicText, 'utf-8');
        fs.writeFileSync(dir + '/' + file + '.md', basicText, 'utf-8');
        if (detailText !== '') {
          fs.writeFileSync(tempDir + '/' + file + '.detail.md', detailText, 'utf-8');
          fs.writeFileSync(dir + '/' + file + '.detail.md', detailText, 'utf-8');
        }
      } catch(e) {
        throw new Error(e);
      }

      //console.log(dir, file);

    }

  },

};

module.exports = parser;
