## .listen(app\[, options or callback\]\[, callback\])

Starts Vantage as a server. 

```js
// Standalone
vantage.listen(80, function(socket){
  this.log("Accepted a connection.")
});

// With Koa
var app = koa();
vantage.listen(app, 80);

// With Express
var app = express();
vantage.listen(app, 80);

// With HAPI
var server = new Hapi.Server();
vantage.listen(server, 80);
server.start();
```

