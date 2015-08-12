```js
vantage
  .command('foo <requiredArg> [optionalArg] [variadicArgs...]')
  .description('Outputs "bar".')
  .alias('foobar')
  .option('-d, --double', 'Say "bar" twice.')
  .action(function(args, callback){
  	const required = args.requiredArg;
  	const optional = args.optionalArg;
  	const variadicArray = args.variadicArgs;
  	if (options.double) {
  	  this.log('bar bar');
    } else {
    	this.log('bar');
    }
    callback();
  });
```
