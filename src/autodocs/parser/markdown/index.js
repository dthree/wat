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
    options = options || {};
    const self = this;
    const urls = options.urls;
    const lang = options.language || 'javascript';
    const isStatic = options.static || false;
    const aliases = options.aliases || [];
    const repoName = String(name).trim();
    const allNames = aliases;
    const results = {};
    const errors = [];
    const writeOptions = {static: isStatic};

    allNames.push(repoName);

    // Set appropriate parsing language.
    this.mdast.language(lang);

    const tree = {};
    const final = {};
    let finalAPI = [];
    let finalDocs = [];

    function traverse(node, pth) {
      pth = pth || '';
      for (const item in node) {
        if (node.hasOwnProperty(item)) {
          const fullPath = (pth !== '') ? `${pth}${path.sep}${item}` : String(item);
          if (_.isObject(node[item])) {
            traverse(node[item], fullPath);
          } else {
            tree[fullPath] = node[item];
          }
        }
      }
    }
    traverse(urls);

    let done = 0;
    const total = Object.keys(tree).length;
    function doneHandler() {
      done++;
      if (options.progress) {
        options.progress({
          total,
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
      });
    }

    for (const url in tree) {
      if (tree.hasOwnProperty(url)) {
        fetchOne(url, tree[url]);
      }
    }

    const autodocPath = `${self.app.clerk.paths.static.autodocs}${repoName}`;
    const localAutodocPath = `${self.app.clerk.paths.temp.autodocs}${repoName}`;
    try {
      if (writeOptions.static) {
        rimraf.sync(autodocPath);
      }
      rimraf.sync(localAutodocPath);
    } catch (e) {}

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
        if (results.hasOwnProperty(result)) {
          let md = results[result];
          md = self.mdast.stripHTML(md);

          let ast = self.mdast.parse(md);
          ast = self.mdast.sequenceAst(ast);
          const urls = self.mdast.getUrlsFromAst(ast);
          let headers = self.mdast.groupByHeaders(ast);
          const orphans = headers.orphans;

          const pathParts = String(result).split('/');
          const last = pathParts.pop();
          const resultRoot = (pathParts.length > 0) ? pathParts.join('/') : '';

          let api = self.mdast.filterAPINodes(headers, allNames);
          api = self.mdast.buildAPIPaths(api, repoName);

          // Make an index for that doc set.
          if (headers.length === 1) {
            headers[0].children = [{type: 'text', value: last, position: {}}];
          } else if (headers.length > 1) {
            headers = [{
              type: 'heading',
              ignore: true,
              depth: 1,
              children: [{type: 'text', value: last, position: {}}],
              position: {},
              fold: headers,
              junk: []
            }];
          }

          const docs = self.mdast.buildDocPaths(headers, `/autodocs/${repoName}/${resultRoot}`);

          finalAPI = finalAPI.concat(api);
          finalDocs = finalDocs.concat(docs);

          final[result] = {
            api,
            docs,
            orphans: orphans || [],
            headers,
            urls
          };
        }
      }

      if (options.progress) {
        options.progress({
          total: 50,
          downloaded: 50,
          action: 'build'
        });
      }

      const config = self.mdast.buildAPIConfig(finalAPI);
      const docSequence = self.mdast.buildDocConfig(finalDocs, repoName);

      config.docs = [];
      config.docSequence = docSequence;

      for (const doc in final) {
        if (final.hasOwnProperty(doc)) {
          config.docs.push(doc);
          self.writeDocSet(final[doc].docs, final[doc].orphans, writeOptions);
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
    } catch (e) {
      console.log(`\n\n${chalk.yellow(`  In building an autodoc, Wat couldn't write its config file.`)}\n`);
      throw new Error(e);
    }
  },

  writeDocSet(docs, orphans, options) {
    options = options || {};
    let result = '';

    let orphanString = '';
    for (let i = 0; i < orphans.length; ++i) {
      orphanString += `${mdast.stringify(orphans[i])}\n\n`;
    }

    for (let i = 0; i < docs.length; ++i) {
      let local = '';
      if (!docs[i].docPath) {
        continue;
      }

      const temp = this.app.clerk.paths.temp.root;
      const pth = String(docs[i].docPath);
      const parts = pth.split('/');
      const file = parts.pop();
      const directory = parts.join('/');
      const fileAddon = (docs[i].fold.length > 0) ? `/${file}` : '';
      const dir = path.join(__dirname, '/../..', directory);
      const tempDir = temp + directory;

      if (options.static) {
        util.mkdirSafe(dir + fileAddon);
      }
      util.mkdirSafe(tempDir + fileAddon);

      docs[i].junk = docs[i].junk || [];

      const fullPath = (docs[i].fold.length > 0) ?
        `/${file}/index.md` :
        `/${file}.md`;

      const header = (docs[i].ignore !== true) ? `${mdast.stringify(docs[i])}\n\n` : '';
      let allJunk = header;
      for (let j = 0; j < docs[i].junk.length; ++j) {
        allJunk += `${mdast.stringify(docs[i].junk[j])}\n\n`;
      }

      local += allJunk;

      if (docs[i].fold.length > 0) {
        local += this.writeDocSet(docs[i].fold, [], options);
      }

      local = orphanString + local;

      if (options.static) {
        fs.writeFileSync(dir + fullPath, local);
      }
      fs.writeFileSync(tempDir + fullPath, local);

      result += local;
    }
    return result;
  },

  writeAPI(api, options) {
    options = options || {};
    for (let i = 0; i < api.length; ++i) {
      if (!api[i].apiPath) {
        continue;
      }
      const temp = this.app.clerk.paths.temp.root;
      const pathStr = String(api[i].apiPath);
      const parts = pathStr.split('/');
      const file = parts.pop();
      const directory = parts.join('/');
      const dir = path.join(__dirname, '/../..', directory);
      const tempDir = temp + directory;

      if (options.static) {
        util.mkdirSafe(dir);
      }
      util.mkdirSafe(tempDir);

      let codeSampleFound = false;
      let basicText = `## ${api[i].formatted}\n\n`;
      let detailText = basicText;
      let lineX = 2;
      let lineXBasic = 2;

      const items = [];
      function buildFolds(itm) {
        items.push(itm);
        for (let j = 0; j < itm.junk.length; ++j) {
          items.push(itm.junk[j]);
        }
        for (let j = 0; j < itm.fold.length; ++j) {
          buildFolds(itm.fold[j]);
        }
      }

      buildFolds(api[i]);

      for (let j = 1; j < items.length; ++j) {
        const item = items[j];
        const lines = item.position.end.line - item.position.start.line + 1;
        const content = `${mdast.stringify(item)}\n\n`;
        const isCode = (item.type === 'code');
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
      } catch (e) {
        throw new Error(e);
      }
    }
  }
};

module.exports = function (app) {
  markdownParser.app = app;
  return markdownParser;
};
