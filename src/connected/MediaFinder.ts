import GeneratorConfig from "../GeneratorConfig";
import { MediaQuery } from "./queries";
import RecursiveItemFinder from "./RecursiveItemFinder";

export default class MediaFinder {
    private readonly config: GeneratorConfig;

    constructor(config: GeneratorConfig) {
        this.config = config;
    }

    findMedia() : Promise<any> {
        return new Promise((resolve) => {
            const recursiveFinder = new RecursiveItemFinder(this.config);
            return recursiveFinder.find(MediaQuery, this.config.MEDIA_SITECORE_PATH,
                (child) => child.extension)
                .then(allRoutes => {
                    resolve(allRoutes);
                });
        });
    }

}