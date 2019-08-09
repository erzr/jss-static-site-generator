import GeneratorConfig from './GeneratorConfig';

interface TempConfig {
    graphQLEndpoint: string;
    jssAppName: string;
    sitecoreApiKey: string;
    proxyHost: string;
}

export default class GeneratorConfigFactory {

    tempConfig: TempConfig;
    scjssconfig: any;
    packageConfig: any;

    constructor() {
        this.tempConfig = require('../src/temp/config');
        this.packageConfig = require('../package.json');
        try {
            this.scjssconfig = require('../scjssconfig.json');
        } catch {
            this.scjssconfig = { sitecore: {} }
            console.log('Unable to load scjssconfig');
        }
    }

    build(fetch: GlobalFetch['fetch']) : GeneratorConfig {
        const generatorConfig : GeneratorConfig = {
            JSS_BUILD_STATIC: './build/static',
            JSS_DISCONNECTED_MEDIA: '/data/media',
            BUILD_DIRECTORY: './static',
            PROXY_URL: this.tempConfig.proxyHost || `http://localhost:${process.env.PROXY_PORT || 3042}`,
            API_KEY: this.tempConfig.sitecoreApiKey,
            HTML_FILE_NAME: 'index.html',
            LANGUAGE: 'en',
            ROUTE_PATH: './data/routes',
            ROUTE_TEMPLATES: [
                'App Route',
                'ExampleCustomRouteType'
            ],
            APP_SITECORE_PATH: `/sitecore/content/${this.tempConfig.jssAppName}`,
            MEDIA_SITECORE_PATH: `/sitecore/media library/${this.tempConfig.jssAppName}`,
            MEDIA_PREIX: `/-/media`,
            IS_DISCONNECTED: this.tempConfig.sitecoreApiKey === 'no-api-key-set',
            APP_NAME: this.tempConfig.jssAppName,
            fetch: fetch,
            graphQLEndpoint: this.tempConfig.graphQLEndpoint,
            LAYOUT_SERVICE_HOST: this.scjssconfig.sitecore.layoutServiceHost,
            SITECORE_DIST_PATH: this.packageConfig.config.sitecoreDistPath
        }

        return generatorConfig;
    }

}