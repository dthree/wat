# Contributing to Wat Docs

Wat is aiming to become a reliable, central source for API and usage snippits for all major libraries across all languages. Your contributions help make that happen and are very welcome.

### Step 1: Fork

Fork the project [on GitHub](https://github.com/dthree/wat).

```text
$ git clone git@github.com:username/wat.git
$ cd wat
$ git remote add upstream git://github.com/dthree/wat.git
```

### Step 2: Adding / editing content

Add your content! Ensure you follow the [editing guidelines](https://github.com/dthree/wat/blob/master/editing.md).

### Step 3: Rebuild

Wat uses an index file that keeps data on all of its documents. When you have finished editing and are ready to push your changes, you'll need to rebuild the index.

```bash
$ npm install -g gulp
$ gulp index
```
This action will also "lint" all of the document content and ensure it meets standards. Correct anything it notes and run `gulp` again until it passes.

### Step 4: Commit

Make sure git knows your name and email address:

```text
$ git config --global user.name "Jhonny Octocat"
$ git config --global user.email "joctocat@gmail.com"
```

```
$ git add .
$ git commit -m "your commit message"
```

### Step 5: Rebase

Use `git rebase` (not `git merge`) to sync your work from time to time.

```text
$ git fetch upstream
$ git rebase upstream/master
```

### Step 6: Push

```text
git push
```

Go to your fork on Github. Click the 'Pull Request' button and fill out the form.

### Step 7: Show off your docs

[![Wat: Cheat Sheeted](https://img.shields.io/badge/wat-cheat%20sheeted-blue.svg)](https://github.com/dthree/wat)

Made your project more accessible by contributing to Wat? 

Show it off by copying the badge below into your README.md.

```
[![Wat: Cheat Sheeted](https://img.shields.io/badge/wat-cheat%20sheeted-blue.svg)](https://github.com/dthree/wat)
```
