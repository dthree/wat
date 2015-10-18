'use strict';

var chalk = require('chalk');

module.exports = function (tour, app) {
  var start1 = '\nWelcome to Wat. Let\'s look up how to use Javascript\'s "array.slice()" method.\n\nType "' + chalk.white('js array slice') + '" and press ' + chalk.white('[enter]') + '.\n\n(You can exit using ' + chalk.white('[control] + c') + ' at any time.)\n';
  var end1 = '\nThis pulled up a rapid description of the ".slice" command, and a usage example.\nThis is the hallmark of wat - just the data you need, and nothing more.\n';
  var start2 = '\nNow, let\'s see what content wat has. Press ' + chalk.white('[tab]') + ' twice.\n';
  var end2 = '\nThis shows a list of all of wat\'s currently supported libraries.\n\nThe bolded libraries are already built, while the faded ones can be automatically generated.\n';
  var start3 = '\nLet\'s generate "chalk", a Node.js module for coloring strings. Type "' + chalk.white('cha') + '", and then hit ' + chalk.white('[tab]') + ' twice. Then follow the instructions.\n';
  var end4 = '\nNice. That last tab you did shows what\'s in Chalk. The green items are methods, blue are properties, and the rest are docs, such as Chalk\'s readme on Github.\n';
  var start5 = '\nTake a look at what\'s in "stripColor". You\'ve typed half of it already.\n';
  var end5 = '\nThe data you see here was automatically parsed from Chalk\'s readme when you downloaded it a second ago.\n';
  var start6 = '\nThe tab key is your friend. Type "' + chalk.white('chalk readme') + '" and then hit ' + chalk.white('[tab]') + ' twice. You\'ll now see the main sections of Chalk\'s readme.\n\nFind and pull up the "Why" section of Chalk\'s readme.\n';
  var start7 = '\nYou can also view the full readme. Run "' + chalk.white('chalk readme') + '"\n\nNote: As the readme is longer than your screen, wat is going to throw you into a "less" (linux) command automatically. If you are unfamiliar with how to use less, type "' + chalk.white('h') + '" as soon as the readme pulls up.\n\nWhen you\'re done viewing the readme, press "' + chalk.white('q') + '" to quit less.\n';
  var start8 = '\nOkay. Let\'s see what a really big library looks like.\n\nDownload "node" using your tab keys, or by typing "' + chalk.white('node') + '" and pressing ' + chalk.white('[enter]') + '.\n';
  var start9 = '\nNice. Now press ' + chalk.white('[tab]') + ' twice to see Node\'s contents.\n';
  var end9 = '\nBecause Node\'s API is so large, wat broke it into digestible chunks.\n';
  var start10 = '\nUse the tab key to look into the "os" (Operating System) object and find a method that has to do with what platform you are running. Run that command.\n';
  var start11 = '\nDon\'t worry, you don\'t have to type a million words to pull up a command. If you type part of a command, wat will pull up the best results.\n\nType "' + chalk.white('slice') + '" and press ' + chalk.white('[enter]') + '. You\'ll be prompted to choose between two matches. Pull up the Javascript one.\n';
  var start12 = '\nUm... what if you downloaded a library you don\'t use and you don\'t want it polluting your search results?.\n\nType "' + chalk.white('delete node') + '" to forever banish it.\n';
  var start13 = '\nIt\'s gone. Now run "' + chalk.white('slice') + '" again. It should pull up the best result with no questions asked.\n';
  var start14 = '\nBy the way, did you notice the syntax highlighting on the code samples? If you don\'t like the color theme, you can pick your own!\n\nRun "' + chalk.white('theme') + '" to see what\'s available.\n';
  var start15 = '\nPick one that looks interesting, and then run "' + chalk.white('theme <name>') + '". \n';
  var end15 = '\nDid you know you can publish your own themes? If you\'re interested, check the out "Creating Themes" page on Wat\'s Github Wiki.\n';
  var start16 = '\nWat can also search Stack Overflow. Run "' + chalk.white('stackoverflow js splice an array') + '".\n';
  var end16 = '\n"stackoverflow" is a really long word. You can also run it with "' + chalk.white('so ...') + '" or "' + chalk.white('stack ...') + '".\n\nAdditionally, if you\'re feeling --lucky, add "' + chalk.white('-l') + '" to your search to automatically pick the first result.\n';
  var start17 = '\nWant to read a project\'s readme that isn\'t on Wat yet? You can pull up any Github repo\'s readme.\n\nRun "' + chalk.white('github dthree wat') + '" and pull up Wat\'s readme.\n';
  var end17 = '\nYou can also run this with "' + chalk.white('gh ...') + '" or "' + chalk.white('readme ...') + '".\n';
  var start18 = '\nWat can also grep things! Let\'s have some fun:\n\nRun "' + chalk.white('gh awesome node -l | grep simple | less') + '" to find some simply awesome things.\n';
  var end18 = '\nYou can grep any content in Wat: wikis, readmes, Stack Overflow, you name it.\n';
  var conclusion = '\nThat concludes the tour!\n\nIf you like Wat, help spread the word! And remember, contributing is ridiculously easy.\nIf you want to add content, check out the Wiki to get started.\n\nOver to you!\n';

  tour.color('cyan');

  tour.prepare(function (cb) {
    this._tabs = 0;
    this._tabs2 = 0;
    app.autodocs['delete']('chalk', { rebuild: true }, function () {
      app.autodocs['delete']('node', { rebuild: true }, function () {
        cb();
      });
    });
  });

  tour.step(1).begin(start1).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf('slice') > -1);
  }).reject('Err.. wrong command.').wait(1000).end(end1);

  tour.step(2).begin(start2).expect("keypress", function (data, cb) {
    this._tabs = this._tabs || 0;
    this._tabs = data.key === 'tab' ? this._tabs + 1 : 0;
    cb(this._tabs === 2);
  }).wait(1000).end(end2);

  tour.step(3).begin(start3).expect("wat_library_build", function (data, cb) {
    cb(data.name === 'chalk');
  }).reject('Er.. wrong library.');

  tour.step(4).expect("keypress", function (data, cb) {
    cb(data.key === "tab");
  }).wait(1000).end(end4);

  tour.step(5).begin(start5).expect("command", function (data, cb) {
    cb(data.command.toLowerCase().indexOf('strip') > -1);
  }).wait(1000).end(end5);

  tour.step(6).begin(start6).wait(1000).expect("command", function (data, cb) {
    cb(data.command.toLowerCase().indexOf('why') > -1);
  });

  tour.step(7).begin(start7).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf('readme') > -1);
  }).wait(1000);

  tour.step(8).begin(start8).expect("wat_library_build", function (data, cb) {
    cb(data.name === 'node');
  }).reject('Er.. wrong library.');

  tour.step(9).end(start9).expect("keypress", function (data, cb) {
    this._tabs2 = this._tabs2 || 0;
    this._tabs2 = data.key === 'tab' ? this._tabs2 + 1 : 0;
    cb(this._tabs2 > 0);
  }).wait(1000).end(end9);

  tour.step(10).begin(start10).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("platform") > -1);
  }).wait(1000);

  tour.step(11).begin(start11).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("slice") > -1);
  }).wait(1000);

  tour.step(12).begin(start12).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("delete") > -1);
  }).wait(500);

  tour.step(13).begin(start13).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("slice") > -1);
  }).wait(1000);

  tour.step(14).begin(start14).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("theme") > -1);
  }).wait(1000);

  tour.step(15).begin(start15).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("theme ") > -1);
  }).wait(1000).end(end15);

  tour.step(16).begin(start16).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("stackoverflow") > -1);
  }).wait(1000).end(end16);

  tour.step(17).begin(start17).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("dthree wat") > -1);
  }).wait(1000).end(end17);

  tour.step(18).begin(start18).expect("command", function (data, cb) {
    cb(String(data.command).toLowerCase().indexOf("awesome") > -1);
  }).wait(1000).end(end18);

  tour.end(conclusion);

  return tour;
};