import { createWriteStream } from "fs";
import GeneratorConfig from "./GeneratorConfig";

export default class WebUtilities {
    private readonly config: GeneratorConfig;

    constructor(config: GeneratorConfig) {
        this.config = config;
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