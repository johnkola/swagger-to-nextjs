/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/generators/PageComponentGenerator.js
 * VERSION: 2025-05-28 15:14:56
 * PHASE: PHASE 3: Code Generation Engine
 * CATEGORY: 🏗️ Base Generators
 * ============================================================================
 *
 * AI GENERATION PROMPT:
 *
 * Create a smart page component generator that:
 * - Generates type-safe React components 
 * - Implements data fetching with SWR/React Query 
 * - Generates forms with validation 
 * - Creates responsive data tables 
 * - Implements loading and error states 
 * - Generates modal and drawer components 
 * - Supports internationalization 
 * - Implements accessibility standards 
 * - Generates Storybook stories 
 * - Creates component tests
 *
 * ============================================================================
 */

import path from 'path';
import { BaseGenerator } from './BaseGenerator.js';
import { GeneratorError } from '../errors/GeneratorError.js';
import { PathUtils } from '../utils/PathUtils.js';
import { SchemaUtils } from '../utils/SchemaUtils.js';
import { StringUtils } from '../utils/StringUtils.js';
import { TypeScriptUtils } from '../utils/TypeScriptUtils.js';

/**
 * Generates type-safe React components for Next.js pages
 */
export class PageComponentGenerator extends BaseGenerator {
    constructor(options = {}) {
        super({
            ...options,
            templateDir: 'pages',
            outputSubdir: 'app'
        });

        this.pathUtils = new PathUtils();
        this.schemaUtils = new SchemaUtils();
        this.stringUtils = new StringUtils();
        this.tsUtils = new TypeScriptUtils();

        // Component generation options
        this.componentOptions = {
            typescript: true,
            dataFetching: 'swr', // 'swr' | 'react-query' | 'native'
            uiLibrary: 'tailwind', // 'tailwind' | 'mui' | 'chakra' | 'custom'
            formLibrary: 'react-hook-form', // 'react-hook-form' | 'formik' | 'custom'
            generateTests: true,
            generateStorybook: true,
            generateDocs: true,
            accessibility: true,
            internationalization: false,
            animations: true,
            ...options.componentOptions
        };

        // Template configurations
        this.templates = {
            page: null,
            components: null,
            form: null,
            table: null,
            modal: null,
            loading: null,
            error: null,
            layout: null,
            types: null,
            hooks: null,
            utils: null
        };

        // UI component mapping
        this.uiComponents = this._getUIComponents();
    }

    /**
     * Load page component templates
     */
    async loadTemplates() {
        this.logger.debug('Loading page component templates');

        // Load all templates
        for (const templateName of Object.keys(this.templates)) {
            this.templates[templateName] = await this.templateEngine.load(
                `pages/${templateName}.tsx.template`
            );
        }

        // Register custom helpers
        this._registerTemplateHelpers();
    }

    /**
     * Validate page generation context
     */
    async doValidate(context) {
        if (!context.routes || context.routes.length === 0) {
            throw new GeneratorError('Routes are required for page generation');
        }

        if (!context.schemas) {
            throw new GeneratorError('Schemas are required for component generation');
        }

        // Validate UI library dependencies
        if (this.componentOptions.uiLibrary && !this._isUILibrarySupported(this.componentOptions.uiLibrary)) {
            throw new GeneratorError(`Unsupported UI library: ${this.componentOptions.uiLibrary}`);
        }
    }

    /**
     * Prepare page generation context
     */
    async doPrepare(context) {
        // Group routes by resource
        const resourceGroups = this._groupRoutesByResource(context.routes);

        // Analyze schemas for component generation
        const componentSchemas = this._analyzeComponentSchemas(context.schemas);

        // Prepare shared components
        const sharedComponents = this._identifySharedComponents(componentSchemas);

        return {
            ...context,
            resourceGroups,
            componentSchemas,
            sharedComponents,
            uiConfig: this._prepareUIConfig(),
            formConfig: this._prepareFormConfig(),
            dataFetchingConfig: this._prepareDataFetchingConfig()
        };
    }

    /**
     * Generate page components
     */
    async doGenerate(context) {
        const files = [];

        // Generate shared components first
        files.push(...await this._generateSharedComponents(context));

        // Generate layout components
        files.push(...await this._generateLayoutComponents(context));

        // Generate resource pages
        for (const [resource, routes] of Object.entries(context.resourceGroups)) {
            files.push(...await this._generateResourcePages(resource, routes, context));
        }

        // Generate utility files
        files.push(...await this._generateUtilityFiles(context));

        // Generate tests if enabled
        if (this.componentOptions.generateTests) {
            files.push(...await this._generateTests(context));
        }

        // Generate Storybook stories if enabled
        if (this.componentOptions.generateStorybook) {
            files.push(...await this._generateStories(context));
        }

        return files;
    }

    /**
     * Generate shared components
     */
    async _generateSharedComponents(context) {
        const files = [];
        const componentsDir = path.join(context.outputDir, this.options.outputSubdir, 'components');

        // Generate loading components
        files.push({
            path: path.join(componentsDir, 'loading.tsx'),
            content: await this.templates.loading.render({
                uiLibrary: this.componentOptions.uiLibrary,
                animations: this.componentOptions.animations
            })
        });

        // Generate error boundary
        files.push({
            path: path.join(componentsDir, 'error-boundary.tsx'),
            content: await this.templates.error.render({
                uiLibrary: this.componentOptions.uiLibrary,
                typescript: this.componentOptions.typescript
            })
        });

        // Generate modal components
        files.push({
            path: path.join(componentsDir, 'modal.tsx'),
            content: await this.templates.modal.render({
                uiLibrary: this.componentOptions.uiLibrary,
                accessibility: this.componentOptions.accessibility
            })
        });

        // Generate form components
        files.push(...await this._generateFormComponents(context));

        // Generate table components
        files.push(...await this._generateTableComponents(context));

        // Generate shared UI components
        for (const component of context.sharedComponents) {
            files.push({
                path: path.join(componentsDir, `${this.stringUtils.toKebabCase(component.name)}.tsx`),
                content: await this._generateSharedComponent(component, context)
            });
        }

        return files;
    }

    /**
     * Generate form components
     */
    async _generateFormComponents(context) {
        const files = [];
        const formsDir = path.join(context.outputDir, this.options.outputSubdir, 'components/forms');

        // Base form components
        const formComponents = [
            'form-field',
            'text-input',
            'select-input',
            'checkbox-input',
            'radio-input',
            'file-upload',
            'date-picker',
            'form-array',
            'form-errors'
        ];

        for (const componentName of formComponents) {
            files.push({
                path: path.join(formsDir, `${componentName}.tsx`),
                content: await this._generateFormComponent(componentName, context)
            });
        }

        // Generate schema-based forms
        for (const [schemaName, schema] of Object.entries(context.componentSchemas)) {
            if (this._isFormSchema(schema)) {
                files.push({
                    path: path.join(formsDir, `${this.stringUtils.toKebabCase(schemaName)}-form.tsx`),
                    content: await this._generateSchemaForm(schemaName, schema, context)
                });
            }
        }

        return files;
    }

    /**
     * Generate table components
     */
    async _generateTableComponents(context) {
        const files = [];
        const tablesDir = path.join(context.outputDir, this.options.outputSubdir, 'components/tables');

        // Base table components
        files.push({
            path: path.join(tablesDir, 'data-table.tsx'),
            content: await this.templates.table.render({
                uiLibrary: this.componentOptions.uiLibrary,
                features: {
                    sorting: true,
                    filtering: true,
                    pagination: true,
                    selection: true,
                    export: true
                }
            })
        });

        // Generate resource-specific tables
        for (const [resource, routes] of Object.entries(context.resourceGroups)) {
            const listRoute = routes.find(r => r.method === 'get' && !r.path.includes('{'));
            if (listRoute && listRoute.operation.responses?.['200']) {
                files.push({
                    path: path.join(tablesDir, `${this.stringUtils.toKebabCase(resource)}-table.tsx`),
                    content: await this._generateResourceTable(resource, listRoute, context)
                });
            }
        }

        return files;
    }

    /**
     * Generate layout components
     */
    async _generateLayoutComponents(context) {
        const files = [];
        const layoutDir = path.join(context.outputDir, this.options.outputSubdir);

        // Main layout
        files.push({
            path: path.join(layoutDir, 'layout.tsx'),
            content: await this.templates.layout.render({
                title: context.swagger.info?.title,
                navigation: this._generateNavigation(context),
                uiLibrary: this.componentOptions.uiLibrary,
                internationalization: this.componentOptions.internationalization,
                accessibility: this.componentOptions.accessibility
            })
        });

        // Navigation component
        files.push({
            path: path.join(layoutDir, 'components/navigation.tsx'),
            content: await this._generateNavigationComponent(context)
        });

        // Header component
        files.push({
            path: path.join(layoutDir, 'components/header.tsx'),
            content: await this._generateHeaderComponent(context)
        });

        // Footer component
        files.push({
            path: path.join(layoutDir, 'components/footer.tsx'),
            content: await this._generateFooterComponent(context)
        });

        return files;
    }

    /**
     * Generate resource pages
     */
    async _generateResourcePages(resource, routes, context) {
        const files = [];
        const resourceDir = path.join(
            context.outputDir,
            this.options.outputSubdir,
            this.stringUtils.toKebabCase(resource)
        );

        // Analyze resource operations
        const operations = this._analyzeResourceOperations(routes);

        // Generate list page
        if (operations.list) {
            files.push(...await this._generateListPage(resource, operations.list, context));
        }

        // Generate detail page
        if (operations.get) {
            files.push(...await this._generateDetailPage(resource, operations.get, context));
        }

        // Generate create page
        if (operations.create) {
            files.push(...await this._generateCreatePage(resource, operations.create, context));
        }

        // Generate edit page
        if (operations.update) {
            files.push(...await this._generateEditPage(resource, operations.update, context));
        }

        // Generate resource hooks
        files.push({
            path: path.join(resourceDir, 'hooks.ts'),
            content: await this._generateResourceHooks(resource, operations, context)
        });

        // Generate resource types
        if (this.componentOptions.typescript) {
            files.push({
                path: path.join(resourceDir, 'types.ts'),
                content: await this._generateResourceTypes(resource, operations, context)
            });
        }

        return files;
    }

    /**
     * Generate list page
     */
    async _generateListPage(resource, listRoute, context) {
        const files = [];
        const pageDir = path.join(
            context.outputDir,
            this.options.outputSubdir,
            this.stringUtils.toKebabCase(resource)
        );

        // Main page component
        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this.templates.page.render({
                type: 'list',
                resource,
                route: listRoute,
                components: {
                    table: `${this.stringUtils.toPascalCase(resource)}Table`,
                    filters: `${this.stringUtils.toPascalCase(resource)}Filters`,
                    actions: `${this.stringUtils.toPascalCase(resource)}Actions`
                },
                dataFetching: this._generateDataFetching('list', resource, listRoute, context),
                uiLibrary: this.componentOptions.uiLibrary,
                accessibility: this.componentOptions.accessibility
            })
        });

        // Filter component
        files.push({
            path: path.join(pageDir, 'components/filters.tsx'),
            content: await this._generateFilterComponent(resource, listRoute, context)
        });

        // Actions component
        files.push({
            path: path.join(pageDir, 'components/actions.tsx'),
            content: await this._generateActionsComponent(resource, context)
        });

        return files;
    }

    /**
     * Generate detail page
     */
    async _generateDetailPage(resource, detailRoute, context) {
        const files = [];
        const pageDir = path.join(
            context.outputDir,
            this.options.outputSubdir,
            this.stringUtils.toKebabCase(resource),
            '[id]'
        );

        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this.templates.page.render({
                type: 'detail',
                resource,
                route: detailRoute,
                components: {
                    detail: `${this.stringUtils.toPascalCase(resource)}Detail`,
                    actions: `${this.stringUtils.toPascalCase(resource)}DetailActions`
                },
                dataFetching: this._generateDataFetching('detail', resource, detailRoute, context),
                uiLibrary: this.componentOptions.uiLibrary
            })
        });

        // Detail component
        files.push({
            path: path.join(pageDir, 'components/detail.tsx'),
            content: await this._generateDetailComponent(resource, detailRoute, context)
        });

        return files;
    }

    /**
     * Generate create page
     */
    async _generateCreatePage(resource, createRoute, context) {
        const files = [];
        const pageDir = path.join(
            context.outputDir,
            this.options.outputSubdir,
            this.stringUtils.toKebabCase(resource),
            'create'
        );

        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this.templates.page.render({
                type: 'create',
                resource,
                route: createRoute,
                components: {
                    form: `${this.stringUtils.toPascalCase(resource)}Form`
                },
                dataFetching: this._generateDataFetching('create', resource, createRoute, context),
                uiLibrary: this.componentOptions.uiLibrary
            })
        });

        return files;
    }

    /**
     * Generate edit page
     */
    async _generateEditPage(resource, updateRoute, context) {
        const files = [];
        const pageDir = path.join(
            context.outputDir,
            this.options.outputSubdir,
            this.stringUtils.toKebabCase(resource),
            '[id]',
            'edit'
        );

        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this.templates.page.render({
                type: 'edit',
                resource,
                route: updateRoute,
                components: {
                    form: `${this.stringUtils.toPascalCase(resource)}Form`
                },
                dataFetching: this._generateDataFetching('edit', resource, updateRoute, context),
                uiLibrary: this.componentOptions.uiLibrary
            })
        });

        return files;
    }

    /**
     * Generate utility files
     */
    async _generateUtilityFiles(context) {
        const files = [];
        const utilsDir = path.join(context.outputDir, this.options.outputSubdir, 'lib');

        // API client utilities
        files.push({
            path: path.join(utilsDir, 'api-client.ts'),
            content: await this._generateApiClient(context)
        });

        // Data fetching utilities
        files.push({
            path: path.join(utilsDir, 'data-fetching.ts'),
            content: await this._generateDataFetchingUtils(context)
        });

        // Form utilities
        files.push({
            path: path.join(utilsDir, 'form-utils.ts'),
            content: await this._generateFormUtils(context)
        });

        // Table utilities
        files.push({
            path: path.join(utilsDir, 'table-utils.ts'),
            content: await this._generateTableUtils(context)
        });

        return files;
    }

    /**
     * Generate tests
     */
    async _generateTests(context) {
        const files = [];

        // Component tests
        for (const component of context.sharedComponents) {
            files.push({
                path: path.join(
                    context.outputDir,
                    '__tests__/components',
                    `${this.stringUtils.toKebabCase(component.name)}.test.tsx`
                ),
                content: await this._generateComponentTest(component, context)
            });
        }

        // Page tests
        for (const [resource, routes] of Object.entries(context.resourceGroups)) {
            files.push({
                path: path.join(
                    context.outputDir,
                    '__tests__/pages',
                    `${this.stringUtils.toKebabCase(resource)}.test.tsx`
                ),
                content: await this._generatePageTest(resource, routes, context)
            });
        }

        return files;
    }

    /**
     * Generate Storybook stories
     */
    async _generateStories(context) {
        const files = [];
        const storiesDir = path.join(context.outputDir, this.options.outputSubdir, 'stories');

        // Component stories
        for (const component of context.sharedComponents) {
            files.push({
                path: path.join(storiesDir, `${this.stringUtils.toKebabCase(component.name)}.stories.tsx`),
                content: await this._generateComponentStory(component, context)
            });
        }

        // Form stories
        files.push({
            path: path.join(storiesDir, 'forms.stories.tsx'),
            content: await this._generateFormStories(context)
        });

        // Table stories
        files.push({
            path: path.join(storiesDir, 'tables.stories.tsx'),
            content: await this._generateTableStories(context)
        });

        return files;
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Register template helpers
     */
    _registerTemplateHelpers() {
        // UI component helpers
        this.templateEngine.registerHelper('uiComponent', (component) => {
            return this.uiComponents[this.componentOptions.uiLibrary]?.[component] || component;
        });

        // Import helpers
        this.templateEngine.registerHelper('uiImport', (components) => {
            return this._generateUIImport(components);
        });

        // Form helpers
        this.templateEngine.registerHelper('formField', (field) => {
            return this._generateFormField(field);
        });

        // Data fetching helpers
        this.templateEngine.registerHelper('fetchHook', (resource, operation) => {
            return this._generateFetchHook(resource, operation);
        });

        // Type helpers
        this.templateEngine.registerHelper('tsInterface', (schema) => {
            return this.tsUtils.schemaToInterface(schema);
        });

        // Accessibility helpers
        this.templateEngine.registerHelper('a11y', (type, value) => {
            return this._generateA11yAttribute(type, value);
        });
    }

    /**
     * Get UI components mapping
     */
    _getUIComponents() {
        return {
            tailwind: {
                button: 'Button',
                input: 'Input',
                select: 'Select',
                card: 'Card',
                modal: 'Dialog',
                table: 'Table',
                form: 'Form',
                loader: 'Spinner'
            },
            mui: {
                button: 'Button',
                input: 'TextField',
                select: 'Select',
                card: 'Card',
                modal: 'Dialog',
                table: 'DataGrid',
                form: 'Box',
                loader: 'CircularProgress'
            },
            chakra: {
                button: 'Button',
                input: 'Input',
                select: 'Select',
                card: 'Box',
                modal: 'Modal',
                table: 'Table',
                form: 'VStack',
                loader: 'Spinner'
            }
        };
    }

    /**
     * Check if UI library is supported
     */
    _isUILibrarySupported(library) {
        return ['tailwind', 'mui', 'chakra', 'custom'].includes(library);
    }

    /**
     * Group routes by resource
     */
    _groupRoutesByResource(routes) {
        const groups = {};

        for (const route of routes) {
            const resource = this._extractResource(route.path);
            if (!groups[resource]) {
                groups[resource] = [];
            }
            groups[resource].push(route);
        }

        return groups;
    }

    /**
     * Extract resource name from path
     */
    _extractResource(path) {
        // Remove leading slash and split
        const parts = path.replace(/^\//, '').split('/');

        // Find the main resource (usually first non-parameter segment)
        for (const part of parts) {
            if (!part.includes('{')) {
                return part;
            }
        }

        return 'resource';
    }

    /**
     * Analyze component schemas
     */
    _analyzeComponentSchemas(schemas) {
        const componentSchemas = {};

        for (const [name, schema] of Object.entries(schemas)) {
            if (this._isComponentSchema(schema)) {
                componentSchemas[name] = {
                    ...schema,
                    componentType: this._determineComponentType(schema)
                };
            }
        }

        return componentSchemas;
    }

    /**
     * Check if schema should generate a component
     */
    _isComponentSchema(schema) {
        // Generate components for object schemas with properties
        return schema.type === 'object' && schema.properties && Object.keys(schema.properties).length > 0;
    }

    /**
     * Determine component type from schema
     */
    _determineComponentType(schema) {
        // Analyze schema properties to determine best component type
        const propertyCount = Object.keys(schema.properties || {}).length;
        const hasArrays = Object.values(schema.properties || {}).some(p => p.type === 'array');
        const hasFiles = Object.values(schema.properties || {}).some(p => p.format === 'binary');

        if (hasFiles) return 'upload';
        if (hasArrays && propertyCount > 5) return 'complex';
        if (propertyCount > 10) return 'wizard';
        if (propertyCount > 5) return 'form';
        return 'simple';
    }

    /**
     * Identify shared components
     */
    _identifySharedComponents(schemas) {
        const components = [];

        // Common UI components
        components.push(
            { name: 'Card', type: 'ui' },
            { name: 'Badge', type: 'ui' },
            { name: 'Avatar', type: 'ui' },
            { name: 'Dropdown', type: 'ui' },
            { name: 'Tabs', type: 'ui' },
            { name: 'Breadcrumb', type: 'navigation' },
            { name: 'Pagination', type: 'navigation' },
            { name: 'SearchBar', type: 'input' },
            { name: 'FilterPanel', type: 'input' },
            { name: 'ConfirmDialog', type: 'feedback' },
            { name: 'Toast', type: 'feedback' }
        );

        return components;
    }

    /**
     * Prepare UI configuration
     */
    _prepareUIConfig() {
        const config = {
            library: this.componentOptions.uiLibrary,
            theme: {
                colors: {
                    primary: '#3B82F6',
                    secondary: '#8B5CF6',
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444'
                }
            }
        };

        // Add library-specific config
        switch (this.componentOptions.uiLibrary) {
            case 'tailwind':
                config.cssFramework = 'tailwindcss';
                config.components = '@/components/ui';
                break;
            case 'mui':
                config.theme = { ...config.theme, palette: config.theme.colors };
                break;
            case 'chakra':
                config.theme = { ...config.theme, colors: config.theme.colors };
                break;
        }

        return config;
    }

    /**
     * Prepare form configuration
     */
    _prepareFormConfig() {
        return {
            library: this.componentOptions.formLibrary,
            validation: 'zod',
            defaultValues: true,
            autoSave: false,
            showErrors: 'onBlur'
        };
    }

    /**
     * Prepare data fetching configuration
     */
    _prepareDataFetchingConfig() {
        const config = {
            library: this.componentOptions.dataFetching,
            options: {}
        };

        switch (this.componentOptions.dataFetching) {
            case 'swr':
                config.options = {
                    revalidateOnFocus: false,
                    revalidateOnReconnect: true,
                    dedupingInterval: 2000
                };
                break;
            case 'react-query':
                config.options = {
                    staleTime: 5 * 60 * 1000,
                    cacheTime: 10 * 60 * 1000,
                    retry: 3
                };
                break;
        }

        return config;
    }

    /**
     * Check if schema is suitable for form
     */
    _isFormSchema(schema) {
        return schema.type === 'object' &&
            schema.properties &&
            Object.keys(schema.properties).length > 0 &&
            Object.keys(schema.properties).length < 20; // Arbitrary limit
    }

    /**
     * Generate shared component
     */
    async _generateSharedComponent(component, context) {
        const template = await this.templateEngine.load(`components/${component.type}/${component.name.toLowerCase()}.tsx.template`);

        return template.render({
            name: component.name,
            type: component.type,
            uiLibrary: this.componentOptions.uiLibrary,
            typescript: this.componentOptions.typescript,
            accessibility: this.componentOptions.accessibility
        });
    }

    /**
     * Generate form component
     */
    async _generateFormComponent(componentName, context) {
        const template = await this.templateEngine.load(`components/forms/${componentName}.tsx.template`);

        return template.render({
            name: componentName,
            formLibrary: this.componentOptions.formLibrary,
            uiLibrary: this.componentOptions.uiLibrary,
            typescript: this.componentOptions.typescript,
            accessibility: this.componentOptions.accessibility
        });
    }

    /**
     * Generate schema form
     */
    async _generateSchemaForm(schemaName, schema, context) {
        return this.templates.form.render({
            name: schemaName,
            schema: schema,
            fields: this._analyzeFormFields(schema),
            formLibrary: this.componentOptions.formLibrary,
            uiLibrary: this.componentOptions.uiLibrary,
            validation: true,
            typescript: this.componentOptions.typescript
        });
    }

    /**
     * Analyze form fields from schema
     */
    _analyzeFormFields(schema) {
        const fields = [];

        for (const [name, property] of Object.entries(schema.properties || {})) {
            fields.push({
                name,
                type: this._getFieldType(property),
                label: this.stringUtils.toTitleCase(name),
                required: schema.required?.includes(name),
                validation: this._getFieldValidation(property),
                placeholder: property.description || `Enter ${name}`,
                ...property
            });
        }

        return fields;
    }

    /**
     * Get field type from property
     */
    _getFieldType(property) {
        if (property.enum) return 'select';
        if (property.format === 'date') return 'date';
        if (property.format === 'date-time') return 'datetime';
        if (property.format === 'email') return 'email';
        if (property.format === 'uri' || property.format === 'url') return 'url';
        if (property.format === 'binary') return 'file';
        if (property.type === 'boolean') return 'checkbox';
        if (property.type === 'integer' || property.type === 'number') return 'number';
        if (property.type === 'array') return 'array';
        if (property.maxLength && property.maxLength > 200) return 'textarea';
        return 'text';
    }

    /**
     * Get field validation rules
     */
    _getFieldValidation(property) {
        const rules = [];

        if (property.minLength) rules.push(`min:${property.minLength}`);
        if (property.maxLength) rules.push(`max:${property.maxLength}`);
        if (property.minimum) rules.push(`min:${property.minimum}`);
        if (property.maximum) rules.push(`max:${property.maximum}`);
        if (property.pattern) rules.push(`pattern:${property.pattern}`);
        if (property.format === 'email') rules.push('email');
        if (property.format === 'uri' || property.format === 'url') rules.push('url');

        return rules;
    }

    /**
     * Generate resource table
     */
    async _generateResourceTable(resource, listRoute, context) {
        const response = listRoute.operation.responses['200'];
        const schema = response?.content?.['application/json']?.schema;

        // Extract array items schema
        let itemSchema;
        if (schema?.type === 'array') {
            itemSchema = schema.items;
        } else if (schema?.properties) {
            // Look for common patterns like data, items, results
            const arrayProp = Object.entries(schema.properties).find(
                ([key, prop]) => prop.type === 'array' && ['data', 'items', 'results'].includes(key)
            );
            if (arrayProp) {
                itemSchema = arrayProp[1].items;
            }
        }

        const columns = this._generateTableColumns(itemSchema);

        return this.templates.table.render({
            name: `${this.stringUtils.toPascalCase(resource)}Table`,
            resource,
            columns,
            features: {
                sorting: true,
                filtering: true,
                pagination: true,
                selection: true,
                actions: true
            },
            uiLibrary: this.componentOptions.uiLibrary
        });
    }

    /**
     * Generate table columns from schema
     */
    _generateTableColumns(schema) {
        if (!schema?.properties) return [];

        const columns = [];
        const skipFields = ['id', '_id', 'password', 'secret'];

        for (const [key, property] of Object.entries(schema.properties)) {
            if (skipFields.includes(key.toLowerCase())) continue;

            columns.push({
                key,
                header: this.stringUtils.toTitleCase(key),
                type: property.type,
                format: property.format,
                sortable: ['string', 'number', 'integer', 'boolean'].includes(property.type),
                filterable: property.type === 'string',
                width: this._estimateColumnWidth(key, property)
            });
        }

        return columns;
    }

    /**
     * Estimate column width
     */
    _estimateColumnWidth(key, property) {
        if (property.format === 'date' || property.format === 'date-time') return 150;
        if (property.type === 'boolean') return 100;
        if (property.maxLength && property.maxLength < 50) return 150;
        if (key.toLowerCase().includes('name') || key.toLowerCase().includes('title')) return 200;
        return 'auto';
    }

    /**
     * Generate navigation structure
     */
    _generateNavigation(context) {
        const navigation = [];

        for (const [resource, routes] of Object.entries(context.resourceGroups)) {
            const hasListRoute = routes.some(r => r.method === 'get' && !r.path.includes('{'));

            if (hasListRoute) {
                navigation.push({
                    label: this.stringUtils.toTitleCase(resource),
                    href: `/${this.stringUtils.toKebabCase(resource)}`,
                    icon: this._getResourceIcon(resource)
                });
            }
        }

        return navigation;
    }

    /**
     * Get resource icon
     */
    _getResourceIcon(resource) {
        const iconMap = {
            users: 'Users',
            products: 'Package',
            orders: 'ShoppingCart',
            categories: 'Tag',
            settings: 'Settings',
            dashboard: 'Home'
        };

        return iconMap[resource.toLowerCase()] || 'File';
    }

    /**
     * Generate navigation component
     */
    async _generateNavigationComponent(context) {
        const template = await this.templateEngine.load('components/navigation.tsx.template');

        return template.render({
            navigation: this._generateNavigation(context),
            uiLibrary: this.componentOptions.uiLibrary,
            responsive: true
        });
    }

    /**
     * Generate header component
     */
    async _generateHeaderComponent(context) {
        const template = await this.templateEngine.load('components/header.tsx.template');

        return template.render({
            title: context.swagger.info?.title,
            uiLibrary: this.componentOptions.uiLibrary,
            features: {
                search: true,
                notifications: true,
                userMenu: true,
                darkMode: true
            }
        });
    }

    /**
     * Generate footer component
     */
    async _generateFooterComponent(context) {
        const template = await this.templateEngine.load('components/footer.tsx.template');

        return template.render({
            copyright: `© ${new Date().getFullYear()} ${context.swagger.info?.title}`,
            links: [
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'API Docs', href: '/api-docs' }
            ],
            uiLibrary: this.componentOptions.uiLibrary
        });
    }

    /**
     * Analyze resource operations
     */
    _analyzeResourceOperations(routes) {
        const operations = {};

        for (const route of routes) {
            if (route.method === 'get' && !route.path.includes('{')) {
                operations.list = route;
            } else if (route.method === 'get' && route.path.includes('{')) {
                operations.get = route;
            } else if (route.method === 'post') {
                operations.create = route;
            } else if (route.method === 'put' || route.method === 'patch') {
                operations.update = route;
            } else if (route.method === 'delete') {
                operations.delete = route;
            }
        }

        return operations;
    }

    /**
     * Generate data fetching code
     */
    _generateDataFetching(type, resource, route, context) {
        const config = {
            type,
            resource,
            endpoint: route.path,
            method: route.method,
            library: this.componentOptions.dataFetching
        };

        switch (type) {
            case 'list':
                return this._generateListDataFetching(config);
            case 'detail':
                return this._generateDetailDataFetching(config);
            case 'create':
                return this._generateCreateDataFetching(config);
            case 'edit':
                return this._generateEditDataFetching(config);
            default:
                return null;
        }
    }

    /**
     * Generate list data fetching
     */
    _generateListDataFetching(config) {
        const hookName = `use${this.stringUtils.toPascalCase(config.resource)}List`;

        return {
            hook: hookName,
            import: `import { ${hookName} } from './hooks'`,
            usage: `const { data, error, isLoading, mutate } = ${hookName}(params)`,
            options: {
                revalidateOnFocus: false,
                dedupingInterval: 5000
            }
        };
    }

    /**
     * Generate detail data fetching
     */
    _generateDetailDataFetching(config) {
        const hookName = `use${this.stringUtils.toPascalCase(config.resource)}`;

        return {
            hook: hookName,
            import: `import { ${hookName} } from '../hooks'`,
            usage: `const { data, error, isLoading } = ${hookName}(id)`,
            options: {
                revalidateOnFocus: true
            }
        };
    }

    /**
     * Generate create data fetching
     */
    _generateCreateDataFetching(config) {
        const hookName = `useCreate${this.stringUtils.toPascalCase(config.resource)}`;

        return {
            hook: hookName,
            import: `import { ${hookName} } from '../hooks'`,
            usage: `const { mutate, isLoading, error } = ${hookName}()`,
            options: {
                onSuccess: 'router.push(`/${resource}`)'
            }
        };
    }

    /**
     * Generate edit data fetching
     */
    _generateEditDataFetching(config) {
        const hookName = `useUpdate${this.stringUtils.toPascalCase(config.resource)}`;
        const detailHook = `use${this.stringUtils.toPascalCase(config.resource)}`;

        return {
            hook: hookName,
            detailHook,
            import: `import { ${hookName}, ${detailHook} } from '../../hooks'`,
            usage: `const { mutate, isLoading, error } = ${hookName}(id)`,
            detailUsage: `const { data: initialData } = ${detailHook}(id)`,
            options: {
                onSuccess: 'router.push(`/${resource}/${id}`)'
            }
        };
    }

    /**
     * Generate filter component
     */
    async _generateFilterComponent(resource, route, context) {
        // Extract query parameters from route
        const queryParams = route.operation.parameters?.filter(p => p.in === 'query') || [];

        const filters = queryParams.map(param => ({
            name: param.name,
            type: this._getFilterType(param),
            label: this.stringUtils.toTitleCase(param.name),
            options: param.enum,
            ...param
        }));

        const template = await this.templateEngine.load('components/filters.tsx.template');

        return template.render({
            resource,
            filters,
            uiLibrary: this.componentOptions.uiLibrary
        });
    }

    /**
     * Get filter type from parameter
     */
    _getFilterType(param) {
        if (param.enum) return 'select';
        if (param.schema?.type === 'boolean') return 'checkbox';
        if (param.schema?.format === 'date') return 'dateRange';
        if (param.schema?.type === 'number' || param.schema?.type === 'integer') return 'range';
        return 'text';
    }

    /**
     * Generate actions component
     */
    async _generateActionsComponent(resource, context) {
        const template = await this.templateEngine.load('components/actions.tsx.template');

        return template.render({
            resource,
            actions: [
                { type: 'create', label: `New ${this.stringUtils.toTitleCase(resource)}` },
                { type: 'export', label: 'Export' },
                { type: 'import', label: 'Import' }
            ],
            uiLibrary: this.componentOptions.uiLibrary
        });
    }

    /**
     * Generate detail component
     */
    async _generateDetailComponent(resource, route, context) {
        const response = route.operation.responses['200'];
        const schema = response?.content?.['application/json']?.schema;

        const fields = this._analyzeDetailFields(schema);

        const template = await this.templateEngine.load('components/detail.tsx.template');

        return template.render({
            resource,
            fields,
            uiLibrary: this.componentOptions.uiLibrary,
            features: {
                edit: true,
                delete: true,
                share: true,
                print: true
            }
        });
    }

    /**
     * Analyze detail fields
     */
    _analyzeDetailFields(schema) {
        if (!schema?.properties) return [];

        const fields = [];
        const sections = this._groupFieldsBySection(schema.properties);

        for (const [section, properties] of Object.entries(sections)) {
            fields.push({
                section: section === 'default' ? null : section,
                fields: Object.entries(properties).map(([key, prop]) => ({
                    key,
                    label: this.stringUtils.toTitleCase(key),
                    type: prop.type,
                    format: prop.format,
                    value: `data.${key}`
                }))
            });
        }

        return fields;
    }

    /**
     * Group fields by section
     */
    _groupFieldsBySection(properties) {
        const sections = { default: {} };

        for (const [key, prop] of Object.entries(properties)) {
            // Group by custom extension or heuristics
            const section = prop['x-section'] || 'default';

            if (!sections[section]) {
                sections[section] = {};
            }

            sections[section][key] = prop;
        }

        return sections;
    }

    /**
     * Generate resource hooks
     */
    async _generateResourceHooks(resource, operations, context) {
        return this.templates.hooks.render({
            resource,
            operations,
            dataFetching: this.componentOptions.dataFetching,
            apiClient: context.apiConfig?.client || 'fetch',
            typescript: this.componentOptions.typescript
        });
    }

    /**
     * Generate resource types
     */
    async _generateResourceTypes(resource, operations, context) {
        const types = [];

        // Request/Response types for each operation
        for (const [opType, route] of Object.entries(operations)) {
            if (!route) continue;

            // Request type
            if (route.operation.requestBody) {
                const schema = route.operation.requestBody.content?.['application/json']?.schema;
                if (schema) {
                    types.push({
                        name: `${this.stringUtils.toPascalCase(resource)}${this.stringUtils.toPascalCase(opType)}Request`,
                        definition: this.tsUtils.schemaToInterface(schema)
                    });
                }
            }

            // Response type
            const response = route.operation.responses?.['200'] || route.operation.responses?.['201'];
            if (response?.content?.['application/json']?.schema) {
                types.push({
                    name: `${this.stringUtils.toPascalCase(resource)}${this.stringUtils.toPascalCase(opType)}Response`,
                    definition: this.tsUtils.schemaToInterface(response.content['application/json'].schema)
                });
            }
        }

        // Resource entity type
        const entitySchema = this._extractEntitySchema(operations);
        if (entitySchema) {
            types.push({
                name: this.stringUtils.toPascalCase(resource),
                definition: this.tsUtils.schemaToInterface(entitySchema)
            });
        }

        return this.templates.types.render({ types });
    }

    /**
     * Extract entity schema from operations
     */
    _extractEntitySchema(operations) {
        // Try to extract from detail response first
        if (operations.get) {
            const response = operations.get.operation.responses?.['200'];
            const schema = response?.content?.['application/json']?.schema;
            if (schema?.properties) return schema;
        }

        // Try from list response
        if (operations.list) {
            const response = operations.list.operation.responses?.['200'];
            const schema = response?.content?.['application/json']?.schema;

            if (schema?.type === 'array' && schema.items) {
                return schema.items;
            }

            // Check for paginated response
            if (schema?.properties) {
                const dataProperty = Object.values(schema.properties).find(p => p.type === 'array');
                if (dataProperty?.items) {
                    return dataProperty.items;
                }
            }
        }

        return null;
    }

    /**
     * Generate API client
     */
    async _generateApiClient(context) {
        const template = await this.templateEngine.load('lib/api-client.ts.template');

        return template.render({
            baseUrl: context.apiConfig?.baseUrl || '/api',
            timeout: 30000,
            interceptors: true,
            typescript: this.componentOptions.typescript
        });
    }

    /**
     * Generate data fetching utilities
     */
    async _generateDataFetchingUtils(context) {
        const template = await this.templateEngine.load(`lib/${this.componentOptions.dataFetching}.ts.template`);

        return template.render({
            config: context.dataFetchingConfig,
            typescript: this.componentOptions.typescript
        });
    }

    /**
     * Generate form utilities
     */
    async _generateFormUtils(context) {
        const template = await this.templateEngine.load('lib/form-utils.ts.template');

        return template.render({
            formLibrary: this.componentOptions.formLibrary,
            validation: 'zod',
            typescript: this.componentOptions.typescript
        });
    }

    /**
     * Generate table utilities
     */
    async _generateTableUtils(context) {
        const template = await this.templateEngine.load('lib/table-utils.ts.template');

        return template.render({
            features: {
                sorting: true,
                filtering: true,
                pagination: true,
                export: true
            },
            typescript: this.componentOptions.typescript
        });
    }

    /**
     * Generate component test
     */
    async _generateComponentTest(component, context) {
        const template = await this.templateEngine.load('tests/component.test.tsx.template');

        return template.render({
            component,
            testFramework: 'jest',
            testingLibrary: 'react-testing-library',
            assertions: [
                'renders without crashing',
                'handles user interactions',
                'displays correct data',
                'meets accessibility standards'
            ]
        });
    }

    /**
     * Generate page test
     */
    async _generatePageTest(resource, routes, context) {
        const template = await this.templateEngine.load('tests/page.test.tsx.template');

        return template.render({
            resource,
            routes,
            testFramework: 'jest',
            e2e: false,
            mocks: true
        });
    }

    /**
     * Generate component story
     */
    async _generateComponentStory(component, context) {
        const template = await this.templateEngine.load('stories/component.stories.tsx.template');

        return template.render({
            component,
            stories: [
                { name: 'Default', props: {} },
                { name: 'With Props', props: { /* default props */ } },
                { name: 'Interactive', props: { interactive: true } }
            ]
        });
    }

    /**
     * Generate form stories
     */
    async _generateFormStories(context) {
        const template = await this.templateEngine.load('stories/forms.stories.tsx.template');

        return template.render({
            forms: Object.keys(context.componentSchemas).filter(name =>
                this._isFormSchema(context.componentSchemas[name])
            ),
            formLibrary: this.componentOptions.formLibrary
        });
    }

    /**
     * Generate table stories
     */
    async _generateTableStories(context) {
        const template = await this.templateEngine.load('stories/tables.stories.tsx.template');

        return template.render({
            tables: Object.keys(context.resourceGroups),
            mockData: true
        });
    }

    /**
     * Generate UI import statement
     */
    _generateUIImport(components) {
        const imports = [];

        switch (this.componentOptions.uiLibrary) {
            case 'tailwind':
                imports.push(`import { ${components.join(', ')} } from '@/components/ui'`);
                break;
            case 'mui':
                imports.push(`import { ${components.join(', ')} } from '@mui/material'`);
                break;
            case 'chakra':
                imports.push(`import { ${components.join(', ')} } from '@chakra-ui/react'`);
                break;
        }

        return imports.join('\n');
    }

    /**
     * Generate form field
     */
    _generateFormField(field) {
        const fieldType = this._getFieldType(field);
        const componentMap = {
            text: 'TextInput',
            number: 'NumberInput',
            email: 'EmailInput',
            password: 'PasswordInput',
            textarea: 'TextArea',
            select: 'Select',
            checkbox: 'Checkbox',
            radio: 'RadioGroup',
            date: 'DatePicker',
            datetime: 'DateTimePicker',
            file: 'FileUpload',
            array: 'FieldArray'
        };

        return componentMap[fieldType] || 'TextInput';
    }

    /**
     * Generate fetch hook
     */
    _generateFetchHook(resource, operation) {
        const hookName = `use${this.stringUtils.toPascalCase(resource)}${this.stringUtils.toPascalCase(operation)}`;

        switch (this.componentOptions.dataFetching) {
            case 'swr':
                return `useSWR(key, fetcher, options)`;
            case 'react-query':
                return `useQuery({ queryKey, queryFn, ...options })`;
            default:
                return `use${operation}(params)`;
        }
    }

    /**
     * Generate accessibility attribute
     */
    _generateA11yAttribute(type, value) {
        const a11yMap = {
            label: `aria-label="${value}"`,
            description: `aria-describedby="${value}"`,
            required: 'aria-required="true"',
            invalid: 'aria-invalid="true"',
            expanded: `aria-expanded="${value}"`,
            hidden: 'aria-hidden="true"',
            role: `role="${value}"`
        };

        return a11yMap[type] || '';
    }
}

export default PageComponentGenerator;