var system = require('system');
var page = require('webpage').create();

page.onError = function() {};
page.viewportSize = {
  width: 1024,
  height: 768
};

page.open(system.args[1], function() {
  setTimeout(function() {
    system.stdout.write(page.renderBase64('PNG'));
    phantom.exit();
  }, 3000);
});
