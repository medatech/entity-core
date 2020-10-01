module.exports = {
    extends: [
        `plugin:@typescript-eslint/recommended`,
        `prettier/@typescript-eslint`,
        `plugin:prettier/recommended`,
    ],
    plugins: [`prettier`, `import`],
    parser: `@typescript-eslint/parser`, // Specifies the ESLint parser
    parserOptions: {
        ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
        sourceType: `module`, // Allows for the use of imports
        ecmaFeatures: {
            jsx: true, // Allows for the parsing of JSX
        },
    },
    env: {
        browser: true,
        node: true,
        jquery: true,
        jest: true,
    },
    rules: {
        quotes: `off`,
        "@typescript-eslint/quotes": [`error`, `backtick`],
        semi: 0,
        "object-curly-spacing": 0,
        indent: 0,
        "require-jsdoc": 0,
        "arrow-parens": 0,
        "prettier/prettier": [
            `error`,
            {
                trailingComma: `es5`,
                semi: false,
                useTabs: false,
                tabWidth: 4,
            },
        ],
        "no-unused-vars": 0,
        "no-invalid-this": 0,
        "@typescript-eslint/explicit-module-boundary-types": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/ban-ts-comment": 0,
    },
}
