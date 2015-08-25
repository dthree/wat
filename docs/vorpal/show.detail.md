## vorpal.show()

Attaches the TTY's CLI prompt to that given instance of Vorpal. 

```js
// ... (your app's code)

vorpal
  .delimiter('pg-cli:')
  .show();
  
vorpal
  .command('sql <query>', 'Executes arbitrary sql.')
  .action(function(args, cb){
    return app.execSQL(args.query);
  });
```

```bash
$ node pgcli.js
Started interactive Postgres CLI.
pg-cli~$ 
pg-cli~$ sql "select top 1 first_name from persons"
  
  first_name
  -------------
  Joe

pg-cli~$
```
As a note, multiple instances of Vorpal can run in the same Node instance. However, only one can be "attached" to your TTY. The last instance given the `show()` command will be attached, and the previously shown instances will detach.

```js
var instances = []
for (var i = 0; i < 3; ++i) {
  instances[i] = new Vorpal()
    .delimiter("instance" + i + "~$")
    .command("switch <instance>", "Switches prompt to another instance.")
    .action(function(args, cb){
      instances[args.instance].show();
      cb();
    })
}

instances[0].show();
```

```bash
$ node server.js
instance0~$ switch 1
instance1~$ switch 2
instance2~$ switch 0
instance0~$
```
