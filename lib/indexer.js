
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

  _updateInterval: 3600,

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
          let type = (special) ? last : 'index';
          
          let filename = split.join('.');
          idx[filename] = idx[filename] || {}
          idx[filename][type] = true;
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
    var result = fs.writeFileSync('index.json', JSON.stringify(json, null, '  '));
    return result;
  },

  index() {

    var last = this._indexLastUpdate;

    var diff = moment().diff(last || moment('1970-01-01'))/1000;

    if (diff > this._updateInterval) {
      // now we load the index from the internet.
      //console.log('updating index');
    }

    if (!this._index) {
      this._index = require('./../index.json');
    }

    return this._index;

    console.log('TIME SINCE LAST UPDATE:', diff);

  },

}

module.exports = indexer;




var index = {
  'js': {
    'array': true  
  }
}