const { StaticSiteGenerator, createReactStaticSiteConfiguration } = require('jss-static-site-generator');
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

const config = createReactStaticSiteConfiguration(
    fetch, 
    app, 
    tempConfig, 
    packageConfig, 
    scjssconfig, 
    undefined
    );

const generator = new StaticSiteGenerator(config);

generator
    .start()
    .then(() => generator.run())
    .then(() => console.log('Static Site Generated'))
    .then(() => process.exit(0));