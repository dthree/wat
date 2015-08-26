# Editing Guidelines

## Folder Structure

Wat documents are organized to as much as possible mirror the syntactic structure of a language or library. The root `/docs` folder has a folder for each language or library. Each `function`, `method` or `property` of that library has a corresponding markdown file. 

For example, to represent the cheat sheat for Javascript's `array.splice()` method, use this folder structure:

`./docs/js/array/splice.md`

For jQuery's `$(element).on('click')` method:

`./docs/jquery/on/click.md`

Wat is designed to help the user find these documents in the most intuitive way. Any of the below would work:

```text
? js array splice
? js array.splice();

? jquery on click
? jquery.on( 'click' )
```
If an item has child properties and so needs a folder but also deserves documentation in its own right, create a file named `index.md` in the root of its folder. For `jquery.on`, use:

`./docs/jquery/on/index.md`

## File Types

##### Basic: [item].md

Every `function`, `method` and `property` of a language or library should have its own markdown. As a general rule, these documents are *snippits* and should not exceed 24 lines. This matches the bottom line on terminal line heights: the user should not have to scroll his terminal to get the information needed.

##### Detail: [item].detail.md

If you want to add the full documentaiton on a given item or need to elaborate beyond 20 lines, make a second mardown file, such as `./docs/jquery/on/click.detail.md`. *Always* add a Basic markdown file first: if a Detail markdown file is available, Wat will inform the user and they can access it with the `--detail` flag.

`.detail.md` is your "man" page. Go nuts.

##### Install: [item].install.md

The root of a given language or library should optimally contain this file, which can be accessed through the `--install` flag. This contains the full installation instructions for that given library. For example, `Chalk` is a terminal styling library for Node. Chalk's root should look like this:

```text
./docs/chalk/index.md           # Basic description of Chalk
./docs/chalk/index.detail.md    # Detailed description of Chalk
./docs/chalk/index.install.md   # Installation instructions for Chalk
```
```text
$ wat chalk

  [ ... Chalk's basic description] 

? chalk --detail

  [ ... Chalk's detailed description] 

? chalk --install

  |  npm install chalk

?
```
## Naming Conventions

Regardless of the language or library's naming conventions, all folder and file names should be in camel case. The purpose of this is to give Wat a clean feel for the user and not distract them by attempts to remember proper casing.

The only permitted characters for all files and folders are alphanumeric. If you find yourself putting a `.`, it means you should probably make a folder instead.

### Markdown style

While languages differ and keeping perfect uniformity will not be possible, try to follow this guide as best as possible.

##### Header

Start off the markdown with an H2 header, and the `function`, `method` or `property` and its parameters.

For JS array.slice: 

```text
## .slice(begin[, end])
```

Optional parameters are covered in brackets. Limitless parameters would be shown like this:

```text
## .splice(start, deleteCount[, itemN...])
```

For `methods` and `properties`, the root object *instance* is implied. Do not use `array.splice()`. However, if referring to a `function` of the class itself and not an instance, include the capitalized full class name:

```text
## Array.of(element[, elementN...])
```

##### Description

Follow the header with a brief description of the function, if it is *helpful*. Remember, only show what most users want to see *in order to use the information right away*.

##### Code Samples

If possible, follow the description with code samples of the most common usages and "gothcas" of the given item, to the best of your knowledge. Remember to keep it under 24 lines, and preferably as short as possible.

Code samples should give a use of the item, and then a comment giving the result.

##### Complete Examples:

```text
## Array.of(element[, elementN...])

Returns an array from the passed in arguments.

``````js
const arr = Array.of(1, 2, 3); // [1, 2, 3]
const arr = Array.of(3);       // [3]
``````
```

```text
## Array.of(element[, elementN...])

Returns an array from the passed in arguments.

``````js
const arr = Array.of(1, 2, 3); // [1, 2, 3]
const arr = Array.of(3);       // [3]
``````
```

```text
## JSON.stringify(value[, replacer[, space]])

``````js
JSON.stringify({ x: 5 });                                        
// '{"x":5}'

JSON.stringify({ foo: 'bar', bar: 'foo'}, function(key, value){  
  return (key === 'bar') ? undefined : value;
});
// '{"foo":"bar"}'

JSON.stringify({x:5, y:7}, null, '\t');
// '{
//      "x": 5,
//      "y": 7
// }'
``````  
```

## Summary

That's all! Remember: these are the *community's* cheat sheets. These guidelines are not holy and can be improved. If you see a better way of doing something, make a suggestion.

Looking forward to your Pull Requests!

