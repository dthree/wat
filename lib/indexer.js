
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');
const walk = require('walk');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const indexer = {

  _index: void 0,

  _indexLastUpdate: void 0,

  _updateInterval: 60,

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

    const walker = walk.walk(path.normalize(__dirname + '/../docs'), {});
    
    walker.on('file', function(root, fileStats, next){
      const parts = String(path.normalize(root)).split('docs/');
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
    var result = fs.writeFileSync('index.json', JSON.stringify(json, null, ''));
    return result;
  },

  index() {
    if (!this._index) {
      let index = fs.readFileSync('./index.json', { encoding: 'utf-8'});
      let json = JSON.parse(index);
      this._index = json;
    }
    return this._index;
  },

  worker() {

    const self = indexer;

    let sinceUpdate;

    // If we can't read the file,
    // assume we just download it newly.
    try {
      const stats = fs.statSync('./index.json');
      sinceUpdate = Math.floor((new Date() - stats.mtime)/1000);
    } catch(e) {}

    console.log(sinceUpdate);

    if (sinceUpdate > self._updateInterval || !sinceUpdate) {
      console.log('update diff')
      let url = self.clerk.paths.remoteDocs + '../index.json';
      console.log(url)
      self.clerk.fetchRemote(url, function(err, data){
        if (!err) {
          let json = JSON.parse(data);
          self.write(json);
          console.log(json);
        } else {
          console.log('Error: ' + err);
        }
      })
      // now we load the index from the internet.
      //console.log('updating index');
    }


    //console.log('TIME SINCE LAST UPDATE:', diff);

  },

}

module.exports = indexer;




