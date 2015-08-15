## Array.slice([begin[, end]])

```js
let arr = ['a', 'b', 'c', 'd', 'e'];

// Slicing an Array returns a value,
// but does not modify the array.
arr.slice(0, 2);       // ['a', 'b']
arr.slice(2);          // ['c', 'd', 'e']

arr = arr.slice(3, 4); 
console.log(arr);      // ['d']
```  
             