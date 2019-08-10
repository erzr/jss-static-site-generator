import MediaFinder from "../MediaFinder";
import GeneratorConfig from "../GeneratorConfig";
import RecursiveItemFinder from "./RecursiveItemFinder";
import { MediaQuery } from "./queries";
import FileSystemUtilities from "../FileSystemUtilities";
import { createWriteStream } from "fs";

export default class ConnectedMediaFinder implements MediaFinder {

    private readonly config: GeneratorConfig;
    private readonly fileSystemUtilities: FileSystemUtilities;

    constructor(config: GeneratorConfig, fileSystemUtilities: FileSystemUtilities) {
        if (!config) {
            throw 'config';
        }

        if (!fileSystemUtilities) {
            throw 'fileSystemUtilities';
        }

        this.config = config;
        this.fileSystemUtilities = fileSystemUtilities;
    }

    findMedia(path: string): Promise<any> {
        return new Promise((resolve) => {
            const recursiveFinder = new RecursiveItemFinder(this.config);
            return recursiveFinder.find(MediaQuery, path,
                (child) => child.extension)
                .then(allRoutes => {
                    resolve(allRoutes);
                });
        });
    }

    copyMedia(): Promise<any> {
        return this.findMedia(this.config.MEDIA_SITECORE_PATH)
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

    cleanMediaUrl(item: { url: any; extension?: any; }) {
        return item.url
            .replace(`${this.config.MEDIA_PREIX}/${this.config.APP_NAME}`, '')
            .replace('.ashx', `.${item.extension.value}`);
    }

    // https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js
    async downloadFile(url: string, path: string) {
        console.log('DOWNLOADING: ' + url + ' to ' + path);
        const res: any = await this.config.fetch(url);
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

}