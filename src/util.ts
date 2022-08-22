export type Func = (...args: any[]) => any;
export type VoidFunc = (...args: any[]) => void;

/**
 * No-operation. Quietly replaces log functions when they don't meet the threshold.
 */
export function noop(){};


export type LinkedList<Key extends string, Value> = (Record<Key, Value>) & { sub?: LinkedList<Key, Value> };

export function pushLL<LL extends LinkedList<string, any>>(list: LL | undefined, item: LL): LL {
    if (list) {
        return {
            ...list,
            sub: list.sub == undefined ? item : pushLL(list.sub, item),
        }
    } else {
        return item;
    }
}

export function popLL<LL extends LinkedList<string, any>>(list?: LL): LL | undefined {
    if (list) {
        if (list.sub == undefined) {
            return undefined
        } else {
            return popLL(list.sub) as LL;
        }
    } else {
        return undefined;
    }
}