/**
 * The Layer file upload button widget allows users to select a File to send.
 *
 * Its assumed that this button will be used within the layerUI.components.subcomponents.ComposeButtonPanel:
 *
 * ```
 * myConversationPanel.composeButtons = [
 *    document.createElement('layer-file-upload-button')
 * ];
 * ```
 *
 * If using it elsewhere, note that it triggers a `layer-file-selected` event that you would listen for to do your own processing.
 * If using it in the ComposeButtonPanel, this event will be received by the Composer and will not propagate any further:
 *
 * ```
 * document.body.addEventListener('layer-file-selected', function(evt) {
 *    var messageParts = evt.custom.parts;
 *    conversation.createMessage({ parts: messageParts }).send();
 * }
 * ```
 *
 * @class layerUI.components.subcomponents.FileUploadButton
 * @extends layerUI.components.Component
 */
import Layer, { MessagePart } from '@layerhq/layer-websdk';
import layerUI from '../../../base';
import { registerComponent } from '../../../components/component';
import Clickable from '../../../mixins/clickable';

registerComponent('layer-file-upload-button', {
  mixins: [Clickable],
  properties: {
    /**
     * Set the `accept` attribute of the file upload widget.
     *
     * For more info, see https://www.w3schools.com/tags/att_input_accept.asp
     *
     * Possible value: `image/*,video/*`
     *
     * @property {String} [accept=*\/*]
     */
    accept: {
      set(newValue) {
        this.nodes.input.accept = newValue;
      },
    },
  },
  methods: {

    /**
     * Constructor.
     *
     * @method onCreate
     * @private
     */
    onCreate() {
      this.nodes.input.id = Layer.Util.generateUUID();
      this.nodes.label.setAttribute('for', this.nodes.input.id);
      this.nodes.input.addEventListener('change', this.onChange.bind(this));

      // This causes test to fail by causing the click event to fire twice.
      // but without this, the click event is not received at all.
      this.addClickHandler('button-click', this, (evt) => {
        if (evt.target !== this.nodes.input) this.nodes.input.click();
      });
    },

    /**
     * MIXIN HOOK: When the file input's value has changed, gather the data and trigger an event.
     *
     * If adding a mixin here to change behaviors on selecting a file, you can use `this.nodes.input.files` to access
     * the selected files.
     *
     * @method
     */
    onChange() {
      const files = Array.prototype.slice.call(this.nodes.input.files);
      const imageTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/svg'];
      const ImageModel = Layer.Client.getCardModelClass('ImageModel');
      const FileModel = Layer.Client.getCardModelClass('FileModel');

      const models = files.map((file) => {
        if (imageTypes.indexOf(file.type) !== -1) {
          return new ImageModel({
            source: file,
          });
        } else {
          return new FileModel({
            source: file,
          });
        }
      });

      /**
       * This widget triggers a `layer-file-selected` event when the user selects files.
       * This event is captured and stopped from propagating by the layerUI.components.subcomponents.Composer.
       * If using it outside of the composer, this event can be used to receive the MessageParts generated
       * for the selected files.
       *
       * @event layer-file-selected
       * @param {Object} evt
       * @param {Object} evt.detail
       * @param {layer.CardModel[]} evt.detail.models
       */
      this.trigger('layer-file-selected', { models });
    },
  },
});
