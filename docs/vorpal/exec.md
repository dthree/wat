## .exec(command[, callback])

Executes an API command string. Returns a callback or Promise.

```js
// Using Promises:
vorpal.exec("prepare pizza").then(function(data){
  return vorpal.exec("bake pizza");
}).then(function(){
  app.deliver();
}).catch(function(err){
  console.log("Error baking pizza: " + err);
  app.orderOut();
});

// Using callbacks:
vorpal.exec("prepare pizza", function(err, data) {
  if (!err) {
    vorpal.exec("bake pizza", function(err, pizza){
      if (!err) {
        app.eat(pizza);
      }
    });
  }
});
```