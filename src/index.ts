const logFuncs = new Set(['fatal','error','warn','log','info','debug','trace']);

const DAS_PROPS_KEY = '_dasProps';
export type LogFragment = string | (() => string);

export interface DasLog extends Console {
	add: (...fragments:LogFragment[]) => DasLog
}

interface InternalDasLog extends DasLog {
	_dasProps:DasProps
}

interface DasProps {
	original:Console
	chain:Array<LogFragment>
	separator:string
}

function add(...fragments:LogFragment[]):DasLog {
	let props:DasProps = this[DAS_PROPS_KEY];
	return buildProxy({...props, chain:[...props.chain, ...fragments]});
}

function isFunction(x:any) : x is Function {
	return typeof(x) === 'function';
}

function buildProxy(props:DasProps):DasLog {
	return new Proxy<DasLog>({...console, add, [DAS_PROPS_KEY]:props}, {
		get: (target:InternalDasLog, name:keyof Console) => {
			if (isFunction(target[name]) && logFuncs.has(name)) {
				return (...args:any[]) => {
					const combined = target._dasProps.chain
						.map(fragment => (isFunction(fragment) ? fragment() : fragment))
						.join(` ${target._dasProps.separator} `)
					return target[name].apply(target, [combined, target._dasProps.separator, ...args]);
				}
			} else {
				return target[name];
			}
		}
	});
}

function isDasLog(x:Console):x is InternalDasLog {
	return DAS_PROPS_KEY in x;
}

function getOriginal(target:Console) {
	if (isDasLog(target)) {
		return target._dasProps.original;
	} else {
		return target;
	}
}

function getChain(target:Console) {
	if (isDasLog(target)) {
		return target._dasProps.chain;
	} else {
		return [];
	}
}

export function prefix(fragment:string, target=console, separator='|') :DasLog {
	return buildProxy({
		original: getOriginal(target),
		chain: [fragment, ...getChain(target)],
		separator,
	});
}
