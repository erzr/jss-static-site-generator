import { ApolloClient } from 'apollo-client';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory';
import GeneratorConfig from '../GeneratorConfig';

export default class GraphQLClientFactory {
    private readonly config: GeneratorConfig;

    constructor(config: GeneratorConfig) {
        this.config = config;
    }

    build() : ApolloClient<NormalizedCacheObject> {
        const link = new BatchHttpLink({ uri: this.config.graphQLEndpoint, credentials: 'include', fetch: this.config.fetch });
        const cache = new InMemoryCache();

        const graphQLClient = new ApolloClient({
            link,
            cache
        });

        return graphQLClient;
    }

}