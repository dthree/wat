## .assign(target, sources...)

Used to copy the values of all enumerable own properties from one or more source objects to a target object. It will return the target object.

The `Object.assign()` method only copies *enumerable* and *own* properties from a source object to a target object. It uses `[[Get]]` on the source and `[[Put]]` on the target, so it will invoke getters and setters. Therefore it *assigns* properties versus just copying or defining new properties. This may make it unsuitable for merging new properties into a prototype if the merge sources contain getters. For copying property definitions, including their enumerability, into prototypes `Object.getOwnPropertyDescriptor()` and `Object.defineProperty()` should be used instead.

Both `String` and `Symbol` properties are copied.

In case of an error, for example if a property is non-writable, a `TypeError` will be raised, and the `target` object remains unchanged.

Note that `Object.assign()` does not throw on `null` or `undefined` source values.

```js
// Cloning an object
const obj = {a: 1};
const copy = Object.assign({}, obj);
console.log(copy); // {a: 1}
```
```js
// Merging objects
const o1 = { a: 1 };
const o2 = { b: 2 };
const o3 = { c: 3 };

const obj = Object.assign(o1, o2, o3);
console.log(obj); // { a: 1, b: 2, c: 3 }
console.log(o1);  // { a: 1, b: 2, c: 3 }, target object itself is changed.
```
```js
// Copying symbol-typed properties
var o1 = { a: 1 };
var o2 = { [Symbol('foo')]: 2 };

var obj = Object.assign({}, o1, o2);
console.log(obj); // { a: 1, [Symbol("foo")]: 2 }
```
```js
// Inherit properties and non-enumerable properties cannot be copied
var obj = Object.create({ foo: 1 }, { // foo is an inherit property.
  bar: {
    value: 2  // bar is a non-enumerable property.
  },
  baz: {
    value: 3,
    enumerable: true  // baz is an own enumerable property.
  }
});

var copy = Object.assign({}, obj);
console.log(copy); // { baz: 3 }
```
```js
// Primitives will be wrapped to objects
var v1 = '123';
var v2 = true;
var v3 = 10;
var v4 = Symbol('foo')

var obj = Object.assign({}, v1, null, v2, undefined, v3, v4); 
// Primitives will be wrapped, null and undefined will be ignored.
// Note, only string wrappers can have own enumerable properties.
console.log(obj); // { "0": "1", "1": "2", "2": "3" }
```
```js
// Exceptions will interrupt the ongoing copying task
var target = Object.defineProperty({}, 'foo', {
  value: 1,
  writeable: false
}); // target.foo is a read-only property

Object.assign(target, { bar: 2 }, { foo2: 3, foo: 3, foo3: 3 }, { baz: 4 });
// TypeError: "foo" is read-only
// The Exception is thrown when assigning target.foo

console.log(target.bar);  // 2, the first source was copied successfully.
console.log(target.foo2); // 3, the first property of the second source was copied successfully.
console.log(target.foo);  // 1, exception is thrown here.
console.log(target.foo3); // undefined, assign method has finished, foo3 will not be copied.
console.log(target.baz);  // undefined, the third source will not be copied either.
```
