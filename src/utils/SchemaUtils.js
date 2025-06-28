/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/utils/SchemaUtils.js
 * VERSION: 2025-06-17 21:42:10
 * PHASE: Phase 3: Utility Modules
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Build a utility module using ES Module syntax for converting OpenAPI
 * schemas to TypeScript types and extracting UI hints for DaisyUI
 * components. Export named functions to convert OpenAPI schema objects to
 * TypeScript type strings, map OpenAPI types (string, integer, number,
 * boolean) to TypeScript types, handle array types with proper TypeScript
 * array syntax, process nested object schemas recursively, resolve $ref
 * references to get actual schema definitions, generate valid TypeScript
 * interface names from schema names, handle nullable types using TypeScript
 * union types, process enum schemas to TypeScript enums or union types (and
 * determine if they should be rendered as select, radio, or badges in
 * DaisyUI), manage schema composition (allOf, oneOf, anyOf), detect and
 * handle circular references, extract descriptions for JSDoc comments and
 * form field help text, determine appropriate DaisyUI input components
 * based on schema properties (text input, textarea, select, checkbox,
 * etc.), and identify fields that should use specific DaisyUI components
 * (dates with date picker, colors with color picker, etc.). Use export
 * keyword for each function.
 *
 * ============================================================================
 */

/**
 * SchemaUtils.js - Utility module for OpenAPI schema processing
 * Converts schemas to TypeScript types and extracts UI hints for DaisyUI
 * Uses ES Module named exports as required by generators
 */

// Note: Import toPascalCase from StringUtils.js
// For this file to work, ensure StringUtils.js has the correct toPascalCase implementation
import { toPascalCase, toHumanReadable } from './StringUtils.js';

/**
 * Convert OpenAPI schema to TypeScript type string
 * Main function used by TypeGenerator
 */
export function convertSchemaToTypeScript(schema, options = {}) {
    if (!schema) return 'any';

    // Handle empty object specially
    if (typeof schema === 'object' && Object.keys(schema).length === 0) {
        return 'Record<string, any>';
    }

    // Handle references
    if (schema.$ref) {
        const refName = schema.$ref.split('/').pop();
        return toPascalCase(refName);
    }

    // Handle arrays
    if (schema.type === 'array') {
        const itemType = convertSchemaToTypeScript(schema.items, options);
        return `${itemType}[]`;
    }

    // Handle objects
    if (schema.type === 'object' || schema.properties) {
        if (!schema.properties) return 'Record<string, any>';

        const props = Object.entries(schema.properties)
            .map(([key, prop]) => {
                const required = schema.required?.includes(key);
                const nullable = prop.nullable || schema.nullable;
                let type = convertSchemaToTypeScript(prop, options);

                if (nullable && type !== 'null') {
                    type = `${type} | null`;
                }

                return `${key}${required ? '' : '?'}: ${type}`;
            })
            .join(';\n  ');

        return `{\n  ${props}\n}`;
    }

    // Handle enums
    if (schema.enum) {
        return schema.enum.map(v => typeof v === 'string' ? `'${v}'` : v).join(' | ');
    }

    // Handle allOf
    if (schema.allOf) {
        return schema.allOf.map(s => convertSchemaToTypeScript(s, options)).join(' & ');
    }

    // Handle oneOf
    if (schema.oneOf) {
        return schema.oneOf.map(s => convertSchemaToTypeScript(s, options)).join(' | ');
    }

    // Handle anyOf
    if (schema.anyOf) {
        return schema.anyOf.map(s => convertSchemaToTypeScript(s, options)).join(' | ');
    }

    // Handle primitive types
    return mapOpenAPITypeToTypeScript(schema.type, schema.format);
}

/**
 * Map OpenAPI types to TypeScript types
 */
export function mapOpenAPITypeToTypeScript(type, format) {
    // Handle null/undefined type parameter
    if (!type) return 'any';

    const typeMap = {
        'string': 'string',
        'number': 'number',
        'integer': 'number',
        'boolean': 'boolean',
        'null': 'null',
        'array': 'any[]',
        'object': 'Record<string, any>'
    };

    // Handle string formats
    if (type === 'string' && format) {
        const formatMap = {
            'date': 'string',
            'date-time': 'string',
            'uuid': 'string',
            'email': 'string',
            'uri': 'string',
            'url': 'string',
            'hostname': 'string',
            'ipv4': 'string',
            'ipv6': 'string',
            'binary': 'Blob | File',
            'byte': 'string',
            'password': 'string'
        };
        return formatMap[format] || 'string';
    }

    return typeMap[type] || 'any';
}

/**
 * Extract UI hints from schema extensions
 * Used by generators to determine DaisyUI component selection
 */
export function extractUIHints(schema) {
    if (!schema) return {};

    const hints = {
        component: schema['x-ui-component'],
        variant: schema['x-ui-variant'],
        size: schema['x-ui-size'],
        placeholder: schema['x-ui-placeholder'],
        helpText: schema['x-ui-help-text'],
        section: schema['x-ui-section'],
        badgeColors: schema['x-ui-badge-colors'],
        noSort: schema['x-ui-no-sort'],
        readonly: schema['x-ui-readonly'] || schema.readOnly,
        hidden: schema['x-ui-hidden'],
        icon: schema['x-ui-icon'],
        layout: schema['x-ui-layout']
    };

    // Remove undefined values
    Object.keys(hints).forEach(key => {
        if (hints[key] === undefined) delete hints[key];
    });

    return hints;
}

/**
 * Determine appropriate DaisyUI input type based on schema
 * Used by PageGenerator for form field generation
 */
export function determineInputType(schema, fieldName = '') {
    if (!schema) return 'text';

    // Check for explicit UI hint
    const uiHints = extractUIHints(schema);
    if (uiHints.component) return uiHints.component;

    // File upload
    if (schema.type === 'string' && (schema.format === 'binary' || schema.format === 'byte')) {
        return 'file';
    }

    // Date/time inputs
    if (schema.type === 'string' && schema.format === 'date') {
        return 'date';
    }
    if (schema.type === 'string' && schema.format === 'date-time') {
        return 'datetime-local';
    }
    if (schema.type === 'string' && schema.format === 'time') {
        return 'time';
    }

    // Email
    if (schema.type === 'string' && schema.format === 'email') {
        return 'email';
    }

    // URL
    if (schema.type === 'string' && (schema.format === 'uri' || schema.format === 'url')) {
        return 'url';
    }

    // Password
    if (schema.type === 'string' && (schema.format === 'password' || fieldName.toLowerCase().includes('password'))) {
        return 'password';
    }

    // Select for enums
    if (schema.enum && schema.enum.length > 0) {
        if (schema.enum.length <= 3) {
            return 'radio';
        }
        return 'select';
    }

    // Checkbox for boolean
    if (schema.type === 'boolean') {
        return 'checkbox';
    }

    // Textarea for long text
    if (schema.type === 'string') {
        if (schema.maxLength && schema.maxLength > 255) {
            return 'textarea';
        }
        if (fieldName && (
            fieldName.toLowerCase().includes('description') ||
            fieldName.toLowerCase().includes('note') ||
            fieldName.toLowerCase().includes('comment') ||
            fieldName.toLowerCase().includes('content') ||
            fieldName.toLowerCase().includes('body')
        )) {
            return 'textarea';
        }
    }

    // Color picker
    if (schema.type === 'string' && (schema.format === 'color' || (fieldName && fieldName.toLowerCase().includes('color')))) {
        return 'color';
    }

    // Range slider for numbers with min/max - MOVED BEFORE generic number check
    if ((schema.type === 'number' || schema.type === 'integer') &&
        schema.minimum !== undefined &&
        schema.maximum !== undefined) {
        return 'range';
    }

    // Number inputs
    if (schema.type === 'number' || schema.type === 'integer') {
        return 'number';
    }

    // Default to text
    return 'text';
}

/**
 * Resolve $ref references
 */
export function resolveRef(ref, definitions) {
    if (!ref || !ref.startsWith('#/')) return null;

    const path = ref.substring(2).split('/');
    let current = definitions;

    for (const segment of path) {
        if (!current || typeof current !== 'object') return null;
        current = current[segment];
    }

    return current;
}

/**
 * Generate form validation rules from schema
 */
export function extractValidationRules(schema) {
    const rules = [];

    if (schema.minimum !== undefined) {
        rules.push({ type: 'min', value: schema.minimum, message: `Must be at least ${schema.minimum}` });
    }
    if (schema.maximum !== undefined) {
        rules.push({ type: 'max', value: schema.maximum, message: `Must be at most ${schema.maximum}` });
    }
    if (schema.minLength !== undefined) {
        rules.push({ type: 'minLength', value: schema.minLength, message: `Must be at least ${schema.minLength} characters` });
    }
    if (schema.maxLength !== undefined) {
        rules.push({ type: 'maxLength', value: schema.maxLength, message: `Must be at most ${schema.maxLength} characters` });
    }
    if (schema.pattern) {
        rules.push({ type: 'pattern', value: schema.pattern, message: 'Invalid format' });
    }
    if (schema.format === 'email') {
        rules.push({ type: 'email', message: 'Must be a valid email address' });
    }
    if (schema.format === 'uri' || schema.format === 'url') {
        rules.push({ type: 'url', message: 'Must be a valid URL' });
    }

    return rules;
}

/**
 * Get badge color based on field value
 */
export function getBadgeColor(value, schema) {
    // Check for explicit color mapping
    if (schema && schema['x-ui-colors'] && schema['x-ui-colors'][value]) {
        return schema['x-ui-colors'][value];
    }

    // Default mappings
    const colorMap = {
        // Status
        'active': 'success',
        'inactive': 'ghost',
        'pending': 'warning',
        'completed': 'success',
        'failed': 'error',
        'error': 'error',
        'success': 'success',
        'warning': 'warning',
        'info': 'info',
        // Priority
        'high': 'error',
        'medium': 'warning',
        'low': 'info',
        // General
        'new': 'primary',
        'draft': 'ghost',
        'published': 'success',
        'archived': 'ghost'
    };

    return colorMap[value?.toLowerCase()] || 'neutral';
}

/**
 * Detect circular references in schema
 */
export function detectCircularReferences(schema, visited = new Set(), path = []) {
    if (!schema || typeof schema !== 'object') return false;

    const schemaId = schema.$ref || JSON.stringify(schema);

    if (visited.has(schemaId)) {
        return { circular: true, path: [...path, schemaId] };
    }

    visited.add(schemaId);
    path.push(schemaId);

    // Check properties
    if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
            const result = detectCircularReferences(prop, new Set(visited), [...path]);
            if (result && result.circular) return result;
        }
    }

    // Check array items
    if (schema.items) {
        const result = detectCircularReferences(schema.items, new Set(visited), [...path]);
        if (result && result.circular) return result;
    }

    // Check composition
    const compositions = ['allOf', 'oneOf', 'anyOf'];
    for (const comp of compositions) {
        if (schema[comp]) {
            for (const subSchema of schema[comp]) {
                const result = detectCircularReferences(subSchema, new Set(visited), [...path]);
                if (result && result.circular) return result;
            }
        }
    }

    return false;
}

/**
 * Generate TypeScript interface name from schema name
 */
export function generateInterfaceName(schemaName) {
    if (!schemaName) return 'Unknown';

    // Ensure PascalCase and valid TypeScript identifier
    let name = toPascalCase(schemaName);

    // Ensure it doesn't start with a number
    if (/^[0-9]/.test(name)) {
        name = 'Type' + name;
    }

    return name;
}

/**
 * Identify special fields that need specific DaisyUI components
 */
export function identifySpecialFields(schema) {
    const specialFields = {
        badges: [],
        toggles: [],
        ratings: [],
        progress: [],
        avatars: [],
        stats: []
    };

    if (!schema || !schema.properties) return specialFields;

    Object.entries(schema.properties).forEach(([key, prop]) => {
        const lowerKey = key.toLowerCase();

        // Status fields → badges
        if (lowerKey.includes('status') || lowerKey.includes('state') || prop.enum) {
            specialFields.badges.push(key);
        }

        // Boolean fields → toggles
        if (prop.type === 'boolean' && (lowerKey.includes('enabled') || lowerKey.includes('active'))) {
            specialFields.toggles.push(key);
        }

        // Rating fields
        if (lowerKey.includes('rating') || lowerKey.includes('score')) {
            specialFields.ratings.push(key);
        }

        // Progress fields
        if (lowerKey.includes('progress') || lowerKey.includes('percent')) {
            specialFields.progress.push(key);
        }

        // Avatar fields
        if (lowerKey.includes('avatar') || lowerKey.includes('photo') || lowerKey.includes('image')) {
            specialFields.avatars.push(key);
        }

        // Numeric stats
        if ((prop.type === 'number' || prop.type === 'integer') &&
            (lowerKey.includes('count') || lowerKey.includes('total') || lowerKey.includes('amount'))) {
            specialFields.stats.push(key);
        }
    });

    return specialFields;
}
