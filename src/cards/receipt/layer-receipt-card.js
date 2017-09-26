/**
 *
 * @class layerUI.handlers.message.CardView
 * @extends layerUI.components.Component
 */
import { registerComponent } from '../../components/component';
import CardMixin from '../card-mixin';

registerComponent('layer-product-card-mini', {
  template: `
    <img layer-id='img' />
    <div class='layer-product-card-mini-right'>
      <div layer-id="name" class="layer-receipt-card-name"></div>
      <div layer-id="options" class="layer-receipt-card-options"></div>
      <div layer-id="quantity" class="layer-receipt-card-quantity"></div>
      <div layer-id="price" class="layer-receipt-card-price"></div>
    </div>
  `,
  style: `layer-product-card-mini {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
  }
  `,
  properties: {
    item: {},
  },
  methods: {
    onRender() {
      this.onRerender();
    },
    onRerender() {
      this.nodes.img.src = this.item.imageUrls[0];
      this.nodes.name.innerHTML = this.item.name;
      this.nodes.price.innerHTML = this.item.getFormattedPrice();
      this.nodes.quantity.innerHTML = this.item.quantity !== 1 ? this.item.quantity : '';
      if (this.item.options) {
        const selectedOptions = this.item.options.map((choiceModel) => {
          if (choiceModel.selectedAnswer) {
            return choiceModel.choices.filter(choice => choice.id === choiceModel.selectedAnswer)[0].text;
          }
        }).filter(selectedText => selectedText).join(', ');
        this.nodes.options.innerHTML = selectedOptions;
      }
    },
  },
});

registerComponent('layer-receipt-card', {
  template: `
  <div class="layer-receipt-for-products" layer-id="products"></div>
  <div class='layer-receipt-details'>
    <div class='layer-paid-with layer-receipt-detail-item'>
      <label>Paid with</label>
      <div class="layer-receipt-paid-with layer-card-description" layer-id='paidWith'></div>
    </div>
    <div class='layer-address layer-receipt-detail-item'>
      <label>Ship to</label>
      <layer-card-view layer-id='shipTo' hide-map='true'></layer-card-view>
    </div>
    <div class='layer-receipt-summary layer-receipt-detail-item'>
      <label>Total</label>
      <span class='layer-receipt-price' layer-id='total'></span>
    </div>
  </div>
  `,
  style: `layer-receipt-card {
    display: block;
  }
  layer-card-view.layer-receipt-card {
    padding-bottom: 0px;
  }
  layer-receipt-card.layer-receipt-no-payment .layer-paid-with {
    display: none;
  }
  `,
  mixins: [CardMixin],
  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    cardContainerTagName: {
      noGetterFromSetter: true,
      value: 'layer-titled-card-container',
    },
    widthType: {
      value: 'full-card',
    },
  },
  methods: {

    getIconClass() {
      return 'layer-receipt-card-icon';
    },
    getTitle() {
      return this.model.title || 'Order Confirmation';
    },

    /**
     *
     * @method
     */
    onRender() {

    },

    onRerender() {
      this.nodes.products.innerHTML = '';
      this.model.items.forEach((item) => {
        this.createElement('layer-product-card-mini', {
          item,
          parentNode: this.nodes.products,
        });
      });

      if (this.model.shippingAddressModel) {
        const shipTo = this.nodes.shipTo;
        this.model.shippingAddressModel.showAddress = true;
        shipTo.rootPart = this.model.shippingAddressModel.part;
        shipTo.model = this.model.shippingAddressModel;

        shipTo.message = this.model.message;
        shipTo.cardBorderStyle = 'none';
        shipTo._onAfterCreate();

        shipTo.nodes.ui.hideMap = true;
      }

      this.nodes.total.innerHTML = new Number(this.model.summary.totalCost)
        .toLocaleString(navigator.language, {
          currency: this.model.currency,
          style: 'currency',
        });
      this.nodes.paidWith.innerHTML = this.model.paymentMethod || 'Unknown';

      this.toggleClass('layer-receipt-no-payment', !this.model.paymentMethod);
    },
  },
});

