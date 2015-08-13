
"use strict";

/**
 * Module dependencies.
 */

const _ = require('lodash');
const walk = require('walk');
const fs = require('fs');
const path = require('path');

module.exports = {

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
        let item = String(arr.shift()).toLowerCase();
        if (item.indexOf('.md') > -1) {
          let split = item.split('.');
          split.pop();
          let filename = split.join('.');
          idx[filename] = true;
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
  }

}




var index = {
  'js': {
    'array': true  
  }
}