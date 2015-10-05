'use strict';

/**
 * Module dependencies.
 */

const rimraf = require('rimraf');
const _ = require('lodash');
const chalk = require('chalk');

const parsers = {};

const autodocs = {

  run(name, options, callback) {
    const self = this;
    const config = self.app.clerk.autodocs.config();
    const lib = String(name).trim();
    let libs = [];
    options = options || {}
    options.rebuild = options.rebuild || true;
    options.loader = options.loader || function () {};
    options.done = options.done || function () {};
    
    const progress = function (data) {
      options.loader(self.drawLoader(data.downloaded, data.total, data.action));
    };

    if (!config) {
      options.done(`Wat had trouble reading "./config/config.auto.json".`);
      return;
    }
    
    if (lib === 'all') {
      libs = Object.keys(config);
    } else {
      if (!config[lib]) {
        options.done(`${lib} is not on Wat's list of auto-updating libraries.\n  To include it, add it to ./config/config.auto.json and submit a PR.`);
        return;
      }
      libs.push(lib);
    }

    function runSingleLibrary(libName) {
      const data = config[libName];
      data.urls = data.urls || [];
      data.language = data.language || 'javascript';
      data.parser = data.parser || 'readme';

      if (!libName) {
        options.done('${libName} is not a valid autodoc library name.');
        return;
      }

      // Load the appropriate parser.
      const parser = parsers[data.parser];
      if (parsers[data.parser] === undefined) {
        options.done(`${libName} has an invalid autodoc parser: ${data.parser}.`);
        return;
      }

      const opt = {
        urls: data.urls,
        language: data.language,
        aliases: data.aliases,
        parser: data.parser,
        static: data.static,
        crawl: false,
        progress: progress
      };

      progress({action: 'fetch', total: 50, downloaded: 0});
      let result = parser.run(libName, opt, function (err, data) {
        if (libs.length < 1) {
          if (options.rebuild) {
            progress({action: 'index', total: 50, downloaded: 50});
            self.app.clerk.indexer.build(function (index, localIndex){
              self.app.clerk.indexer.write(index, localIndex);
              progress({action: 'done', total: 50, downloaded: 50});
              self.app.vorpal.emit('wat_library_build', {name: libName});
              options.done();
            });
          } else {
            options.done();
          }
        } else {
          runSingleLibrary(libs.shift());
        }
      });
    }

    runSingleLibrary(libs.shift());
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
      self.app.clerk.indexer.build(function (index, localIndex){
        self.app.clerk.indexer.write(index, localIndex);
        callback();
      });
    } else {
      callback();
    }
  },

  deleteAll(options, callback) {
    const self = this;
    const config = this.app.clerk.autodocs.config();
    const index = this.app.clerk.indexer.index();
    options = options || {}

    if (config === undefined) {
      callback(`\n  Trouble reading autodoc config.\n`);
      return;
    }

    // Whip up all built autodoc libs.
    const names = [];
    for (const name in config) {
      if (config[name].static === false) {
        if (index[name] && index[name].__class === 'lib') {
          names.push(name);
        }
      }
    }

    // Uh... what's the point.
    if (names.length < 1) {
      callback();
      return;
    }

    // Handler is called on each delete.
    // When all libs are deleted, we build the
    // index again and callback.
    const total = names.length;
    let done = 0;
    function handler() {
      done++;
      if (done === total) {
        self.app.clerk.indexer.build(function (index, localIndex) {
          self.app.clerk.indexer.write(index, localIndex);
          callback();
        });
      } else {
        go();
      }
    }

    function go() {
      if (names.length > 0) {
        const name = names.shift();
        if (options.progress) {
          options.progress(name);
        }
        self.delete(name, {rebuild: false}, handler);
      } else {
        handler();
      }
    }

    go();
  },

  drawLoader(done, total, action) {
    // Add time on to the end of the
    // loader to compensate for building.
    const doneString = done;
    let multiple = .55;
    if (action === 'parse') {
      multiple = .60;
    } else if (action === 'build') {
      multiple = .65;
    } else if (action === 'write') {
      multiple = .70;
    } else if (action === 'index') {
      multiple = .75;
    } else if (action === 'done') {
      multiple = .80;
    }
    done = Math.floor(done * multiple);
    done = (done < 0) ? 0 : done;
    let width = 40;
    let donesPerBar = total / width;
    let bars = Math.floor(donesPerBar * done);
    let loader = '';
    for (let i = 0; i < width; ++i) {
      if (i <= done) {
        loader += chalk.bgGreen(' ');
      } else {
        loader += chalk.bgWhite(' ');
      }
    }
    let buildStr;
    if (total === 100) {
      buildStr = `Preparing...`;
    } else if (action === 'fetch') {
      if (doneString === 0) {
        buildStr = `Fetching docs...`;
      } else {
        buildStr = `Fetching ${doneString} of ${total} docs...`;
      }
    } else if (['parse', 'build'].indexOf(action) > -1) {
      buildStr = `Housekeeping...`;
    } else if (['write', 'index', 'done'].indexOf(action) > -1) {
      buildStr = `Feng shui...`;
    }
    buildStr = chalk.grey(buildStr);
    const result = `\n  ${buildStr}\n\n  ${loader}\n`;
    return result;
  }


};

module.exports = function (app) {
  parsers.markdown = require('./parser/markdown/index')(app);
  autodocs.app = app;
  return autodocs;
};
