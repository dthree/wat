## Array.from(arrayLike[, mapFn[, thisArg]])

Returns an array from an array-like or iterable object.

The following example returns an array from a collection of DOM element nodes.

```js
const elements = Array.from(document.querySelectorAll('*'));
const element = elements[0];
```js

The following example returns an array of characters.

```js
const arr = Array.from('abc'); // ['a', 'b', 'c'];
```
The following example returns an array of objects contained in the collection.

```js
const set = new Set('a', 'b', 'c');
const arr = Array.from(set); // arr[1] == 'b'; 
```
The following example shows the use of arrow syntax and a mapping function to change the value of elements.

``` js
const arr = Array.from([1, 2, 3], x => x * 10);
// arr[0] == 10;
// arr[1] == 20;
// arr[2] == 30;
```
