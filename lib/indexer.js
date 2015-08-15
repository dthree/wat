
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');
const walk = require('walk');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const chalk = require('chalk')

const indexer = {

  _index: void 0,

  _indexLastUpdate: void 0,

  _updateInterval: 10,

  init(options) {
    options = options || {}
    if (options.clerk) {
      this.clerk = options.clerk;
    }
    setInterval(this.worker, 5000);
    this.worker();
  },

  build(callback) {
    callback = callback || {}
    let index = {}

    const walker = walk.walk(path.normalize(__dirname + '/../docs/'), {});
    
    walker.on('file', function(root, fileStats, next){

      const parts = String(path.normalize(root)).split('docs/');
      if (parts[1] === undefined) {
        console.log('Invalid path passed into wat.indexer.build: ' + root);
        next();
        return;
      }

      if (String(fileStats.name).indexOf('.json') > -1) {
        next();
        return;
      }

      const file = parts[1];
      const dirs = String(path.normalize(file)).split('/');
      dirs.push(fileStats.name);
      let remainder = _.clone(dirs);


      function build(idx, arr) {
        let item = String(arr.shift());
        if (item.indexOf('.md') > -1) {
          let split = item.split('.');
          split.pop();
          let last = split[split.length - 1];
          let special = (split.length > 1 && ['install', 'detail'].indexOf(last) > -1);
          if (special) {
            split.pop();
          }
          let type = (special) ? last : 'basic';
          
          let filename = split.join('.');
          idx[filename] = idx[filename] || {}
          idx[filename]['__' + type] = fileStats.mtime;
        } else {
          idx[item] = idx[item] || {}
        }
        if (arr.length > 0) {
          idx[item] = build(idx[item], arr);
        } 
        return idx;
      }

      index = build(index, remainder);
      next();
    });

    walker.on('errors', function(root, nodeStatsArray, next){
      console.log(root, nodeStatsArray)
      throw new Error(root);
    });

    walker.on('end', function(){
      callback(index);
    });
  },

  write(json) {
    console.log('Writing config to disk.');
    let index = JSON.stringify(json, null, '');
    let result = fs.writeFileSync('./docs/index.json', JSON.stringify(json, null, ''));
    this._index = json;
    this.clerk.config.setLocal("docIndexLastWrite", new Date());
    this.clerk.config.setLocal("docIndexSize", String(index).length);
    return result;
  },

  index() {
    if (!this._index) {
      let index = fs.readFileSync('./docs/index.json', { encoding: 'utf-8'});
      let json = JSON.parse(index);
      this._index = json;
    }
    return this._index;
  },

  getRemoteIndex(callback) {
    const self = this;
    self.clerk.fetchRemote(self.clerk.paths.remoteDocUrl + 'index.json', function(err, data) {
      if (!err) {
        try {
          let json = JSON.parse(data);
          callback(void 0, json);
        } catch(e) {
          callback("Error parsing remote index json: " + data + ", Error: " + e + ", url: " + url);
        }
      } else {
        callback(err);
      }
    });
  },

  worker() {

    console.log('Firing worker:');

    const self = indexer;

    let sinceUpdate;

    // If we can't read the file,
    // assume we just download it newly.
    try {
      const stats = fs.statSync('./docs/index.json');
      sinceUpdate = Math.floor((new Date() - stats.mtime)/1000);
    } catch(e) {}

    if (sinceUpdate > self._updateInterval || !sinceUpdate) {
      console.log('Haven\'t checked for updates in a while. Reading remote config:');
      self.clerk.config.getRemote(function(err, remote){
        if (!err) {
          console.log('Ok we have remote config: ', remote);
          let local = self.clerk.config.getLocal();
          console.log('Ok we local config: ', local);

          let localSize = parseFloat(local.docIndexSize || 0);
          let remoteSize = parseFloat(remote.docIndexSize || -1);

          if (localSize !== remoteSize) {
            self.getRemoteIndex(function(err, index) {
              if (err) {
                console.log(err);
              } else {
                self.write(index);
              }
            });
          }

        } else {
          if (String(err).indexOf('Not Found') > -1) {
            console.log('Error loading remote config: ' + err);
            let error = chalk.yellow('\nWat could not locate ' + 
              'the remote config directory and so does not ' + 
              'know where to pull docs from.\nRe-installing ' + 
              'your instance of Wat through NPM should ' + 
              'solve this problem.\n\n') + 
              'Url Attempted: ' + self.clerk.paths.remoteConfigUrl;
            throw new Error(error);
          } else {
            console.log('Error loading remote config: ' + err);
          }
        }
      });
    }

  },

}

module.exports = indexer;




