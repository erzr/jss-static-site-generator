import gql from "graphql-tag";

export const RouteQuery = gql`
query SiteQuery($path:String) {
  item(path: $path) {
    children {
      hasChildren
      path
      template {
        name
      }
    }
  }
}
`;

export const MediaQuery = gql`
query MediaQuery($path:String) {
  item(path: $path) {
    children {
      hasChildren
      name
      path
      url
      template {
        name
      }
      extension:field(name:"Extension"){
        value
      }
    }
  }
}
`;