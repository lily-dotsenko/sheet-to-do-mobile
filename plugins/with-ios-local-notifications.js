const { withEntitlementsPlist, withInfoPlist } = require('expo/config-plugins');

function withIosLocalNotifications(config) {
  config = withEntitlementsPlist(config, (next) => {
    delete next.modResults['aps-environment'];
    return next;
  });

  return withInfoPlist(config, (next) => {
    next.modResults.NSAppTransportSecurity = {
      NSAllowsArbitraryLoads: false,
      NSAllowsLocalNetworking: true,
    };
    return next;
  });
}

module.exports = withIosLocalNotifications;
