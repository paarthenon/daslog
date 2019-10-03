/**
 * Simple linked list. 
 */
export interface Category {
    label: string
    sub?: Category
}

export function replaceLastCategory(category: Category | undefined, newLabel: string): Category {
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

export function addCategory(category: Category, newLabel: string): Category {
    return category.sub == undefined
        ? {...category, sub: {label: newLabel}}
        : {...category, sub: addCategory(category.sub, newLabel)}
    ;
}
