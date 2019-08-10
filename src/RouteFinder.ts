export default interface RouteFinder {
    findRoutes() : Promise<string[]>;
}