/**
 * console.log(message, message2) => "message message2"
 * prefixedConsole.log(message, message2) => "category | message message2"
 *
 */
export declare function prefix(category: string, target?: Console, separator?: string): Console;
