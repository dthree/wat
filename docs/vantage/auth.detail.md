## .auth(middleware[, options])

Uses a given authentication strategy. Pass the required middleware into the first variable, and any options / configuration for that middleware as given in that module's documentation into the options parameter.

```js
var pam = require("vantage-auth-pam");
vantage.auth(pam, options);
```
Vantage Basic Auth is built in, and so can be used with the "basic" string instead of requiring a module. 

```js
var users = [
    { user: "admin", pass: "4k#842jx!%s" },
    { user: "user", pass: "Unicorn11" }
];

var vantage = require("vantage")();

vantage.auth("basic", {
  "users": users,
  "retry": 3,
  "retryTime": 500,
  "deny": 1,
  "unlockTime": 3000
});
```
##### Security Note

If no `vantage.auth` function is declared, your app will not require authentication. As a security measure, if your `NODE_ENV` environment variable is not set to "development" and there is no authentication, Vantage will disallow remote connections. To permit remote connections without authentication, simply set your `NODE_ENV` to "development".

##### Building Authentication Strategies

You can publish your own custom authentication strategies for Vantage.js as its own Node module.

*I am currently looking to team up with a rocket scientist like you to build a pam-based authentication strategy for Vantage. If you are interested, send me a note!*

The format for publishing a strategy is simple:

```js

module.exports = function(vantage, options) {

  // The Vantage instance is exposed through
  // the `vantage` parameter. `options` exposes
  // options passed in by the strategy's user, and
  // is defined by you.

  // This is where you can persist the log on state of 
  // the users attempting to log in, etc.

  // You return a function, which executes
  // in the same context as a vantage command.
  // Every time the user attempts to connect,
  // this function runs. In it you can prompt
  // the user, etc.
  return function(args, callback) {

    /** 
     * Args exposes several pieces of data
     * you can use:
     * {
     *   // If the user pre-passes auth data, it will be
     *   // available here. Otherwise, prompt him for it.
     *   user: "admin", 
     *   pass: "Unicorn11",
     *   // This is based on socket.io's connection handshake,
     *   // and has a lot more data than this.
     *   handshake: { 
     *     host: "192.168.0.1",
     *     port: "800"
     *   }
     * }
     */

    // Prompt user / look up credentials, etc.

    // Authentication is determined by your
    // callback: `callback(message, authenticated)`.

    // Example of rejected auth.
    callback("Invalid credentials.", false);

    // Example of accepted auth.
    // callback(void 0, true);
  }

}

``` 