## .sort(function)

Sorts an array.

```js
const numbers = [4, 11, 2, 10, 3, 1];
const sorted = numbers.sort();
// [1, 2, 3, 4, 10, 11]
```        

```js
const numbers = [4, 11, 2, 10, 3, 1];
const sorted = numbers.sort(function(first, second){
  const order = (first === second) ? 0 
    : (first < second) ? -1
    : 1;
  return order;
  )
});
// [1, 2, 3, 4, 10, 11]
