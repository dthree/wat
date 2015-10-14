# Wat

[![Build Status](https://travis-ci.org/dthree/wat.svg)](https://travis-ci.org/dthree/wat) [![Build Status](https://img.shields.io/badge/gitter-join%20chat-brightgreen.svg)](https://gitter.im/dthree/wat?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) [![NPM Version](https://img.shields.io/npm/v/wat.svg)](https://www.npmjs.com/package/wat)
[![Coverage Status](https://coveralls.io/repos/dthree/wat/badge.svg?branch=master&service=github)](https://coveralls.io/github/dthree/wat?branch=master)

> Real World Practicality meets Documentation. Wat.

Finally, community-built cheat sheets for every coder, targeting any framework, in any language. At the tip of your fingers.

Wat is an interactive app built to drastically reduce time spent searching for syntax and code usage questions. Wat aggregates project APIs, readmes, code snippits, usage samples and practical documentation across any language or libary, and makes this data ridiculously accessible from a single, instant source.

Wat was designed for ease. It takes you:

- [20 seconds to install](#install)
- [5 minutes to master](#learn)
- [15 minutes to contribute](#contribute)

#### I am currently looking for beta testers: if you want to help, simply run the following and follow the guides. Your suggestions now will greatly help influence the upcoming published product!

```js
$ npm install wat -g
$ wat tour
```

## Contents

- [Introduction](#introduction)
- [Install](#install)
- [Learn](#learn)
- [Contribute](#contribute)
- [What's on Wat](#projects-now-documented-on-wat)
- [FAQ](#faq)
- [License](#license)

Made by [dthree](https://github.com/dthree) with :heart: and a little [secret sauce](https://github.com/dthree/vorpal).

## Introduction

#### Wat is nearing its launch, and you can help.

##### Wat's tour is now available!

```bash
$ npm install -g wat
$ wat tour
```

##### Feel free to take the tour! All feedback and contributions welcome.

#### 1.0 targets:

##### To do

- Manual-generated libraries completed: JS, HTML, CSS
- Github web search.
- Spiffy GIF
- Finish Tests.
- *Suggestions? Wat is for you, and must be uncomprimisingly amazing.*

##### Done

- <s>Stack Overflow web search.</s>
- <s>Tour</s>
- <s>Automatic doc scaffolding</s>
- <s>Auto-doc config and refactor.</s>
- <s>XO linting.</s>
- <s>Search commands implemented.</s>
- <s>Preference commands implemented (syntax highlighting flavor, etc.).</s>
- <s>Finish readme / editing guidelines</s>.
- <s>Refactor Vorpal dependency to Vantage.</s>
- <s>Change temp directory for all persistent local storage and configurations.</s>
- <s>Babel transpiling.</s>
- <s>Pass args into initial app call (i.e. make `$ wat js array splice` start up the application and return the results.)</s>
- <s>Graceful exiting with CONTROL + C.</s>

#### Wat covers everything

Wat provides the only centralized source of syntax cheat sheets for every language and every major framework and library. If it has an API and is used by the community, it's supported here; be it [jQuery](https://jquery.com), [Go](https://golang.org/), [React](http://facebook.github.io/react/), [Dragula](https://github.com/bevacqua/dragula) or [Rails](http://rubyonrails.org/).

#### It's smart

Wat combines a document index, edit-distance algorithms, tabbed auto-completion and common sense to make sure you get what you asked for. It auto-updates when the community adds content, and optimizes its performance based on the content you use most.

#### Wat shreds red tape like a frisky cat

Wat's content is not perfect, it isn't formal and it isn't pedantic. Wat doesn't aim to provide letter-perfect, offical documentation for languages. Work like that [is in good hands](https://developer.mozilla.org/en-US/).

If you're building a web browser, refer to [W3C](http://www.w3.org/) for specifications. Wat is targeted for the 99.99% of us who have the basic familiarity with a Library and simply need to look up API or usage samples. 

## Install

```bash
npm install -g wat
```
[np-what? Oh, isn't that Node? I don't do Node.](#sorry-i-dont-speak-node)

## Learn

```bash
wat tour
```
## Contribute

> Help the community and submit a pull request within 15 minutes.

If you understand Markdown and are familiar with a language or library, you can contribute!

1. Pick your favorite library.

2. Read the [editing guidelines](https://github.com/dthree/wat/blob/master/editing.md).

3. Read the [contribution guidelines](https://github.com/dthree/wat/blob/master/contributing.md).

4. Start!

Love Wat? Help spread the word. Every contribution helps the community even more.

## Projects now documented on Wat

##### Languages

> JS (some of it), Node

##### Javascript Libraries

> [D3](https://github.com/mbostock/d3)

##### Node.js Libraries

> [Chalk](https://github.com/sindresorhus/chalk), [debug](https://github.com/visionmedia/debug), [download](https://github.com/kevva/download), [got](https://github.com/sindresorhus/got), [MDAST](https://github.com/wooorm/mdast), [mkdirp](https://github.com/substack/node-mkdirp), [Node HTTP Proxy](https://github.com/nodejitsu/node-http-proxy), [Node Inspector](https://github.com/node-inspector/node-inspector), [Pageres](https://github.com/sindresorhus/pageres), [request](https://github.com/request/request), [RobotJS](https://github.com/octalmage/robotjs), [Screenful](https://github.com/sindresorhus/screenful), [Vantage](https://github.com/dthree/vantage), [Vorpal](https://github.com/dthree/vorpal)

## FAQ

- [Why Wat?](#why)
- [Sorry, I don't speak Node](#why)
- [How does Wat relate to Dash?](#how-does-wat-relate-to-dash)

#### Why Wat?

Because **wat** is forgetting the syntax to splice an Array for the 10th time.

Because **wat** is having to search `js splice an array`, sift through [W3Schools](http://www.w3fools.com/) and [MSDN](https://msdn.microsoft.com/en-US/) results, `Command + Click` three [Stack Overflow](http://stackoverflow.com/) tabs, close the first one, digest the second and then scroll to the answer to remember... again.

Because I would rather just type:

`wat js array splice`

#### Sorry, I don't speak Node

Don't worry, it's not a problem:

You're using a web browser, right? Web browsers interpret Javascript on the Internet. 

Similarly, Node interprets Javascript everywhere else. You don't have to write JS to use Node.

Installation is easy and you won't regret it: there's hundreds of incredible apps you'll be able to take advantage of.

Node installation links:

- [Mac Install](https://nodejs.org/dist/v4.2.1/node-v4.2.1.pkg)
- [Linux Install](https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-x64.tar.gz): [64 bit](https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-x64.tar.gz), [32 bit](https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-x86.tar.gz)
- [Windows Install](https://nodejs.org/dist/v4.2.1/node-v4.2.1-x64.msi): [64 bit](https://nodejs.org/dist/v4.2.1/node-v4.2.1-x64.msi), [32 bit](https://nodejs.org/dist/v4.2.1/node-v4.2.1-x86.msi)

Once installed, open a terminal and type:

```bash
npm install --global wat
```

This automatically installs it and makes the command `wat` recognized globally by your computer, so you just run `wat` in your terminal. 

Easy, right? And you're still a proud `[insert language here...]` developer.

[You're ready to use it!](#learn)

#### How does Wat relate to Dash?

[Dash](https://kapeli.com/dash) is extraordinarily well put together API Documentation Browser and Code Snippet Manager for OSX and iOS. It stores snippets of code and instantly searches offline documentation sets for 150+ APIs. 

Dash is a desktop application, and is more focused on centralizing official docs in addition to its cheat sheets. Wat is a command-line-based application and is more targeted at centralizing smaller libraries across all languages.

Whichever your preference, Dash and Wat intend to work together to cover all bases with the common purpose of giving you fast-as-possible reference to the code you use.

## License

MIT
