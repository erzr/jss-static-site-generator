import GeneratorConfigFactory from './GeneratorConfigFactory';
import LayoutServiceFactory from './LayoutServiceFactory';
import RotueFinderFactory from './RouteFinderFactory';
import FileSystemUtilities from './FileSystemUtilities';
import MediaFinder from './connected/MediaFinder';
import GeneratorConfig from './GeneratorConfig';

export class StaticSiteGenerator {
    config: GeneratorConfig;

    constructor() {
        this.config = new GeneratorConfigFactory().build();
        this.layoutService = new LayoutServiceFactory().build(this.config);
        this.routeFinder = new RotueFinderFactory().build(this.config);
        this.fileSystemUtilities = new FileSystemUtilities();
        this.mediaFinder = new MediaFinder(this.config);
    }

    start() {
        return this.layoutService.start();
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
        const viewBag = await this.buildViewBag();

        return this.routeFinder.findRoutes(this.config.ROUTE_PATH)
            .then(routesToProcess => {
                if (routesToProcess) {

                    var chain = Promise.resolve();

                    routesToProcess.forEach(route => {
                        chain = chain.then(() => this.handleRoute(route, viewBag));
                    });

                    chain = chain.then(() => this.copyMedia(this.config.IS_DISCONNECTED));

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
        return this.handleServerReady();
    }

}