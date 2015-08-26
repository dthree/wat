## .indexOf(searchElement[, fromIndex])

Returns the index of the first occurrence of a value in an array.

```js
var arr = ["ab", "cd", "ef", "ab", "cd"];

arr.indexOf('cd');      // 1
arr.indexOf('cd', 2);   // 4
arr.indexOf('gh');      // -1
arr.indexOf('ab', -2);  // 3
```