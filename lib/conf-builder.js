
// parses conf.json and returns it in object form

var path = require('path'),
    fs = require('fs');

exports.parse = function(file) {
  var conf = JSON.parse(fs.readFileSync(file, {encoding:'utf8'}));

  // If paths in config are relative, prepend cog root.
  for (var p in conf.paths){
    if (p != 'cog_root'){
      conf.paths[p] = path.resolve(conf.paths.cog_root, conf.paths[p]);
    }
  }

  return conf;
}
