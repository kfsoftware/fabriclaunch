import 'reflect-metadata';
import { CLI } from './cli-decorators';
import './commands';


const cli = new CLI();
cli.run(process.argv).then(() => {

}).catch((error) => {
	console.error(error)

});

