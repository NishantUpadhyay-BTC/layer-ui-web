/**
 *
 * @class
 * @extends layerUI.components.Component
 */
import { registerComponent } from '../../components/component';
import '../../components/subcomponents/layer-action-button/layer-action-button';
import '../../components/subcomponents/layer-url-button/layer-url-button';
import '../../components/subcomponents/layer-choice-button/layer-choice-button';
import ChoiceModel from '../choice/choice-model';
import CardMixin from '../card-mixin';

registerComponent('layer-buttons-card', {
  template: `
    <div class="layer-button-content" layer-id="content"></div>
    <div class="layer-button-list" layer-id="buttons">
  </div>`,
  style: `layer-buttons-card {
    display: flex;
    flex-direction: column;
  }
  layer-buttons-card .layer-button-content {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
  }
  .layer-button-list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
  }
  `,
  mixins: [CardMixin],
  properties: {
    widthType: {
      get() {
        return this.properties.contentView ? this.properties.contentView.widthType : 'flex-card';
      },
    },
    preferredMaxWidth: {
      get() {
        return this.properties.contentView ? this.properties.contentView.nodes.ui.preferredMaxWidth : 350;
      },
    },
  },
  methods: {
    /**
     * Can be rendered in a concise format required for Conversation Last Message and Layer Notifier
     *
     * @method
     */
    canRenderConcise(message) {
      return false;
    },

    onAfterCreate() {
      if (this.model.contentModel) {
        this.properties.contentView = this.createElement('layer-card-view', {
          message: this.model.message,
          rootPart: this.model.contentModel.part,
          model: this.model.contentModel,
          parentNode: this.nodes.content,
          name: 'subcard',
        });
      } else {
        this.classList.add('layer-button-card-no-content');
      }

      this.model.buttons.forEach((button) => {
        let widget, model;

        if ('choices' in button && button.choices.length > 1) {
          this.parentComponent.classList.add('layer-button-card-with-choices');
        }

        switch (button.type) {
          case 'action':
            widget = this.createElement('layer-action-button', {
              text: button.text,
              tooltip: button.tooltip,
              event: button.event,
              data: button.data,
            });
            break;
          case 'url':
            widget = this.createElement('layer-url-button', {
              text: button.text,
              url: button.url,
            });
            break;
          case 'choice':
            model = this.model.choices[button.data.responseName || 'selected'];
            if (model) {
              widget = this.createElement('layer-choice-button', {
                model,
              });
            } else {
              console.error('Failed to find a Choice Model to render');
            }
            break;
        }
        this.nodes.buttons.appendChild(widget);
      });
    },

    onRender() {
      this.onRerender();
    },

    /**
     *
     * @method
     */
    onRerender() {
      for (let i = 0; i < this.nodes.buttons.childNodes.length; i++) {
        const node = this.nodes.buttons.childNodes[i];
        if (node.tagName === 'LAYER-CHOICE-BUTTON') {
          node.model.responses = this.model.responses;
        }
      }
    },

    runAction(options) {
      if (this.nodes.subcard) {
        this.nodes.subcard.runAction(options);
        return true;
      }
    },
  },
});
