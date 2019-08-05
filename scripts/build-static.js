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

class GeneratorConfigFactory {

    build() {
        return {
            JSS_BUILD_STATIC: './build/static',
            JSS_DISCONNECTED_MEDIA: '/data/media',
            BUILD_DIRECTORY: './static',
            PROXY_URL: `http://localhost:${process.env.PROXY_PORT || 3042}`,
            HTML_FILE_NAME: 'index.html',
            LANGUAGE: 'en',
            ROUTE_PATH: './data/routes',
            ROUTE_TEMPLATES: [
                'App Route',
                'ExampleCustomRouteType'
            ],
            APP_SITECORE_PATH: `/sitecore/content/${config.jssAppName}`,
            MEDIA_SITECORE_PATH: `/sitecore/media library/${config.jssAppName}`,
            MEDIA_PREIX: `/-/media`
        }
    }

}

class LayoutService {

    constructor(proxyUrl) {
        this.proxyUrl = proxyUrl;
    }

    fetchLayoutData(route, language) {
        const layoutUrl = this.buildLayoutUrl(route, language);
        return fetch(layoutUrl)
            .then(res => res.json());
    }

    fetchDictionary(language) {
        const dictionaryUrl = this.buildDictionaryUrl(language);
        return fetch(dictionaryUrl)
            .then(res => res.json());
    }

    buildLayoutUrl(route, language) {
        return `${this.proxyUrl}/sitecore/api/layout/render/jss?item=${route}&sc_lang=${language}&sc_apikey=${this.apiKey}`;
    }

    buildDictionaryUrl(language) {
        return `${this.proxyUrl}/sitecore/api/jss/dictionary/${packageConfig.config.appName}/${language}?sc_apikey=no-api-key-set`
    }

}

class DisconnectedRouteFinder {

    constructor(language) {
        this.routeFilePattern = new RegExp(`^${language}\\.(yaml|yml|json)$`, 'i');
    }

    findRoutes(routePath, parts) {
        const foundRoutes = [],
            pathParts = parts || [];

        const files = fs.readdirSync(routePath);

        files.forEach(file => {
            const fullPath = path.join(routePath, file);

            if (fs.lstatSync(fullPath).isFile()) {
                if (this.routeFilePattern.test(file)) {
                    const joined = pathParts.join('/');
                    foundRoutes.push(`/${joined}`);
                }
            } else {
                pathParts.push(file);

                const nestedRoutes = this.findRoutes(fullPath, pathParts);

                if (nestedRoutes && nestedRoutes.length) {
                    foundRoutes.push.apply(foundRoutes, nestedRoutes);
                }

                pathParts.pop();
            }
        });

        return foundRoutes;
    }

}

class GraphQLClientFactory {

    build() {
        const link = new BatchHttpLink({ uri: config.graphQLEndpoint, credentials: 'include' });
        const cache = new InMemoryCache();

        const graphQLClient = new ApolloClient({
            link,
            cache
        });

        return graphQLClient;
    }

}

class RecursiveItemFinder {

    find(query, rootPath, filterFunction) {
        return new Promise((resolve) => {
            const graphQlFactory = new GraphQLClientFactory();
            const graphQLClient = graphQlFactory.build();

            const allRoutes = [];

            this.handleRouteQuery(graphQLClient, query, rootPath, filterFunction, allRoutes, rootPath)
                .then(() => resolve(allRoutes));
        });
    }

    handleRouteQuery(client, query, rootPath, filterFunction, allRoutes, path) {
        // this isn't quite right... but it works. ;)
        // should reduce all these promises and resolve flattened array.
        return new Promise((resolve) => {
            this.runRouteQuery(client, query, rootPath, filterFunction, allRoutes, path)
                .then(found => {
                    return Promise.all(
                        found.map((foundPath) => {
                            return this.handleRouteQuery(client, query, rootPath, filterFunction, allRoutes, foundPath.path);
                        })
                    )
                })
                .then(() => {
                    resolve();
                });;
        });
    }

    runRouteQuery(client, query, rootPath, filterFunction, allRoutes, path) {
        return client.query({
            variables: { path },
            query: query
        }).then(response => {
            const item = response.data.item;
            const found = [];
            const all = [];

            if (item && item.children) {
                item.children.forEach(child => {
                    const isMatch = filterFunction(child);
                    const childData = {
                        child,
                        path: child.path,
                        route: child.path.replace(rootPath + '/home', '/').replace('//', '/') // meh, revisit
                    };
                    if (isMatch) {
                        found.push(childData);
                    }
                    all.push(childData);
                })
            }

            allRoutes.push.apply(allRoutes, found);

            return all;
        });
    }

}

const RouteQuery = gql`
query SiteQuery($path:String) {
  item(path: $path) {
    path
    template {
      name
    }
    children {
      path
      template {
        name
      }
    }
  }
}
`;

class ConnectedRouteFinder {

    constructor(config) {
        this.config = config;
    }

    findRoutes() {
        return new Promise((resolve) => {
            const recursiveFinder = new RecursiveItemFinder();
            return recursiveFinder.find(RouteQuery, this.config.APP_SITECORE_PATH,
                (child) => this.config.ROUTE_TEMPLATES.indexOf(child.template.name) >= 0)
                .then(allRoutes => {
                    const justRoutes = allRoutes.map(x => x.route);
                    resolve(justRoutes);
                });
        });
    }

}

const MediaQuery = gql`
query MediaQuery($path:String) {
  item(path: $path) {
    children {
      name
      path
      url
      template {
        name
      }
      extension:field(name:"Extension"){
        value
      }
    }
  }
}
`;

class MediaFinder {

    constructor(config) {
        this.config = config;
    }

    findMedia() {
        return new Promise((resolve) => {
            const recursiveFinder = new RecursiveItemFinder();
            return recursiveFinder.find(MediaQuery, this.config.MEDIA_SITECORE_PATH,
                (child) => child.extension)
                .then(allRoutes => {
                    resolve(allRoutes);
                });
        });
    }

}

class FileSystemUtilities {

    ensureDirectoryExists(to) {
        const pieces = to.split('/');

        let pathPieces = [];
        pieces.forEach(element => {
            pathPieces.push(element);

            const joined = pathPieces.join('/');

            if (!fs.existsSync(joined)) {
                fs.mkdirSync(joined);
            }
        })
    }

    copyFolderSync(from, to) {
        this.ensureDirectoryExists(to);

        fs.readdirSync(from).forEach(element => {
            if (fs.lstatSync(path.join(from, element)).isFile()) {
                fs.copyFileSync(path.join(from, element), path.join(to, element));
            } else {
                this.copyFolderSync(path.join(from, element), path.join(to, element));
            }
        });
    }

}

class StaticSiteGenerator {

    constructor() {
        this.config = new GeneratorConfigFactory().build();
        this.layoutService = new LayoutService(this.config.PROXY_URL);
        this.disconnectedRouteFinder = new DisconnectedRouteFinder(this.config.LANGUAGE);
        this.connectedRouteFinder = new ConnectedRouteFinder(this.config);
        this.fileSystemUtilities = new FileSystemUtilities();
        this.mediaFinder = new MediaFinder(this.config);
    }

    writeRouteToDisk(route, error, html) {
        const output_dir = this.config.BUILD_DIRECTORY + (!route.endsWith('/') ? route + '/' : route),
            output = output_dir + this.config.HTML_FILE_NAME;

        this.fileSystemUtilities.ensureDirectoryExists(output_dir);

        if (error) {
            console.error(error);
        } else {
            fs.writeFileSync(output, html, { encoding: 'utf8' });
        }
    }

    collectRoutes(disconnected) {
        let routePromise;
        if (disconnected) {
            const foundRoutes = this.disconnectedRouteFinder.findRoutes(this.config.ROUTE_PATH);
            routePromise = Promise.resolve(foundRoutes);
        } else {
            routePromise = this.connectedRouteFinder.findRoutes();
        }
        return routePromise;
    }

    waitForServers(urls) {
        return new Promise((resolve) => {
            const checkingServers = {},
                onlineServers = [];

            urls.forEach((url) => {
                if (!checkingServers[url]) {
                    checkingServers[url] = true;
                }

                var interval = setInterval(() => {
                    fetch(url)
                        .then(() => {
                            onlineServers.push(url);

                            if (onlineServers.length === urls.length) {
                                clearInterval(interval);
                                resolve();
                            }
                        })
                        .catch(() => {
                            delete checkingServers[url];
                        });
                }, 1000);
            });
        });
    }

    renderViewToHtml(renderView, data, viewPath, viewBag) {
        return new Promise((resolve, reject) => {
            const renderCallback = (error, content) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(content.html);
                }
            };

            renderView(renderCallback, viewPath, data, viewBag);
        });
    }

    handleRoute(route, viewBag) {
        return this.layoutService.fetchLayoutData(route, this.config.LANGUAGE)
            .then(result => this.renderViewToHtml(app.renderView, result, route, viewBag))
            .then(html => this.writeRouteToDisk(route, null, html));
    }

    copyMedia(isDisconnected) {
        this.fileSystemUtilities.copyFolderSync(this.config.JSS_BUILD_STATIC, `${this.config.BUILD_DIRECTORY}${packageConfig.config.sitecoreDistPath}/static`);

        if (isDisconnected) {
            this.fileSystemUtilities.copyFolderSync(`.${this.config.JSS_DISCONNECTED_MEDIA}`, 
                `${this.config.BUILD_DIRECTORY}${this.config.JSS_DISCONNECTED_MEDIA}`);
            return Promise.resolve();
        } else {
            return this.copyMediaLibraryFolder();
        }
    }

    // https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
    async downloadFile(url, path) {
        console.log('DOWNLOADING: ' + url + ' to ' + path);
        const res = await fetch(url);
        const fileStream = fs.createWriteStream(path);
        await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", (err) => {
                reject(err);
            });
            fileStream.on("finish", function () {
                resolve();
            });
        });
    }

    cleanMediaUrl(item) {
        return item.url
            .replace(`${this.config.MEDIA_PREIX}/${config.jssAppName}`, '')
            .replace('.ashx', `.${item.extension.value}`);
    }

    copyMediaLibraryFolder() {
        return this.mediaFinder.findMedia()
            .then(media => {
                return Promise.all(media.map(async mediaItem => {
                    const cleanUrl = this.cleanMediaUrl(mediaItem.child),
                        path = `${this.config.BUILD_DIRECTORY}${cleanUrl}`,
                        pathWithoutFile = path.substring(0, path.lastIndexOf("/"));

                    this.fileSystemUtilities.ensureDirectoryExists(pathWithoutFile);
                    return this.downloadFile(scjssconfig.sitecore.layoutServiceHost + mediaItem.child.url, path);
                }))
            });
    }

    async handleServerReady() {
        const isDisconnected = config.sitecoreApiKey === 'no-api-key-set',
            viewBag = await this.buildViewBag();

        return this.collectRoutes(isDisconnected)
            .then(routesToProcess => {
                if (routesToProcess) {

                    var chain = Promise.resolve();

                    routesToProcess.forEach(route => {
                        chain = chain.then(() => this.handleRoute(route, viewBag));
                    });

                    chain = chain.then(() => this.copyMedia(isDisconnected));

                    return chain;
                }
            })
            .catch((e) => console.log(e));
    }

    async buildViewBag() {
        const dictionary = await this.layoutService.fetchDictionary(this.config.LANGUAGE);

        return {
            dictionary
        }
    }

    run() {
        return this.waitForServers([`${this.config.PROXY_URL}/`])
            .then(() => this.handleServerReady());
    }

}

const generator = new StaticSiteGenerator();

generator
    .run()
    .then(() => console.log('Static Site Generated'));