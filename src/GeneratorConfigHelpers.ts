import GeneratorConfig from "./GeneratorConfig";

export function createReactStaticSiteConfiguration(fetch: GlobalFetch['fetch'], app: any, tempConfig: any, packageConfig: any, 
    scjssconfig: any, overrides: GeneratorConfig | undefined) : GeneratorConfig {

    let defaultConfig = {
        JSS_BUILD_STATIC: './build/static',
        JSS_DISCONNECTED_MEDIA: '/data/media',
        BUILD_DIRECTORY: './static',
        PROXY_URL: tempConfig.proxyHost || `http://localhost:${process.env.PROXY_PORT || 3042}`,
        API_KEY: tempConfig.sitecoreApiKey,
        HTML_FILE_NAME: 'index.html',
        LANGUAGE: 'en',
        ROUTE_PATH: './data/routes',
        ROUTE_TEMPLATES: [
            'App Route',
            'ExampleCustomRouteType'
        ],
        APP_SITECORE_PATH: `/sitecore/content/${tempConfig.jssAppName}`,
        MEDIA_SITECORE_PATH: `/sitecore/media library/${tempConfig.jssAppName}`,
        MEDIA_PREIX: `/-/media`,
        IS_DISCONNECTED: tempConfig.sitecoreApiKey === 'no-api-key-set',
        APP_NAME: tempConfig.jssAppName,
        LAYOUT_SERVICE_HOST: scjssconfig.sitecore.layoutServiceHost,
        SITECORE_DIST_PATH: packageConfig.config.sitecoreDistPath,
    } as GeneratorConfig;

    defaultConfig.fetch = fetch;
    defaultConfig.renderView = app.renderView;

    if (overrides) {
        defaultConfig = Object.assign(defaultConfig, overrides);
    }

    return defaultConfig;
}