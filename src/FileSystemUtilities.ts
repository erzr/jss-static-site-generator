import {readdirSync, lstatSync, copyFileSync, existsSync, mkdirSync} from 'fs';
import {join} from 'path';

export default class FileSystemUtilities {

    ensureDirectoryExists(to: string) {
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