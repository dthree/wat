## .prototype

All objects in JavaScript are descended from `Object`; all objects inherit methods and properties from `Object.prototype`, although they may be overridden (except an `Object` with a `null` prototype, i.e. `Object.create(null)`). For example, other constructors' prototypes override the `constructor` property and provide their own `toString()` methods. Changes to the Object prototype object are propagated to all objects unless the properties and methods subject to those changes are overridden further along the prototype chain.

