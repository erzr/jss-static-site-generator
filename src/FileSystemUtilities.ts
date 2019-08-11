import {readdirSync, lstatSync, copyFileSync, existsSync, mkdirSync} from 'fs';
import {join} from 'path';
import { GeneratorLogger } from './logging/GeneratorLogger';

export default class FileSystemUtilities {

    private readonly logger: GeneratorLogger;

    constructor(logger: GeneratorLogger) {
        this.logger = logger;
    }

    ensureDirectoryExists(to: string) {
        this.logger.log(`Ensuring directory exists: ${to}`);

        const pieces = to.split('/');

        let pathPieces: string[] = [];
        pieces.forEach(element => {
            pathPieces.push(element);

            const joined = pathPieces.join('/');

            if (!existsSync(joined)) {
                mkdirSync(joined);
            }
        })
    }

    copyFolderSync(from: string, to: string) {
        this.logger.log(`Ensuring directory exists: ${to}`);

        this.ensureDirectoryExists(to);

        readdirSync(from).forEach(element => {
            if (lstatSync(join(from, element)).isFile()) {
                copyFileSync(join(from, element), join(to, element));
            } else {
                this.copyFolderSync(join(from, element), join(to, element));
            }
        });
    }

}