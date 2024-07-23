import 'reflect-metadata';

const COMMAND_METADATA_KEY = Symbol('command');
const COMMAND_CLASS_METADATA_KEY = Symbol('commandClass');
const ARG_METADATA_KEY = Symbol('arg');
const FLAG_METADATA_KEY = Symbol('flag');

export interface CommandInfo {
	name: string;
	description: string;
}

export interface CommandClassInfo {
	name?: string;
	description?: string;
}

export interface ArgInfo {
	name: string;
	description: string;
}

export interface FlagInfo {
	name: string;
	alias?: string;
	description: string;
	type: 'string' | 'boolean' | 'number' | 'string[]';
	required?: boolean;
}

export function Command(info: CommandInfo) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		Reflect.defineMetadata(COMMAND_METADATA_KEY, info, target, propertyKey);
	};
}

export function Arg(info: ArgInfo) {
	return function (target: any, propertyKey: string, parameterIndex: number) {
		const existingArgs: ArgInfo[] = Reflect.getOwnMetadata(ARG_METADATA_KEY, target, propertyKey) || [];
		existingArgs[parameterIndex] = info;
		Reflect.defineMetadata(ARG_METADATA_KEY, existingArgs, target, propertyKey);
	};
}

export function Flag(info: FlagInfo) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor | number) {
		const existingFlags: FlagInfo[] = Reflect.getOwnMetadata(FLAG_METADATA_KEY, target, propertyKey) || [];
		existingFlags.push(info);
		Reflect.defineMetadata(FLAG_METADATA_KEY, existingFlags, target, propertyKey);
	};
}
export class CommandRegistry {
	private static instance: CommandRegistry;
	private commands: { [key: string]: { method: Function; info: CommandInfo; args: ArgInfo[]; flags: FlagInfo[]; instance: any } } = {};

	private constructor() { }

	public static getInstance(): CommandRegistry {
		if (!CommandRegistry.instance) {
			CommandRegistry.instance = new CommandRegistry();
		}
		return CommandRegistry.instance;
	}

	public registerCommands(instance: any, classInfo?: CommandClassInfo): void {
		const prototype = Object.getPrototypeOf(instance);
		const methodNames = Object.getOwnPropertyNames(prototype).filter(
			(name) => name !== 'constructor' && typeof prototype[name] === 'function'
		);

		methodNames.forEach((methodName) => {
			const info: CommandInfo | undefined = Reflect.getMetadata(COMMAND_METADATA_KEY, prototype, methodName);
			if (info) {
				const fullCommandName = classInfo?.name ? `${classInfo.name} ${info.name}` : info.name;
				const args: ArgInfo[] = Reflect.getOwnMetadata(ARG_METADATA_KEY, prototype, methodName) || [];
				const flags: FlagInfo[] = Reflect.getOwnMetadata(FLAG_METADATA_KEY, prototype, methodName) || [];
				this.commands[fullCommandName] = {
					method: prototype[methodName],
					info: {
						...info,
						description: classInfo?.name ? `${classInfo.description} - ${info.description}` : info.description
					},
					args,
					flags,
					instance
				};
			}
		});

		if (classInfo?.name) {
			this.commands[classInfo.name] = {
				method: this.showSubcommandHelp.bind(this, classInfo.name),
				info: { name: classInfo.name, description: classInfo.description || 'Group of commands' },
				args: [],
				flags: [],
				instance: this
			};
		}
	}

	public getCommands(): { [key: string]: { method: Function; info: CommandInfo; args: ArgInfo[]; flags: FlagInfo[]; instance: any } } {
		return this.commands;
	}

	private showSubcommandHelp(parentCommand: string): void {
		console.log(`Available subcommands for ${parentCommand}:`);
		Object.entries(this.commands)
			.filter(([key, value]) => key.startsWith(parentCommand) && key !== parentCommand)
			.forEach(([key, { info }]) => {
				console.log(`  ${key}: ${info.description}`);
			});
	}
}

export function CommandClass(info?: CommandClassInfo) {
	return function (constructor: Function) {
		Reflect.defineMetadata(COMMAND_CLASS_METADATA_KEY, true, constructor);
		const instance = new (constructor as new () => any)();
		CommandRegistry.getInstance().registerCommands(instance, info);
	};
}

export class CLI {
	private registry: CommandRegistry;

	constructor() {
		this.registry = CommandRegistry.getInstance();
	}

	public async run(args: string[]): Promise<void> {
		const commandArgs = args.slice(2);
		const commands = this.registry.getCommands();

		let matchedCommand = '';
		for (let i = commandArgs.length; i > 0; i--) {
			const potentialCommand = commandArgs.slice(0, i).join(' ');
			if (commands[potentialCommand]) {
				matchedCommand = potentialCommand;
				break;
			}
		}

		if (matchedCommand) {
			const { method, info, args, flags, instance } = commands[matchedCommand];
			const remainingArgs = commandArgs.slice(matchedCommand.split(' ').length);

			if (remainingArgs.includes('--help')) {
				this.showCommandHelp(matchedCommand, info, args, flags);
				return;
			}

			const { positionalArgs, flagArgs } = this.parseArgs(remainingArgs, args, flags);
			await method.call(instance, ...positionalArgs, flagArgs);
		} else {
			this.showHelp(commands);
		}
	}

	private parseArgs(args: string[], argInfos: ArgInfo[], flagInfos: FlagInfo[]): { positionalArgs: any[], flagArgs: { [key: string]: any } } {
		const positionalArgs: any[] = [];
		const flagArgs: { [key: string]: any } = {};
		const flagMap: { [key: string]: FlagInfo } = {};

		flagInfos.forEach(flag => {
			flagMap[`--${flag.name}`] = flag;
			if (flag.alias) flagMap[`-${flag.alias}`] = flag;
		});

		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			if (arg.startsWith('-')) {
				let flag: FlagInfo | undefined;
				let value: string | undefined;

				// Check for --flag=value syntax
				if (arg.includes('=')) {
					const [flagPart, valuePart] = arg.split('=');
					flag = flagMap[flagPart];
					value = valuePart;
				} else {
					flag = flagMap[arg];
				}

				if (flag) {
					if (flag.type === 'boolean') {
						flagArgs[flag.name] = true;
					} else if (flag.type === 'string[]') {
						if (value === undefined) {
							i++;
							value = args[i];
						}
						if (!flagArgs[flag.name]) {
							flagArgs[flag.name] = [];
						}
						flagArgs[flag.name].push(value);
					} else {
						if (value === undefined) {
							i++;
							value = args[i];
						}
						flagArgs[flag.name] = this.parseValue(value, flag.type);
					}
				}
			} else {
				positionalArgs.push(arg);
			}
		}

		flagInfos.forEach(flag => {
			if (flag.required && !(flag.name in flagArgs)) {
				throw new Error(`Required flag --${flag.name} is missing`);
			}
		});

		return { positionalArgs, flagArgs };
	}

	private parseValue(value: string, type: 'string' | 'boolean' | 'number' | 'string[]'): any {
		if (type === 'number') return Number(value);
		if (type === 'boolean') return value.toLowerCase() === 'true';
		return value;
	}

	private showCommandHelp(commandName: string, info: CommandInfo, args: ArgInfo[], flags: FlagInfo[]): void {
		console.log(`Command: ${commandName}`);
		console.log(`Description: ${info.description}`);
		console.log('\nUsage:');
		let usage = `  ${commandName}`;
		args.forEach(arg => {
			usage += ` <${arg.name}>`;
		});
		if (flags.length > 0) {
			usage += ' [options]';
		}
		console.log(usage);

		if (args.length > 0) {
			console.log('\nArguments:');
			args.forEach(arg => console.log(`  ${arg.name}: ${arg.description}`));
		}

		if (flags.length > 0) {
			console.log('\nOptions:');
			flags.forEach(flag => {
				const alias = flag.alias ? `-${flag.alias}, ` : '    ';
				console.log(`  ${alias}--${flag.name} <${flag.type}>: ${flag.description}${flag.required ? ' (required)' : ''}`);
			});
		}
	}

	private showHelp(commands: { [key: string]: { method: Function; info: CommandInfo } }): void {
		console.log('Available commands:');
		Object.entries(commands).forEach(([key, { info }]) => {
			if (!key.includes(' ')) {
				console.log(`  ${key}: ${info.description}`);
			}
		});
		console.log('\nUse "<command> --help" for more information about a specific command.');
	}
}
