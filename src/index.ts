const logFuncs = new Set(['fatal','error','warn','log','info','debug','trace']);

/**
 * console.log(message, message2) => "message message2"
 * prefixedConsole.log(message, message2) => "category | message message2"
 * 
 */
export function prefix(category:string, target=console, separator='|') :Console {
	return new Proxy<Console>(target, {
		get: (target:Console, name:keyof Console) => (...args:any[]) => {
			if (category != undefined && logFuncs.has(name)) {
				target[name].apply(target, [category, separator, ...args]);
			} else {
				target[name].apply(target, args);
			}
		}
	});
}
