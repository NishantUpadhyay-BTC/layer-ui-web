/**
 *
 * @class layerUI.handlers.message.CardView
 * @extends layerUI.components.Component
 */
import { registerComponent } from '../../components/component';
import CardMixin from '../card-mixin';

registerComponent('layer-response-card', {
  mixins: [CardMixin],

  // Adapated from github.com/picturepan2/fileicon.css
  style: `layer-card-view.layer-response-card {
  }`,

  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    model: {},
    cardBorderStyle: {
      value: 'none',
    },
    widthType: {
      get() {
        return this.properties.contentView ? this.properties.contentView.widthType : 'flex-card';
      },
    },
  },
  methods: {

    onAfterCreate() {
      if (this.model.messageModel) {
        this.properties.contentView = this.createElement('layer-card-view', {
          message: this.model.message,
          rootPart: this.model.messageModel.part,
          model: this.model.messageModel,
          parentNode: this,
          cardBorderStyle: 'none',
        });
      }
    },
  },
});
