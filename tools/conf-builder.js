// Sets defaults on conf and resolves relative paths

var path = require('path'),
    fs = require('fs'),
    op = require('object-path'),
    root = path.join(__dirname, '..');

var defaults = {
  'ports.http': 8080,
  'ports.https': 8443,

  'paths.sslKey': path.join(root, 'ssl', 'dev.key.pem'),
  'paths.sslCert': path.join(root, 'ssl', 'cert.pem'),

  // hashed value for test:test
  'auths.0': '$2a$08$eDv11C3I7e9Pk2HJpbP5O.x7hlxxvs8pSKThH4BfBJLlJT2mA3Cgq',

  authRealm: 'Secret Stuff',

  db: 'mongodb://localhost/test',

  'serveIndex.0.route': '/public',
  'serveIndex.0.path': 'web/public',
  'serveIndex.0.secure': false,
  'serveIndex.0.options.icons': true,
  'serveIndex.0.options.view': 'details'
}

exports.build = function(conf) {
  for (var p in defaults) {
    // prepend root if path is relative
    var value = op.get(conf, p, defaults[p]);
    if (p.indexOf('paths.') == 0)
      value = path.resolve(root, value);
    op.set(conf, p, value);

    // Verify property path exists; we need this incase user supplies a
    // property path like { ..., ports: 'not an object', ... }
    if (!op.has(conf, p))
      throw new Error('Conf object does not have property ' + p);
  }

  return conf;
}
