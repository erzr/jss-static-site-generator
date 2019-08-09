import {writeFileSync, createWriteStream} from 'fs';
import GeneratorConfigFactory from './GeneratorConfigFactory';
import LayoutServiceFactory from './LayoutServiceFactory';
import RouteFinderFactory from './RouteFinderFactory';
import FileSystemUtilities from './FileSystemUtilities';
import MediaFinder from './connected/MediaFinder';
import GeneratorConfig from './GeneratorConfig';
import LayoutService from './LayoutService';
import RouteFinder from './RouteFinder';

interface App {
    renderView(renderCallback: (error: string, content: any) => void, viewPath: any, data: any, viewBag: any): Promise<any>;
}

export class StaticSiteGenerator {
    config: GeneratorConfig;
    layoutService: LayoutService;
    fileSystemUtilities: FileSystemUtilities;
    routeFinder: RouteFinder;
    mediaFinder: MediaFinder;
    renderView: App['renderView'];

    constructor(fetch: GlobalFetch['fetch'], renderView: App['renderView']) {
        this.renderView = renderView;
        this.config = new GeneratorConfigFactory().build(fetch);
        this.layoutService = new LayoutServiceFactory().build(this.config);
        this.routeFinder = new RouteFinderFactory().build(this.config);
        this.fileSystemUtilities = new FileSystemUtilities();
        this.mediaFinder = new MediaFinder(this.config);
    }

    start() {
        return this.layoutService.start(this.config);
    }

    writeRouteToDisk(route: string, error: string, html: string) {
        const output_dir = this.config.BUILD_DIRECTORY + (!route.endsWith('/') ? route + '/' : route),
            output = output_dir + this.config.HTML_FILE_NAME;

        this.fileSystemUtilities.ensureDirectoryExists(output_dir);

        if (error) {
            console.error(error);
        } else {
            writeFileSync(output, html, { encoding: 'utf8' });
        }
    }

    renderViewToHtml(renderView: App['renderView'], 
        data: any, viewPath: string, viewBag: any) : Promise<string> {
        return new Promise((resolve, reject) => {
            const renderCallback = (error: string, content: any) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(content.html);
                }
            };

            renderView(renderCallback, viewPath, data, viewBag);
        });
    }

    handleRoute(route: string, viewBag: any) {
        return this.layoutService.fetchLayoutData(route, this.config.LANGUAGE)
            .then(result => this.renderViewToHtml(this.renderView, result, route, viewBag))
            .then(html => this.writeRouteToDisk(route, '', html));
    }

    copyMedia() : Promise<any> {
        this.fileSystemUtilities.copyFolderSync(this.config.JSS_BUILD_STATIC, `${this.config.BUILD_DIRECTORY}${this.config.SITECORE_DIST_PATH}/static`);

        if (this.config.IS_DISCONNECTED) {
            this.fileSystemUtilities.copyFolderSync(`.${this.config.JSS_DISCONNECTED_MEDIA}`,
                `${this.config.BUILD_DIRECTORY}${this.config.JSS_DISCONNECTED_MEDIA}`);
            return Promise.resolve();
        } else {
            return this.copyMediaLibraryFolder();
        }
    }

    // https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
    async downloadFile(url: string, path: string) {
        console.log('DOWNLOADING: ' + url + ' to ' + path);
        const res : any = await this.config.fetch(url);
        const fileStream = createWriteStream(path);
        await new Promise((resolve, reject) => {
            res.body.pipe(fileStream);
            res.body.on("error", (err: any) => {
                reject(err);
            });
            fileStream.on("finish", function () {
                resolve();
            });
        });
    }

    cleanMediaUrl(item: { url: any; extension?: any; }) {
        return item.url
            .replace(`${this.config.MEDIA_PREIX}/${this.config.APP_NAME}`, '')
            .replace('.ashx', `.${item.extension.value}`);
    }

    copyMediaLibraryFolder() {
        return this.mediaFinder.findMedia()
            .then(media => {
                return Promise.all(media.map(async (mediaItem: { child: { url: string; }; }) => {
                    const cleanUrl = this.cleanMediaUrl(mediaItem.child),
                        path = `${this.config.BUILD_DIRECTORY}${cleanUrl}`,
                        pathWithoutFile = path.substring(0, path.lastIndexOf("/"));

                    this.fileSystemUtilities.ensureDirectoryExists(pathWithoutFile);
                    return this.downloadFile(this.config.LAYOUT_SERVICE_HOST + mediaItem.child.url, path);
                }))
            });
    }

    async handleServerReady() {
        const viewBag = await this.buildViewBag();

        return this.routeFinder.findRoutes()
            .then(routesToProcess => {
                if (routesToProcess) {

                    var chain = Promise.resolve();

                    routesToProcess.forEach(route => {
                        chain = chain.then(() => this.handleRoute(route, viewBag));
                    });

                    chain = chain.then(() => this.copyMedia());

                    return chain;
                } else {
                    console.log('No Routes Found');
                    return Promise.resolve();
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