## .valueOf()

Returns the primitive value of the specified object.

```js
const arr = [1, 2, 3];
const s = arr.valueOf();

if (arr === s) {
  return true;
}

// returns `true`
```        