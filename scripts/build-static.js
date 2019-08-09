const app = require('../build/server.bundle');
const config = require('../src/temp/config');
const fetch = require('isomorphic-fetch');
const fs = require('fs');
const path = require('path');
const packageConfig = require('../package.json');
const { ApolloClient } = require('apollo-client');
const { BatchHttpLink } = require('apollo-link-batch-http');
const { InMemoryCache } = require('apollo-cache-inmemory');
const gql = require("graphql-tag");
const scjssconfig = require('../scjssconfig.json');
const { ManifestManager, createDisconnectedLayoutService, createDisconnectedDictionaryService } = require('@sitecore-jss/sitecore-jss-dev-tools');


const generator = new StaticSiteGenerator();

generator
    .start()
    .then(() => generator.run())
    .then(() => console.log('Static Site Generated'))
    .then(() => process.exit(0));