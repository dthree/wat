# Contributing to Wat Docs

Wat is aiming to become a reliable, central source for API and usage snippits for all major libraries across all languages. Your contributions help make that happen and are very welcome.

### Step 1: Fork

Fork the project [on GitHub](https://github.com/dthree/wat) then check out your copy locally.

```text
$ git clone git@github.com:username/wat.git
$ cd wat
$ git remote add upstream git://github.com/dthree/wat.git
```

### Step 2: Adding / editing content

All editing is done in the `./docs/` folder of the project root. 

Please refer to the [editing guidelines](https://github.com/dthree/wat/blob/master/editing.md) on how to place and structure content.

### Step 3: Rebuild

Wat uses an index file that keeps data on all of its documents. When you have finished editing and are ready to push your changes, you'll need to rebuild the index.

```bash
$ npm install -g gulp
$ gulp
```
This action will also "lint" all of the document content and ensure it meets standards. Correct anything it notes and run `gulp` again until it passes.

### Step 4: Commit

Make sure git knows your name and email address:

```text
$ git config --global user.name "Jhonny Octocat"
$ git config --global user.email "joctocat@gmail.com"
```

### Step 5: Rebase
