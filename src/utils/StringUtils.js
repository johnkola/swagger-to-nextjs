/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/StringUtils.js
 * VERSION: 2025-06-17 16:21:39
 * PHASE: Phase 3: Utility Modules
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a comprehensive string manipulation utility module using ES Module
 * syntax for various naming convention conversions needed in code
 * generation. Export individual named functions to convert strings between
 * different cases: toPascalCase (for class names like UserProfile and React
 * components), toCamelCase (for variables like userId), toKebabCase (for
 * file names like user-profile and CSS classes), toSnakeCase (for some APIs
 * like user_id), and toUpperCase (for constants like USER_ID). Add
 * functions for pluralization and singularization of resource names,
 * capitalizing first letters, sanitizing strings to valid JavaScript
 * identifiers, generating DaisyUI-friendly class names, handling special
 * characters and numbers in conversions, preserving acronyms appropriately
 * (API stays API, not Api), creating human-readable labels from field names
 * for form labels, and ensuring all conversions handle edge cases like
 * empty strings, single characters, and mixed input formats. Use export
 * keyword for each function.
 *
 * ============================================================================
 */
/**
 * Convert string to PascalCase for class names and React components
 */
export function toPascalCase(str) {
    if (!str) return '';
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => word.toUpperCase())
        .replace(/[\s\-_]+/g, '');
}
/**
 * Convert string to camelCase for variable names
 */
export function toCamelCase(str) {
    if (!str) return '';
    const pascal = toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to kebab-case for file names and CSS classes
 */
export function toKebabCase(str) {
    if (!str) return '';
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str) {
    if (!str) return '';
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s\-]+/g, '_')
        .toLowerCase();
}

/**
 * Convert string to UPPER_CASE for constants
 */
export function toUpperCase(str) {
    if (!str) return '';
    return toSnakeCase(str).toUpperCase();
}

/**
 * Pluralize a word (simple version)
 */
export function pluralize(str) {
    if (!str) return '';

    // Common irregular plurals
    const irregulars = {
        'person': 'people',
        'child': 'children',
        'man': 'men',
        'woman': 'women',
        'tooth': 'teeth',
        'foot': 'feet',
        'mouse': 'mice',
        'goose': 'geese'
    };

    const lower = str.toLowerCase();
    if (irregulars[lower]) {
        return str.charAt(0) === str.charAt(0).toUpperCase()
            ? irregulars[lower].charAt(0).toUpperCase() + irregulars[lower].slice(1)
            : irregulars[lower];
    }

    // Rules for regular plurals
    if (str.match(/(s|ss|sh|ch|x|z)$/i)) {
        return str + 'es';
    } else if (str.match(/[^aeiou]y$/i)) {
        return str.slice(0, -1) + 'ies';
    } else if (str.match(/f$/i)) {
        return str.slice(0, -1) + 'ves';
    } else if (str.match(/fe$/i)) {
        return str.slice(0, -2) + 'ves';
    }

    return str + 's';
}

/**
 * Singularize a word (simple version)
 */
export function singularize(str) {
    if (!str) return '';

    // Common irregular singulars
    const irregulars = {
        'people': 'person',
        'children': 'child',
        'men': 'man',
        'women': 'woman',
        'teeth': 'tooth',
        'feet': 'foot',
        'mice': 'mouse',
        'geese': 'goose'
    };

    const lower = str.toLowerCase();
    if (irregulars[lower]) {
        return str.charAt(0) === str.charAt(0).toUpperCase()
            ? irregulars[lower].charAt(0).toUpperCase() + irregulars[lower].slice(1)
            : irregulars[lower];
    }

    // Rules for regular singulars
    if (str.match(/ies$/i)) {
        return str.slice(0, -3) + 'y';
    } else if (str.match(/ves$/i)) {
        return str.slice(0, -3) + 'f';
    } else if (str.match(/(ses|xes|zes|ches|shes)$/i)) {
        return str.slice(0, -2);
    } else if (str.match(/s$/i) && !str.match(/ss$/i)) {
        return str.slice(0, -1);
    }

    return str;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sanitize string to valid JavaScript identifier
 */
export function toIdentifier(str) {
    if (!str) return '';

    // Remove invalid characters
    let result = str.replace(/[^a-zA-Z0-9_$]/g, '_');

    // Ensure it doesn't start with a number
    if (/^[0-9]/.test(result)) {
        result = '_' + result;
    }

    // Remove multiple underscores
    result = result.replace(/_+/g, '_');

    // Remove trailing underscores
    result = result.replace(/_+$/, '');

    return result || '_';
}

/**
 * Generate DaisyUI-friendly class names
 */
export function toDaisyUIClass(str, prefix = '') {
    if (!str) return '';

    const base = toKebabCase(str);
    return prefix ? `${prefix}-${base}` : base;
}

/**
 * Generate DaisyUI component class with modifiers
 */
export function toDaisyUIComponentClass(component, modifiers = []) {
    if (!component) return '';

    const baseClass = toKebabCase(component);
    if (modifiers.length === 0) return baseClass;

    const modifierClasses = modifiers
        .filter(mod => mod)
        .map(mod => `${baseClass}-${toKebabCase(mod)}`);

    return [baseClass, ...modifierClasses].join(' ');
}

/**
 * Generate human-readable label from field name
 */
export function toHumanReadable(str) {
    if (!str) return '';

    // Handle camelCase and PascalCase
    let result = str.replace(/([a-z])([A-Z])/g, '$1 $2');

    // Handle snake_case and kebab-case
    result = result.replace(/[_-]/g, ' ');

    // Capitalize first letter of each word
    result = result.replace(/\b\w/g, l => l.toUpperCase());

    // Handle common abbreviations
    result = result.replace(/\bId\b/g, 'ID');
    result = result.replace(/\bApi\b/g, 'API');
    result = result.replace(/\bUrl\b/g, 'URL');
    result = result.replace(/\bHttp\b/g, 'HTTP');

    return result.trim();
}

/**
 * Generate form field label
 */
export function toFormLabel(str, required = false) {
    const label = toHumanReadable(str);
    return required ? `${label} *` : label;
}

/**
 * Generate DaisyUI size class
 */
export function toDaisyUISize(size) {
    const sizeMap = {
        'xs': 'xs',
        'extra-small': 'xs',
        'sm': 'sm',
        'small': 'sm',
        'md': 'md',
        'medium': 'md',
        'lg': 'lg',
        'large': 'lg',
        'xl': 'xl',
        'extra-large': 'xl'
    };

    return sizeMap[size?.toLowerCase()] || 'md';
}

/**
 * Generate DaisyUI color/variant class
 */
export function toDaisyUIVariant(variant) {
    const variantMap = {
        'primary': 'primary',
        'secondary': 'secondary',
        'accent': 'accent',
        'info': 'info',
        'success': 'success',
        'warning': 'warning',
        'error': 'error',
        'danger': 'error',
        'neutral': 'neutral',
        'ghost': 'ghost',
        'link': 'link'
    };

    return variantMap[variant?.toLowerCase()] || 'primary';
}

/**
 * Preserve acronyms in string conversions
 */
export function preserveAcronyms(str) {
    if (!str) return '';

    const acronyms = ['API', 'URL', 'ID', 'HTTP', 'HTTPS', 'REST', 'CRUD', 'UI', 'UX', 'CSS', 'HTML', 'JS', 'TS'];
    let result = str;

    acronyms.forEach(acronym => {
        const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
        result = result.replace(regex, acronym);
    });

    return result;
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str) {
    return !str || str.trim().length === 0;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str, maxLength = 50, suffix = '...') {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Generate CSS-safe class name
 */
export function toCSSClass(str) {
    if (!str) return '';

    // Remove invalid CSS class characters
    let result = str.replace(/[^a-zA-Z0-9-_]/g, '-');

    // Ensure it doesn't start with a number or dash
    if (/^[0-9-]/.test(result)) {
        result = '_' + result;
    }

    // Remove multiple dashes
    result = result.replace(/-+/g, '-');

    // Remove trailing dashes
    result = result.replace(/-+$/, '');

    return result.toLowerCase() || '_';
}

/**
 * Generate DaisyUI button classes
 */
export function generateButtonClasses(options = {}) {
    const classes = ['btn'];

    if (options.variant) {
        classes.push(`btn-${toDaisyUIVariant(options.variant)}`);
    }

    if (options.size) {
        classes.push(`btn-${toDaisyUISize(options.size)}`);
    }

    if (options.outline) {
        classes.push('btn-outline');
    }

    if (options.wide) {
        classes.push('btn-wide');
    }

    if (options.block) {
        classes.push('btn-block');
    }

    if (options.loading) {
        classes.push('loading');
    }

    if (options.disabled) {
        classes.push('btn-disabled');
    }

    return classes.join(' ');
}

/**
 * Generate DaisyUI input classes
 */
export function generateInputClasses(options = {}) {
    const classes = ['input', 'input-bordered'];

    if (options.variant) {
        classes.push(`input-${toDaisyUIVariant(options.variant)}`);
    }

    if (options.size) {
        classes.push(`input-${toDaisyUISize(options.size)}`);
    }

    if (options.error) {
        classes.push('input-error');
    }

    if (options.success) {
        classes.push('input-success');
    }

    if (options.disabled) {
        classes.push('input-disabled');
    }

    return classes.join(' ');
}