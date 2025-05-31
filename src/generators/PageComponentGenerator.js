/**
 * ============================================================================
 * SWAGGER-TO-NEXTJS GENERATOR - AI PROMPT
 * ============================================================================
 * FILE: src/generators/PageComponentGenerator.js
 * VERSION: 2025-05-30 11:34:23
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

const path = require('path');
const BaseGenerator = require('./BaseGenerator');
const GeneratorError = require('../errors/GeneratorError');
const PathUtils = require('../utils/PathUtils');
const SchemaUtils = require('../utils/SchemaUtils');
const StringUtils = require('../utils/StringUtils');
const ValidationUtils = require('../utils/ValidationUtils');

/**
 * Generates Next.js page components from OpenAPI specs
 */
class PageComponentGenerator extends BaseGenerator {
    constructor(options = {}) {
        super({
            ...options,
            templateDir: 'pages',
            outputSubdir: 'app'
        });

        // Initialize utilities
        this.pathUtils = new PathUtils();
        this.schemaUtils = new SchemaUtils();
        this.stringUtils = new StringUtils();
        this.validationUtils = new ValidationUtils();

        // Component generation options
        this.componentOptions = {
            typescript: true,
            generateTests: true,
            generateStories: true,
            generateDocs: true,
            uiLibrary: 'shadcn', // 'shadcn' | 'mui' | 'antd' | 'chakra'
            dataFetching: 'swr', // 'swr' | 'react-query' | 'native'
            formLibrary: 'react-hook-form', // 'react-hook-form' | 'formik'
            validation: 'zod', // 'zod' | 'yup' | 'joi'
            styling: 'tailwind', // 'tailwind' | 'css-modules' | 'styled-components'
            i18n: true,
            a11y: true,
            ...options.componentOptions
        };

        // Template configurations
        this.templates = {
            page: null,
            component: null,
            form: null,
            table: null,
            modal: null,
            loading: null,
            error: null,
            layout: null,
            hooks: null,
            types: null,
            test: null,
            story: null
        };

        // Component registry to track generated components
        this.componentRegistry = new Map();
    }

    /**
     * Initialize the generator
     */
    async initialize(context) {
        await super.initialize(context);
        await this.loadTemplates();
        await this.registerCustomHelpers();
    }

    /**
     * Load page component templates
     */
    async loadTemplates() {
        this.logger.debug('Loading page component templates');

        const templateLoader = this.templateLoader || this.templateEngine;

        // Load all templates
        this.templates.page = await templateLoader.load('page.tsx.template');
        this.templates.component = await templateLoader.load('components.tsx.template');
        this.templates.form = await templateLoader.load('form.tsx.template');
        this.templates.table = await templateLoader.load('table.tsx.template');
        this.templates.modal = await templateLoader.load('modal.tsx.template');
        this.templates.loading = await templateLoader.load('loading.tsx.template');
        this.templates.error = await templateLoader.load('error.tsx.template');
        this.templates.layout = await templateLoader.load('layout.tsx.template');
        this.templates.hooks = await templateLoader.load('hooks.ts.template');
        this.templates.types = await templateLoader.load('types.ts.template');

        if (this.componentOptions.generateTests) {
            this.templates.test = await templateLoader.load('component.test.tsx.template');
        }

        if (this.componentOptions.generateStories) {
            this.templates.story = await templateLoader.load('component.stories.tsx.template');
        }
    }

    /**
     * Register custom template helpers
     */
    async registerCustomHelpers() {
        if (!this.templateEngine) return;

        // Component naming helpers
        this.templateEngine.registerHelper('componentName', (name) => {
            return this.stringUtils.toPascalCase(name) + 'Page';
        });

        this.templateEngine.registerHelper('hookName', (operation) => {
            return 'use' + this.stringUtils.toPascalCase(operation);
        });

        // UI library specific helpers
        this.templateEngine.registerHelper('uiComponent', (component) => {
            return this._getUIComponentImport(component);
        });

        // Data fetching helpers
        this.templateEngine.registerHelper('fetchHook', (operation) => {
            return this._generateDataFetchingHook(operation);
        });

        // Form helpers
        this.templateEngine.registerHelper('formSchema', (schema) => {
            return this._generateFormSchema(schema);
        });

        // i18n helpers
        this.templateEngine.registerHelper('t', (key) => {
            return this.componentOptions.i18n ? `{t('${key}')}` : `"${key}"`;
        });
    }

    /**
     * Validate page component generation context
     */
    async doValidate(context) {
        if (!context.swagger) {
            throw new GeneratorError('Swagger specification is required', {
                code: 'MISSING_SWAGGER'
            });
        }

        if (!context.swagger.paths || Object.keys(context.swagger.paths).length === 0) {
            throw new GeneratorError('No API paths found in specification', {
                code: 'NO_PATHS'
            });
        }

        // Validate UI library support
        const supportedUILibraries = ['shadcn', 'mui', 'antd', 'chakra'];
        if (!supportedUILibraries.includes(this.componentOptions.uiLibrary)) {
            throw new GeneratorError(`Unsupported UI library: ${this.componentOptions.uiLibrary}`, {
                code: 'UNSUPPORTED_UI_LIBRARY',
                supportedLibraries: supportedUILibraries
            });
        }
    }

    /**
     * Prepare page component generation context
     */
    async doPrepare(context) {
        const prepared = await super.doPrepare(context);

        return {
            ...prepared,
            pageGroups: this._groupPagesByResource(context.swagger.paths),
            sharedComponents: this._identifySharedComponents(context.swagger),
            layouts: this._extractLayouts(context.swagger),
            hooks: this._extractCustomHooks(context.swagger),
            theme: this._prepareTheme(context),
            i18nKeys: this._extractI18nKeys(context.swagger)
        };
    }

    /**
     * Generate page components
     */
    async doGenerate(context) {
        const files = [];

        // Emit generation start
        this.emit('generation:start', {
            totalPages: Object.keys(context.pageGroups).length
        });

        // Generate shared components first
        files.push(...await this._generateSharedComponents(context));

        // Generate layouts
        files.push(...await this._generateLayouts(context));

        // Generate hooks
        files.push(...await this._generateHooks(context));

        // Generate page components
        for (const [resource, pageGroup] of Object.entries(context.pageGroups)) {
            files.push(...await this._generatePageFiles(resource, pageGroup, context));
        }

        // Generate index and barrel exports
        files.push(...await this._generateIndexFiles(context));

        // Generate theme configuration
        if (this.componentOptions.styling === 'tailwind') {
            files.push(...await this._generateThemeFiles(context));
        }

        // Emit generation complete
        this.emit('generation:complete', {
            filesGenerated: files.length
        });

        return files;
    }

    /**
     * Generate shared components
     */
    async _generateSharedComponents(context) {
        const files = [];
        const componentsDir = path.join(this.outputDir, 'components');

        // Loading components
        files.push({
            path: path.join(componentsDir, 'loading.tsx'),
            content: await this._renderTemplate(this.templates.loading, {
                variants: ['spinner', 'skeleton', 'progress'],
                uiLibrary: this.componentOptions.uiLibrary
            }),
            options: { overwrite: true }
        });

        // Error components
        files.push({
            path: path.join(componentsDir, 'error-boundary.tsx'),
            content: await this._renderTemplate(this.templates.error, {
                errorTypes: ['404', '500', 'network', 'permission'],
                recovery: true,
                logging: true
            }),
            options: { overwrite: true }
        });

        // Common UI components
        for (const component of context.sharedComponents) {
            files.push(...await this._generateSharedComponent(component, context));
        }

        return files;
    }

    /**
     * Generate shared component
     */
    async _generateSharedComponent(component, context) {
        const files = [];
        const componentDir = path.join(this.outputDir, 'components', component.type);
        const componentName = this.stringUtils.toPascalCase(component.name);

        // Main component file
        files.push({
            path: path.join(componentDir, `${componentName}.tsx`),
            content: await this._renderTemplate(this.templates.component, {
                ...component,
                componentName,
                imports: this._generateComponentImports(component),
                props: this._generateComponentProps(component),
                uiLibrary: this.componentOptions.uiLibrary,
                a11y: this.componentOptions.a11y
            }),
            options: { overwrite: true }
        });

        // Component types
        if (this.componentOptions.typescript) {
            files.push({
                path: path.join(componentDir, `${componentName}.types.ts`),
                content: await this._generateComponentTypes(component),
                options: { overwrite: true }
            });
        }

        // Component tests
        if (this.componentOptions.generateTests) {
            files.push({
                path: path.join(componentDir, `${componentName}.test.tsx`),
                content: await this._renderTemplate(this.templates.test, {
                    componentName,
                    testCases: this._generateComponentTestCases(component)
                }),
                options: { overwrite: true }
            });
        }

        // Storybook stories
        if (this.componentOptions.generateStories) {
            files.push({
                path: path.join(componentDir, `${componentName}.stories.tsx`),
                content: await this._renderTemplate(this.templates.story, {
                    componentName,
                    stories: this._generateComponentStories(component)
                }),
                options: { overwrite: true }
            });
        }

        // Register component
        this.componentRegistry.set(component.name, {
            name: componentName,
            path: componentDir,
            type: component.type
        });

        return files;
    }

    /**
     * Generate layouts
     */
    async _generateLayouts(context) {
        const files = [];
        const layoutsDir = path.join(this.outputDir, 'layouts');

        for (const layout of context.layouts) {
            files.push({
                path: path.join(layoutsDir, `${layout.name}.tsx`),
                content: await this._renderTemplate(this.templates.layout, {
                    ...layout,
                    navigation: this._generateNavigation(context),
                    auth: context.features.hasAuthentication,
                    i18n: this.componentOptions.i18n,
                    theme: context.theme
                }),
                options: { overwrite: true }
            });
        }

        return files;
    }

    /**
     * Generate custom hooks
     */
    async _generateHooks(context) {
        const files = [];
        const hooksDir = path.join(this.outputDir, 'hooks');

        for (const hook of context.hooks) {
            files.push({
                path: path.join(hooksDir, `${hook.name}.ts`),
                content: await this._renderTemplate(this.templates.hooks, {
                    ...hook,
                    dataFetching: this.componentOptions.dataFetching,
                    typescript: this.componentOptions.typescript
                }),
                options: { overwrite: true }
            });
        }

        return files;
    }

    /**
     * Generate page files for a resource
     */
    async _generatePageFiles(resource, pageGroup, context) {
        const files = [];
        const resourceName = this.stringUtils.toPascalCase(resource);
        const pageDir = path.join(this.outputDir, resource);

        // List page (index)
        if (pageGroup.operations.list) {
            files.push(...await this._generateListPage(resource, pageGroup, context));
        }

        // Detail page ([id])
        if (pageGroup.operations.get) {
            files.push(...await this._generateDetailPage(resource, pageGroup, context));
        }

        // Create page (new)
        if (pageGroup.operations.create) {
            files.push(...await this._generateCreatePage(resource, pageGroup, context));
        }

        // Edit page ([id]/edit)
        if (pageGroup.operations.update) {
            files.push(...await this._generateEditPage(resource, pageGroup, context));
        }

        // Additional custom pages
        for (const customPage of pageGroup.customPages || []) {
            files.push(...await this._generateCustomPage(resource, customPage, context));
        }

        return files;
    }

    /**
     * Generate list page
     */
    async _generateListPage(resource, pageGroup, context) {
        const files = [];
        const pageName = `${this.stringUtils.toPascalCase(resource)}ListPage`;
        const pageDir = path.join(this.outputDir, resource);

        // Main page component
        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this._renderTemplate(this.templates.page, {
                pageName,
                pageType: 'list',
                resource,
                operations: pageGroup.operations,
                components: {
                    table: await this._generateDataTable(resource, pageGroup.operations.list, context),
                    filters: await this._generateFilters(pageGroup.operations.list, context),
                    actions: await this._generateActions(pageGroup.operations, context)
                },
                hooks: this._generatePageHooks(pageGroup.operations, context),
                seo: this._generateSEOData(resource, 'list', context)
            }),
            options: { overwrite: true }
        });

        // Loading state
        files.push({
            path: path.join(pageDir, 'loading.tsx'),
            content: await this._generateLoadingState('list'),
            options: { overwrite: true }
        });

        // Error state
        files.push({
            path: path.join(pageDir, 'error.tsx'),
            content: await this._generateErrorState('list'),
            options: { overwrite: true }
        });

        return files;
    }

    /**
     * Generate detail page
     */
    async _generateDetailPage(resource, pageGroup, context) {
        const files = [];
        const pageName = `${this.stringUtils.toPascalCase(resource)}DetailPage`;
        const pageDir = path.join(this.outputDir, resource, '[id]');

        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this._renderTemplate(this.templates.page, {
                pageName,
                pageType: 'detail',
                resource,
                operations: pageGroup.operations,
                components: {
                    detail: await this._generateDetailView(resource, pageGroup.operations.get, context),
                    actions: await this._generateDetailActions(pageGroup.operations, context)
                },
                hooks: this._generatePageHooks(pageGroup.operations, context),
                seo: this._generateSEOData(resource, 'detail', context)
            }),
            options: { overwrite: true }
        });

        return files;
    }

    /**
     * Generate create page
     */
    async _generateCreatePage(resource, pageGroup, context) {
        const files = [];
        const pageName = `${this.stringUtils.toPascalCase(resource)}CreatePage`;
        const pageDir = path.join(this.outputDir, resource, 'new');

        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this._renderTemplate(this.templates.page, {
                pageName,
                pageType: 'create',
                resource,
                operations: pageGroup.operations,
                components: {
                    form: await this._generateForm(resource, pageGroup.operations.create, context)
                },
                hooks: this._generatePageHooks(pageGroup.operations, context),
                seo: this._generateSEOData(resource, 'create', context)
            }),
            options: { overwrite: true }
        });

        return files;
    }

    /**
     * Generate edit page
     */
    async _generateEditPage(resource, pageGroup, context) {
        const files = [];
        const pageName = `${this.stringUtils.toPascalCase(resource)}EditPage`;
        const pageDir = path.join(this.outputDir, resource, '[id]', 'edit');

        files.push({
            path: path.join(pageDir, 'page.tsx'),
            content: await this._renderTemplate(this.templates.page, {
                pageName,
                pageType: 'edit',
                resource,
                operations: pageGroup.operations,
                components: {
                    form: await this._generateForm(resource, pageGroup.operations.update, context, true)
                },
                hooks: this._generatePageHooks(pageGroup.operations, context),
                seo: this._generateSEOData(resource, 'edit', context)
            }),
            options: { overwrite: true }
        });

        return files;
    }

    /**
     * Generate data table component
     */
    async _generateDataTable(resource, operation, context) {
        const columns = this._extractTableColumns(operation, context);
        const features = {
            sorting: true,
            filtering: true,
            pagination: true,
            selection: true,
            export: true,
            columnVisibility: true
        };

        return await this._renderTemplate(this.templates.table, {
            resource,
            columns,
            features,
            dataHook: `use${this.stringUtils.toPascalCase(resource)}List`,
            actions: this._extractTableActions(operation),
            responsive: true,
            virtualization: columns.length > 20,
            a11y: this.componentOptions.a11y
        });
    }

    /**
     * Generate form component
     */
    async _generateForm(resource, operation, context, isEdit = false) {
        const schema = this._extractFormSchema(operation, context);
        const fields = this._generateFormFields(schema, context);

        return await this._renderTemplate(this.templates.form, {
            resource,
            isEdit,
            fields,
            validation: await this._generateFormValidation(schema),
            submitHandler: this._generateSubmitHandler(operation, isEdit),
            formLibrary: this.componentOptions.formLibrary,
            uiLibrary: this.componentOptions.uiLibrary,
            a11y: this.componentOptions.a11y
        });
    }

    /**
     * Generate index files
     */
    async _generateIndexFiles(context) {
        const files = [];

        // Components barrel export
        files.push({
            path: path.join(this.outputDir, 'components', 'index.ts'),
            content: this._generateBarrelExport(this.componentRegistry),
            options: { overwrite: true }
        });

        // Hooks barrel export
        files.push({
            path: path.join(this.outputDir, 'hooks', 'index.ts'),
            content: this._generateHooksExport(context.hooks),
            options: { overwrite: true }
        });

        return files;
    }

    /**
     * Generate theme files
     */
    async _generateThemeFiles(context) {
        const files = [];

        if (this.componentOptions.styling === 'tailwind') {
            // Generate Tailwind config extensions
            files.push({
                path: path.join(this.outputDir, 'styles', 'theme.ts'),
                content: await this._generateThemeConfig(context.theme),
                options: { overwrite: true }
            });
        }

        return files;
    }

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Render template with error handling
     */
    async _renderTemplate(template, data) {
        if (!template) {
            throw new GeneratorError('Template not loaded', {
                code: 'TEMPLATE_NOT_LOADED'
            });
        }

        try {
            if (typeof template === 'string') {
                const loadedTemplate = await this.templateEngine.load(template);
                return await loadedTemplate.render(data);
            } else if (template.render) {
                return await template.render(data);
            } else {
                return await this.templateEngine.render(template, data);
            }
        } catch (error) {
            throw new GeneratorError('Template rendering failed', {
                code: 'TEMPLATE_RENDER_ERROR',
                template: template.name || 'unknown',
                error: error.message
            });
        }
    }

    /**
     * Group pages by resource
     */
    _groupPagesByResource(paths) {
        const groups = {};

        for (const [pathName, pathData] of Object.entries(paths)) {
            const resource = this._extractResourceName(pathName);

            if (!groups[resource]) {
                groups[resource] = {
                    resource,
                    operations: {},
                    customPages: []
                };
            }

            // Map operations to page types
            for (const [method, operation] of Object.entries(pathData)) {
                const pageType = this._mapOperationToPageType(method, pathName, operation);
                if (pageType) {
                    groups[resource].operations[pageType] = operation;
                }
            }
        }

        return groups;
    }

    /**
     * Extract resource name from path
     */
    _extractResourceName(path) {
        // Extract resource from paths like /users, /users/{id}, /api/v1/users
        const parts = path.split('/').filter(Boolean);
        const resourcePart = parts.find(p => !p.startsWith('{') && p !== 'api' && !p.startsWith('v'));
        return resourcePart || 'resource';
    }

    /**
     * Map operation to page type
     */
    _mapOperationToPageType(method, path, operation) {
        const operationId = operation.operationId?.toLowerCase() || '';

        // List operations
        if (method === 'get' && !path.includes('{')) {
            return 'list';
        }

        // Get single item
        if (method === 'get' && path.includes('{')) {
            return 'get';
        }

        // Create operations
        if (method === 'post' && !path.includes('{')) {
            return 'create';
        }

        // Update operations
        if ((method === 'put' || method === 'patch') && path.includes('{')) {
            return 'update';
        }

        // Delete operations
        if (method === 'delete') {
            return 'delete';
        }

        return null;
    }

    /**
     * Identify shared components
     */
    _identifySharedComponents(swagger) {
        const components = [];

        // Common components needed across pages
        components.push(
            { name: 'data-table', type: 'ui' },
            { name: 'form-field', type: 'ui' },
            { name: 'modal', type: 'ui' },
            { name: 'drawer', type: 'ui' },
            { name: 'alert', type: 'ui' },
            { name: 'breadcrumb', type: 'navigation' },
            { name: 'pagination', type: 'ui' },
            { name: 'search', type: 'ui' },
            { name: 'filter', type: 'ui' }
        );

        // Add auth components if needed
        if (swagger.components?.securitySchemes) {
            components.push(
                { name: 'auth-guard', type: 'auth' },
                { name: 'login-form', type: 'auth' },
                { name: 'user-menu', type: 'auth' }
            );
        }

        return components;
    }

    /**
     * Extract layouts
     */
    _extractLayouts(swagger) {
        const layouts = [
            {
                name: 'RootLayout',
                type: 'root',
                features: ['navigation', 'footer', 'theme-provider']
            }
        ];

        // Add authenticated layout if needed
        if (swagger.components?.securitySchemes) {
            layouts.push({
                name: 'AuthenticatedLayout',
                type: 'authenticated',
                features: ['auth-check', 'user-context']
            });
        }

        // Add dashboard layout for admin resources
        const hasAdminResources = Object.keys(swagger.paths).some(p =>
            p.includes('admin') || p.includes('dashboard')
        );

        if (hasAdminResources) {
            layouts.push({
                name: 'DashboardLayout',
                type: 'dashboard',
                features: ['sidebar', 'header', 'breadcrumbs']
            });
        }

        return layouts;
    }

    /**
     * Extract custom hooks
     */
    _extractCustomHooks(swagger) {
        const hooks = [];

        // Common hooks
        hooks.push(
            {
                name: 'useDebounce',
                type: 'utility',
                params: ['value', 'delay']
            },
            {
                name: 'useLocalStorage',
                type: 'storage',
                params: ['key', 'initialValue']
            },
            {
                name: 'useMediaQuery',
                type: 'responsive',
                params: ['query']
            }
        );

        // Auth hooks if needed
        if (swagger.components?.securitySchemes) {
            hooks.push(
                {
                    name: 'useAuth',
                    type: 'auth',
                    params: []
                },
                {
                    name: 'useUser',
                    type: 'auth',
                    params: []
                }
            );
        }

        // Add API hooks for each tag
        const tags = new Set();
        Object.values(swagger.paths).forEach(path => {
            Object.values(path).forEach(operation => {
                if (operation.tags) {
                    operation.tags.forEach(tag => tags.add(tag));
                }
            });
        });

        tags.forEach(tag => {
            hooks.push({
                name: `use${this.stringUtils.toPascalCase(tag)}Api`,
                type: 'api',
                params: []
            });
        });

        return hooks;
    }

    /**
     * Prepare theme configuration
     */
    _prepareTheme(context) {
        return {
            colors: {
                primary: context.options.theme?.primaryColor || '#3B82F6',
                secondary: context.options.theme?.secondaryColor || '#8B5CF6',
                accent: context.options.theme?.accentColor || '#10B981'
            },
            fonts: {
                sans: context.options.theme?.fontFamily || 'Inter',
                mono: 'JetBrains Mono'
            },
            darkMode: context.options.theme?.darkMode !== false
        };
    }

    /**
     * Extract i18n keys
     */
    _extractI18nKeys(swagger) {
        const keys = new Set();

        // Common UI keys
        ['common.save', 'common.cancel', 'common.delete', 'common.edit', 'common.create',
            'common.search', 'common.filter', 'common.loading', 'common.error', 'common.success']
            .forEach(key => keys.add(key));

        // Extract from paths
        Object.keys(swagger.paths).forEach(path => {
            const resource = this._extractResourceName(path);
            keys.add(`${resource}.title`);
            keys.add(`${resource}.description`);
            keys.add(`${resource}.list.title`);
            keys.add(`${resource}.create.title`);
            keys.add(`${resource}.edit.title`);
            keys.add(`${resource}.detail.title`);
        });

        return Array.from(keys);
    }

    /**
     * Get UI component import
     */
    _getUIComponentImport(component) {
        const imports = {
            shadcn: {
                button: "import { Button } from '@/components/ui/button'",
                input: "import { Input } from '@/components/ui/input'",
                table: "import { Table } from '@/components/ui/table'"
            },
            mui: {
                button: "import { Button } from '@mui/material'",
                input: "import { TextField } from '@mui/material'",
                table: "import { DataGrid } from '@mui/x-data-grid'"
            },
            antd: {
                button: "import { Button } from 'antd'",
                input: "import { Input } from 'antd'",
                table: "import { Table } from 'antd'"
            },
            chakra: {
                button: "import { Button } from '@chakra-ui/react'",
                input: "import { Input } from '@chakra-ui/react'",
                table: "import { Table } from '@chakra-ui/react'"
            }
        };

        return imports[this.componentOptions.uiLibrary]?.[component] || '';
    }

    /**
     * Generate data fetching hook
     */
    _generateDataFetchingHook(operation) {
        const hooks = {
            swr: `useSWR('/api/${operation}', fetcher)`,
            'react-query': `useQuery(['${operation}'], () => fetchData('/api/${operation}'))`,
            native: `use(fetch('/api/${operation}').then(r => r.json()))`
        };

        return hooks[this.componentOptions.dataFetching] || hooks.swr;
    }

    /**
     * Additional helper methods continue...
     */
}

module.exports = PageComponentGenerator;