import {readdirSync, lstatSync} from 'fs';
import {join} from 'path';
import RouteFinder from '../RouteFinder';

export default class DisconnectedRouteFinder implements RouteFinder {
    routeFilePattern: RegExp;
    routePath: string;

    constructor(language: string, routePath: string) {
        this.routeFilePattern = new RegExp(`^${language}\\.(yaml|yml|json)$`, 'i');
        this.routePath = routePath;
    }

    findRoutes() : Promise<string[]> {
        const foundRoutes = this.findRoutesSync(this.routePath, []);
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