const { StaticSiteGenerator } = require('jss-static-site-generator')
const fetch = require('isomorphic-fetch');
const app = require('../build/server.bundle');
const tempConfig = require('../src/temp/config');
const packageConfig = require('../package.json');

let scjssconfig;
try {
    scjssconfig = require('../scjssconfig.json');
} catch (e) {
    scjssconfig = { sitecore: {} }
    console.log('Unable to load scjssconfig');
}

const config = {
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
    fetch: fetch,
    graphQLEndpoint: tempConfig.graphQLEndpoint,
    LAYOUT_SERVICE_HOST: scjssconfig.sitecore.layoutServiceHost,
    SITECORE_DIST_PATH: packageConfig.config.sitecoreDistPath,
    renderView: app.renderView
};

const generator = new StaticSiteGenerator(config);

generator
    .start()
    .then(() => generator.run())
    .then(() => console.log('Static Site Generated'))
    .then(() => process.exit(0));