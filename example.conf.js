module.exports = {
  ports: {
    // http[s] port to listen on
    http: 8080,
    https: 8443
  },
  // non-absolute paths will be relative to the project root
  paths: {
    tlsKey: "tls/dev.key.pem",
    tlsCert: "tls/dev.cert.pem"
  },
  // basic auth realm used for https
  authRealm: "Secret Stuff",
  db: "mongodb://localhost/production",
  // array directories to serve static content from
  serveIndex: [
    {
      route: "/public",
      path: "web/public",
      // if true, the route will be secured with TLS and basic auth
      secure: false,
      // options object passed to serve-index
      // see https://www.npmjs.com/package/serve-index#options
      options: {
        icons: true,
        view: "details"
      }
    }
  ]
}
