'use strict';

/**
 * Module dependencies.
 */

const stripBadges = require('mdast-strip-badges');
const util = require('../util');
const chalk = require('chalk');
const fs = require('fs');
const pathx = require('path');
const os = require('os');
const _ = require('lodash');
const rimraf = require('rimraf');

const javascript = require('./parser.javascript');
const mdast = require('./parser.mdast');  

const autodocs = {

  javascript,

  mdast,

  run(name, options, callback) {
    options = options || {}
    options.rebuild = options.rebuild || true;
    const self = this;
    let lib = String(name).trim();
    let config = self.app.clerk.autodocs.config();

    if (!config) {
      callback(`Wat had trouble reading "./config/config.auto.json".`);
      return;
    }

    let libs = [];
    
    if (lib === 'all') {
      libs = Object.keys(config);
    } else {
      if (!config[lib]) {
        callback(`${lib} is not on Wat's list of auto-updating libraries.\n  To include it, add it to ./config/config.auto.json and submit a PR.`);
        return;
      }
      libs.push(lib);
    }

    function handleLib(libName) {
      let data = config[libName];
      data.urls = data.urls || [];
      data.language = data.language || 'javascript';
      const opt = {
        urls: data.urls,
        language: data.language,
        aliases: data.aliases,
        crawl: false,
        onFile: function(data) {
          let total = data.total;
          let downloaded = data.downloaded;
        },
      };

      let result = self.scaffold(libName, opt, function (err, data) {
        if (libs.length < 1) {
          if (options.rebuild) {
            self.app.clerk.indexer.build(function(index, localIndex){
              self.app.clerk.indexer.write(index, localIndex);
              callback();
            });
          } else {
            callback();
          }
        } else {
          let next = libs.shift();
          handleLib(next);            
        }
      });
    }

    let next = libs.shift();
    handleLib(next);
  },

  scaffold(name, options, callback) {
    callback = callback || {};
    options = options || {}
    const self = this;
    const urls = options.urls;
    const lang = options.language || 'javascript';
    const isStatic = options.static || false;
    const aliases = options.aliases || [];
    const repoName = String(name).trim();
    const allNames = aliases;
    const results = {}
    const errors = [];
    const writeOptions = { static: isStatic }

    allNames.push(repoName);

    if (!repoName) {
      throw new Error('No valid library name passed for autodocs.scaffold.');
    }

    // If crawl is set to true, the autodocs
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

    const temp = this.app.clerk.paths.temp.root;

    let autodocPath = `${self.app.clerk.paths.static.autodocs}${repoName}`;
    let localAutodocPath = `${self.app.clerk.paths.temp.autodocs}${repoName}`;
    try {
      if (writeOptions.static) {
        rimraf.sync(autodocPath);
      }
      rimraf.sync(localAutodocPath);
    } catch(e) {}

    if (writeOptions.static) {
      util.mkdirSafe(autodocPath);
    }
    util.mkdirSafe(localAutodocPath);

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

        let api = self.mdast.filterAPINodes(headers, allNames);
        api = self.mdast.buildAPIPaths(api, repoName);

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

        final[result] = {
          api: api,
          docs: docs,
          headers: headers,
          urls: urls
        }
      }

      let config = self.mdast.buildAPIConfig(finalAPI);
      config.docs = [];

      for (const doc in final) {
        if (final.hasOwnProperty(doc)) {
          config.docs.push(doc);
          self.writeDocSet(final[doc].docs, writeOptions);
        }
      }

      if (writeOptions.static) {
        self.writeConfig(autodocPath, config);
      }
      self.writeConfig(localAutodocPath, config);

      self.writeAPI(finalAPI, writeOptions);

      callback();
    }
  },

  writeDocSet(docs, options) {
    options = options || {}
    let result = '';
    for (let i = 0; i < docs.length; ++i) {
      let local = '';
      if (!docs[i].docPath) {
        continue;
      }

      const temp = this.app.clerk.paths.temp.root;
      let path = String(docs[i].docPath);
      let parts = path.split('/');
      let file = parts.pop();
      let directory = parts.join('/');
      let fileAddon = (docs[i].fold.length > 0) ? '/' + file : '';
      let dir = __dirname + '/../..' + directory;
      let tempDir = temp + directory;

      if (options.static) {
        util.mkdirSafe(dir + fileAddon);
      }
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

      if (docs[i].fold.length > 0) {
        local += this.writeDocSet(docs[i].fold);
      }

      if (options.static) {
        fs.writeFileSync(dir + fullPath, local);
      }
      fs.writeFileSync(tempDir + fullPath, local);

      result += local;
    }
    return result;
  },

  writeAPI(api, options) {
    options = options || {}
    for (var i = 0; i < api.length; ++i) {
      if (!api[i].apiPath) {
        continue;
      }
      const temp = this.app.clerk.paths.temp.root;
      let path = String(api[i].apiPath);
      let parts = path.split('/');
      let file = parts.pop();
      let directory = parts.join('/');
      let dir = __dirname + '/../..' + directory;
      let tempDir = temp + directory;

      if (options.static) {
        util.mkdirSafe(dir);
      }
      util.mkdirSafe(tempDir);

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
        if (options.static) {
          fs.writeFileSync(dir + '/' + file + '.md', basicText, 'utf-8');
        }
        if (detailText !== '') {
          fs.writeFileSync(tempDir + '/' + file + '.detail.md', detailText, 'utf-8');
          if (options.static) {
            fs.writeFileSync(dir + '/' + file + '.detail.md', detailText, 'utf-8');
          }
        }
      } catch(e) {
        throw new Error(e);
      }
    }
  },

  writeConfig(path, config) {
    try {
      fs.writeFileSync(`${path}/config.json`, JSON.stringify(config, null, '  '));
    } catch(e) {
      console.log(`\n\n${chalk.yellow(`  In building an autodoc, Wat couldn't write its config file.`)}\n`);
      throw new Error(e);
    }
  },

  delete(name, opt, callback) {
    const options = options || {}
    options.rebuild = opt.rebuild || true;
    const self = this;
    const lib = String(name).trim();
    const temp = this.app.clerk.paths.temp.root;

    let autodocPath = `${self.app.clerk.paths.static.autodocs}${name}`;
    let localAutodocPath = `${self.app.clerk.paths.temp.autodocs}${name}`;

    const config = self.app.clerk.autodocs.config();

    if (config[name] === undefined) {
      callback(`\n  ${name} isn't an auto-generated library. Did you get the spelling right?\n`);
      return;
    }

    if (config[name].static === true) {
      callback(`\n  ${name} is a permanent library and cannot be unbuilt.\n`);
      return;
    }

    try {
      if (options.static) {
        rimraf.sync(autodocPath);
      }
      rimraf.sync(localAutodocPath);
    } catch(e) {}

    if (options.rebuild) {
      self.app.clerk.indexer.build(function(index, localIndex){
        self.app.clerk.indexer.write(index, localIndex);
        callback();
      });
    } else {
      callback();
    }
  },

};

module.exports = function (app) {
  autodocs.app = app;
  return autodocs;
};
