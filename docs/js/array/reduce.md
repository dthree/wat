## .reduce(callback[, initialValue])

Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.

```js
const elements = ["abc", "def", 123, 456];
const result = elements.reduce(function(prev, curr){
  return prev + '::' + curr;
});
//  abc::def::123::456
```
```js
const elements = ["abc", "def", 123, 456];
const result = elements.reduce(function(prev, curr){
  return prev + '::' + curr;
}, 'foobar');
//  foobar::abc::def::123::456
```
