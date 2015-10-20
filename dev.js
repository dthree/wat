#!/usr/bin/env node

'use strict';

var wat = require(".");
console.log('\n  You\'re now in document development mode.\n  You will be able to see your local document changes.\n');
wat.init({
  updateRemotely: false
});

