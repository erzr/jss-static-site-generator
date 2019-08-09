import GeneratorConfig from './GeneratorConfig';

export default class GeneratorConfigFactory {

    constructor() {
        try {
            this.config = require('../src/temp/config');
        } catch (e) {
            this.config = {};
        }
    }

    build() : GeneratorConfig {
        const generatorConfig : GeneratorConfig = {
            JSS_BUILD_STATIC: './build/static',
            JSS_DISCONNECTED_MEDIA: '/data/media',
            BUILD_DIRECTORY: './static',
            PROXY_URL: this.config.proxyHost || `http://localhost:${process.env.PROXY_PORT || 3042}`,
            API_KEY: this.config.sitecoreApiKey,
            HTML_FILE_NAME: 'index.html',
            LANGUAGE: 'en',
            ROUTE_PATH: './data/routes',
            ROUTE_TEMPLATES: [
                'App Route',
                'ExampleCustomRouteType'
            ],
            APP_SITECORE_PATH: `/sitecore/content/${this.config.jssAppName}`,
            MEDIA_SITECORE_PATH: `/sitecore/media library/${this.config.jssAppName}`,
            MEDIA_PREIX: `/-/media`,
            IS_DISCONNECTED: this.config.sitecoreApiKey === 'no-api-key-set'
        }

        return generatorConfig;
    }

}