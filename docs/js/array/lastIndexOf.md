## .lastIndexOf(searchElement[, fromIndex])

Returns the index of the last occurrence of a specified value in an array.

```js
var arr = ['ab', 'cd', 'ef', 'ab', 'cd'];

arr.lastIndexOf("cd");      // 4
arr.lastIndexOf("cd", 2);   // 1
arr.lastIndexOf("gh");      // -1
arr.lastIndexOf("ab", -3);  // 0
```