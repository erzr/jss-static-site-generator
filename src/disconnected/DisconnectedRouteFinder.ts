import {readdirSync, lstatSync} from 'fs';
import {join} from 'path';

export default class DisconnectedRouteFinder {
    routeFilePattern: RegExp;

    constructor(language: string) {
        this.routeFilePattern = new RegExp(`^${language}\\.(yaml|yml|json)$`, 'i');
    }

    findRoutes(routePath: string, parts: string[]) {
        const foundRoutes = this.findRoutesSync(routePath, parts);
        return Promise.resolve(foundRoutes);
    }

    findRoutesSync(routePath: string, parts: string[]) {
        const foundRoutes: string[] = [],
            pathParts = parts || [];

        const files = readdirSync(routePath);

        files.forEach(file => {
            const fullPath = join(routePath, file);

            if (lstatSync(fullPath).isFile()) {
                if (this.routeFilePattern.test(file)) {
                    const joined = pathParts.join('/');
                    foundRoutes.push(`/${joined}`);
                }
            } else {
                pathParts.push(file);

                const nestedRoutes = this.findRoutesSync(fullPath, pathParts);

                if (nestedRoutes && nestedRoutes.length) {
                    foundRoutes.push(...nestedRoutes);
                }

                pathParts.pop();
            }
        });

        return foundRoutes;
    }

}