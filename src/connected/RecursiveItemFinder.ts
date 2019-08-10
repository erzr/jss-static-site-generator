import GraphQLClientFactory from './GraphQLClientFactory';
import GeneratorConfig from '../GeneratorConfig';
import ApolloClient from 'apollo-client';
import { NormalizedCacheObject } from 'apollo-cache-inmemory';
import { DocumentNode } from 'graphql';

export default class RecursiveItemFinder {
    graphqlClient: ApolloClient<NormalizedCacheObject>;

    constructor(config: GeneratorConfig) {
        this.graphqlClient = new GraphQLClientFactory(config).build();
    }

    async find(query: DocumentNode, rootPath: string, filterFunction: (n: any) => boolean) {
        const queryResult = await this.runFindQuery(query, rootPath, rootPath, filterFunction);
        return queryResult;
    }

    // adapted from https://gist.github.com/lovasoa/8691344
    async runFindQuery(query: DocumentNode, rootPath: string, pathToQuery: string, filterFunction: (n: any) => boolean) {

        let children : any[] = await this.requestData(query, pathToQuery);

        children = await Promise.all(children.map(async (child: { hasChildren: any; path: string; }) => {
            const isMatch = filterFunction(child);
            const matches = [];

            if (child.hasChildren) {
                const subItems = await this.runFindQuery(query, rootPath, child.path, filterFunction);
                matches.push(...subItems);
            }

            if (isMatch) {
                const cleanPath = child.path.replace(rootPath + '/home', '/').replace('//', '/'); // meh, revisit
                matches.push({
                    child,
                    route: cleanPath
                })
            }

            return Promise.resolve(matches);
        }));

        return children.reduce((all, foundRoutes) => all.concat(foundRoutes), []);
    }

    requestData(query: DocumentNode, path: string) {
        return this.graphqlClient.query({
            variables: { path },
            query: query
        }).then((response: any) => response.data.item.children);
    }
}