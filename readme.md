# Wat

> Your syntax nightmares are over.

Finally, community-built cheat sheets for every coder, in every language and major framework. At the tip of your fingers.

Wat is an interactive app built to drastically reduce time spent searching for syntax and code usage questions. If you forgot how to write a CSS transition, simply type `css transition`. Wat finds what you want, providing exactly and only what you need: a basic description and usage samples.

Wat was designed for ease. It takes you:

- [60 seconds to install](#install)
- [5 minutes to master](#learn)
- [15 minutes to contribute](#contribute)

## Contents

- [Introduction](#introduction)
- [Install](#install)
- [Learn](#learn)
- [Contribute](#contribute)
- [What's on Wat](#projects-now-documented-on-wat)
- [FAQ](#faq)
- [License](#license)

Made with :heart: and a little [secret sauce](https://github.com/dthree/vorpal).

## Introduction

#### Wat is nearing its launch, and you can help

##### Feel free to install and try Wat out. Wanted are suggestions on how to make Wat even more ridiculously easy to use and insanely helpful. All document contributions are welcome as well!

#### 1.0 targets:

##### To do

- At least 20 complete libraries or languages documented. (4 done)
- Tour
- Tests.
- XO linting.
- *Suggestions? Wat is for you, and must be uncomprimisingly amazing.*

##### Done

- <s>Search commands implemented.</s>
- <s>Preference commands implemented (syntax highlighting flavor, etc.).</s>
- <s>Finish readme / editing guidelines</s>.
- <s>Refactor Vorpal dependency to Vantage.</s>
- <s>Change temp directory for all persistent local storage and configurations.</s>
- <s>Babel transpiling.</s>
- <s>Pass args into initial app call (i.e. make `$ wat js array splice` start up the application and return the results.)</s>
- <s>Graceful exiting with CONTROL + C.</s>

---

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

> JS

##### Node.js Frameworks

> [Chalk](https://github.com/sindresorhus/chalk), [Robot JS](https://github.com/octalmage/robotjs), [Vantage](https://github.com/dthree/vantage), [Vorpal](https://github.com/dthree/vorpal)

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

- [Mac Install](https://nodejs.org/dist/v0.12.7/node-v0.12.7.pkg)
- [Linux Install](https://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz): [64 bit](https://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x64.tar.gz), [32 bit](https://nodejs.org/dist/v0.12.7/node-v0.12.7-linux-x86.tar.gz)
- [Windows Install](https://nodejs.org/dist/v0.12.7/x64/node-v0.12.7-x64.msi): [64 bit](https://nodejs.org/dist/v0.12.7/x64/node-v0.12.7-x64.msi), [32 bit](https://nodejs.org/dist/v0.12.7/node-v0.12.7-x86.msi)

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