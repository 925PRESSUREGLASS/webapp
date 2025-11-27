(function() {
  if (window.Capacitor) {
    return;
  }

  function noop() {}

  window.Capacitor = {
    Plugins: {},
    platform: 'web',
    isNativePlatform: function() {
      return false;
    },
    registerPlugin: function(name, implementation) {
      var plugin = implementation || {};
      this.Plugins[name] = plugin;
      return plugin;
    }
  };

  window.CapacitorHttp = {
    request: function() {
      return Promise.reject(new Error('CapacitorHttp unavailable in test stub'));
    }
  };

  window.Capacitor.Plugins.App = {
    addListener: noop
  };
})();
