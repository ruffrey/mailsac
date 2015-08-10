/**
 * Plugins should go in the `plugins/` directory.
 * ```
 * vars = {
 *     schemas: schemas,
 *     config: config,
 *     email: mailTransport,
 *     app: app,
 *     viewFolders: viewFolders
 * }
 * ```
 */
exports = module.exports = function examplePlugin(vars) {
    return {
        init: function () {

        },
        menu: function () {

        },
        links: function () {

        },
        routes: function () {

        },
        hooks: {
            /**
             * @param object savedMessage - mongoose document instance
             * @param object parsedMessage - parsed mail object
             */
            afterCreateMessage: function (savedMessage, parsedMessage) {

            }
        }
    }
};
