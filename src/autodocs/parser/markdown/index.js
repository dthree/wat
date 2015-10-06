'use strict';

const _ = require('lodash');
const rimraf = require('rimraf');
const fs = require('fs');
const chalk = require('chalk');
const util = require('../../../util');
const path = require('path');

const javascript = require('./parser.javascript');
const mdast = require('./mdast');  

const markdownParser = {

  javascript,

  mdast,

  run(name, options, callback) {
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
      if (options.progress) {
        options.progress({
          total: total,
          downloaded: done,
          action: 'fetch'
        });
      }
      if (done >= total) {
        parse();
      }
    }

    function fetchOne(key, value) {
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
      if (options.progress) {
        options.progress({
          total: 50,
          downloaded: 50,
          action: 'parse'
        });
      }
      for (const result in results) {
        let md = results[result];
        md = self.mdast.stripHTML(md);

        let ast = self.mdast.parse(md);
        ast = self.mdast.sequenceAst(ast);
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

        if (result === 'readme') {
          for (let j = 0; j < docs[0].fold.length; ++j) {
            // let f = docs[0].fold[j];
            // console.log(f.children);
            // console.log(f.docPath);
            // console.log(mdast.stringify(f));
          }
        }

        finalAPI = finalAPI.concat(api);
        finalDocs = finalDocs.concat(docs);

        final[result] = {
          api: api,
          docs: docs,
          headers: headers,
          urls: urls
        }
      }

      if (options.progress) {
        options.progress({
          total: 50,
          downloaded: 50,
          action: 'build'
        });
      }

      let config = self.mdast.buildAPIConfig(finalAPI);
      let docSequence = self.mdast.buildDocConfig(finalDocs, repoName);

      config.docs = [];
      config.docSequence = docSequence;

      for (const doc in final) {
        if (final.hasOwnProperty(doc)) {
          config.docs.push(doc);
          //config.docsSequence[doc] = 0;
          self.writeDocSet(final[doc].docs, writeOptions);
        }
      }

      if (options.progress) {
        options.progress({
          total: 50,
          downloaded: 50,
          action: 'write'
        });
      }

      if (writeOptions.static) {
        self.writeConfig(autodocPath, config);
      }
      self.writeConfig(localAutodocPath, config);
      self.writeAPI(finalAPI, writeOptions);
      callback();
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
        local += this.writeDocSet(docs[i].fold, options);
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
      let pathStr = String(api[i].apiPath);
      let parts = pathStr.split('/');
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

      let items = [];
      function buildFolds(itm) {
        var str = mdast.stringify(itm);
        items.push(itm);
        for (let j = 0; j < itm.junk.length; ++j) {
          var junkie = mdast.stringify(itm.junk[j]);
          items.push(itm.junk[j]);
        }
        for (let j = 0; j < itm.fold.length; ++j) {
          buildFolds(itm.fold[j]);
        }
      }

      //if (i === 0) {
        buildFolds(api[i])
      //}

      for (let j = 1; j < items.length; ++j) {
        let item = items[j];
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
        fs.writeFileSync(`${tempDir}${path.sep}${file}.md`, basicText, 'utf-8');
        if (options.static) {
          fs.writeFileSync(`${dir}${path.sep}${file}.md`, basicText, 'utf-8');
        }
        if (detailText !== '') {
          fs.writeFileSync(`${tempDir}${path.sep}${file}.detail.md`, detailText, 'utf-8');
          if (options.static) {
            fs.writeFileSync(`${dir}${path.sep}${file}.detail.md`, detailText, 'utf-8');
          }
        }
      } catch(e) {
        throw new Error(e);
      }
    }
  },
}

module.exports = function (app) {
  markdownParser.app = app;
  return markdownParser;
};
