describe('layer-menu-button', function() {
  var el, testRoot, client;
  beforeEach(function() {
    client = new layer.Client({
      appId: 'Fred'
    });
    client.user = new layer.Identity({
      client: client,
      userId: 'FrodoTheDodo',
      id: 'layer:///identities/FrodoTheDodo',
      isFullIdentity: true
    });
    client._clientAuthenticated();

    if (layerUI.components['layer-conversation-view'] && !layerUI.components['layer-conversation-view'].classDef) layerUI.init({});
    testRoot = document.createElement('div');
    document.body.appendChild(testRoot);
    el = document.createElement('layer-menu-button');
    testRoot.appendChild(el);
    el.enabled = true;
    layer.Util.defer.flush();
  });

  afterEach(function() {
    document.body.removeChild(testRoot);
    layer.Client.removeListenerForNewClient();
  });
  it("Should have tests", function() {
    expect("Tests").toBe("written");
  });
});