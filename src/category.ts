/**
 * Simple linked list. 
 */
export interface Category<C extends string> {
    label: string
    sub?: Category<string>
}

export function replaceLastCategory<C extends string>(category: Category<string> | undefined, newLabel: C): Category<C> {
    if (category == undefined || category.sub == undefined) {
        return {
            label: newLabel,
        };
    } else {
        return {
            ...category,
            sub: replaceLastCategory(category.sub, newLabel),
        }
    }
}

export function addCategory<C extends string>(category: Category<string>, newLabel: C): Category<C> {
    return category.sub == undefined
        ? {...category, sub: {label: newLabel}}
        : {...category, sub: addCategory(category.sub, newLabel)}
    ;
}
