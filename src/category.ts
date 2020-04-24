/**
 * Simple category name linked list. 
 */
export interface Category {
    label: string
    sub?: Category
}

/**
 * Replace the final category in the chain.
 * @param category 
 * @param newLabel 
 */
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

/**
 * Add a new category to the end of the chain
 * @param category 
 * @param newLabel 
 */
export function addCategory(category: Category, newLabel: string): Category {
    return category.sub == undefined
        ? {...category, sub: {label: newLabel}}
        : {...category, sub: addCategory(category.sub, newLabel)}
    ;
}

/**
 * Walk your cat aka iterate your categories, returning a string[].
 * @param category optional 
 * @returns string[] - the labels as an array
 */
export const walkCat = (category?: Category): string[] => category ? [category.label].concat(walkCat(category.sub)) : [];

/**
 * Get the category label at the tail of the linked list.
 * @param category 
 */
export const getClosestCategory = (category?: Category): string | undefined => category?.sub ? getClosestCategory(category.sub) : category?.label;