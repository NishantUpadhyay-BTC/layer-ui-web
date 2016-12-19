/**
 * The Layer file upload button widget allows users to select a File to send.
 *
 * Its assumed that this button will be used within the layerUI.components.subcomponents.ComposeButtonPanel.
 * If using it elsewhere, note that it triggers a `layer-send-click` event that you would listen for to do your own processing.
 * If using it in the ComposeButtonPanel, this event will be received and handled by the Composer and will not propagate any further.
 *
 * ```
 * document.body.addEventListener('layer-send-click', function(evt) {
 *    var messageParts = evt.custom.parts;
 *    conversation.createMessage({ parts: messageParts }).send();
 * }
 * ```
 *
 * A send button is added to a project as follows:
 *
 * ```
 * myConversationPanel.composeButtons = [
 *    document.createElement('layer-send-button')
 * ];
 * ```
 *
 * @class layerUI.components.subcomponents.SendButton
 * @extends layerUI.components.Component
 */
import LUIComponent from '../../../components/component';

LUIComponent('layer-send-button', {
  properties: {
    text: {
      value: 'SEND',
      set(value) {
        this.firstChild.innerHTML = value;
      },
    },
  },
  methods: {
    /**
     * Constructor.
     *
     * @method _created
     * @private
     */
    _created() {
      this.addEventListener('click', evt => this.trigger('layer-send-click'));
    },
  },
});
