/*
   ProductModel = client.getCardModelClassForMimeType('application/vnd.layer.card.product+json')
   ChoiceModel = layer.Client.getCardModelClass('ChoiceModel')

   model = new ProductModel({
      customData: {
        product_id: "Frodo-the-dodo",
        sku: "frodo-is-ascew"
      },
      url: 'https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg',
      currency: 'USD',
      price: 175,
      quantity: 3,
      brand: 'Apple',
      name: 'Apple 2 plus desktop computer',
      description: 'This computer will last you a lifetime.  Its processing power far outweighs your old calculator.  Its DOS based interface is the most modern available anywhere in the world. Keyboard is built-in and ergonomic.',
      imageUrls: ['https://static.giantbomb.com/uploads/original/0/7465/1296890-apple3.jpg'],
      options: [
        new ChoiceModel({
          question: 'RAM',
          type: 'Label',
          allowReselect: true,
          selectedAnswer: 'large',
          choices: [
            {text:  "2K", id: "small"},
            {text:  "4K", id: "medium"},
            {text:  "8K", id: "large"},
          ]
        }),
        new ChoiceModel({
          question: 'Color',
          type: 'Label',
          allowReselect: true,
          selectedAnswer: 'offwhite',
          choices: [
            {text:  "Off White", id: "offwhite"},
            {text:  "Awful White", id: "awfwhite"}
          ]
        }),
      ]
  });
  model.generateMessage($("layer-conversation-view").conversation, message => message.send());

     ProductModel = client.getCardModelClassForMimeType('application/vnd.layer.card.product+json')
   ChoiceModel = layer.Client.getCardModelClass('ChoiceModel')
   ButtonsModel = layer.Client.getCardModelClass('ButtonsModel')
model = new ButtonsModel({
  buttons: [
    {
      "type": "choice",
      "choices": [{"text": "\uD83D\uDC4D", "id": "like", "tooltip": "like", "icon": "custom-like-button"}, {"text": "\uD83D\uDC4E", "id": "dislike", "tooltip": "dislike", "icon": "custom-dislike-button"}],
      "data": {"responseName": "thumborientation", allowReselect: true, allowDeselect: true}
    },
    {"type": "choice", "choices": [{"text": "I want to order one", "id": "buy", "tooltip": "buy"}], "data": {"responseName": "buy", allowReselect: false}}
  ],
  contentModel: new ProductModel({
    url: "http://www.neimanmarcus.com/Manolo-Blahnik-Fiboslac-Crystal-Embellished-Satin-Halter-Pump/prod200660136_cat13410734__/p.prod?icid=&searchType=EndecaDrivenCat&rte=%252Fcategory.service%253FitemId%253Dcat13410734%2526pageSize%253D30%2526No%253D0%2526Ns%253DPCS_SORT%2526refinements%253D299%252C381%252C4294910321%252C717%252C730&eItemId=prod200660136&xbcpath=cat13410734%2Ccat13030734%2Ccat000141%2Ccat000000&cmCat=product",
    price: 525,
    quantity: 1,
    currency: "USD",
    brand: "Prison Garb Inc",
    name: "Formal Strait Jacket",
    description: "The right choice for special occasions with your crazed inlaws.  This will make you feel like you at last belong.",
    imageUrls: [ "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg" ],
    options: [
      new ChoiceModel({
        question: 'Size',
        type: 'Label',
        selectedAnswer: 'small',
        choices: [
          {text:  "Small", id: "small"},
          {text:  "Medium", id: "medium"},
          {text:  "Large", id: "large"},
        ]
      }),
      new ChoiceModel({
        question: 'Color',
        type: 'Label',
        selectedAnswer: 'white',
        choices: [
          {text:  "White", id: "white"},
          {text:  "Black", id: "black"},
          {text:  "Gold", id: "gold"},
        ]
      })
    ]
  }),
});
  model.generateMessage($("layer-conversation-view").conversation, message => message.send());

   // Old Way
   ImageModel = client.getCardModelClassForMimeType('application/vnd.layer.card.image+json')
   model = new ProductModel({
      currency: 'USD',
      price: 175,
      quantity: 3,
      title: "A pretty picture",
      subtitle: "Prettier than YOU deserve!",
      detailModel: new ImageModel({
        sourceUrl: "https://farm5.staticflickr.com/4272/34912460025_be2700d3e7_k.jpg"
      })
  });
  model.generateMessage($("layer-conversation-view").conversation, message => message.send());

 * A Product model, typically used within a Recipt Model, but usable anywhere that you want to display simple product information.
 *
 * @class layerUI.cards.ProductModel
 * @extends layer.model
 */

import { Client, MessagePart, Root, CardModel } from '@layerhq/layer-websdk';

class ProductModel extends CardModel {
  _generateParts(callback) {
    const body = this._initBodyWithMetadata([
      'name', 'brand',  // naming
      'description', 'imageUrls', // Rendering
      'options',
      'currency', 'price', 'quantity', // Purchasing
      'url', // Action properties
    ]);
    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    if (!this.imageUrls) this.imageUrls = [];
    if (!this.options) this.options = [];

    if (this.options.length === 0) {
      callback([this.part]);
    } else {
      let count = 0;
      let parts = [this.part];
      this.options.forEach((option) => {
        this._addModel(option, 'options', (newParts) => {
          count++;
          newParts.forEach(p => parts.push(p));
          if (count === this.options.length) callback(parts);
        });
      });
    }
  }

  _parseMessage(payload) {
    super._parseMessage(payload);
    if (!this.imageUrls) this.imageUrls = [];

    const optionParts = this.childParts.filter(part => part.mimeAttributes.role === 'options');
    this.options = optionParts.map(part => this.getClient().createCardModel(this.message, part));
  }


  // getDescription and getFooter may be used by a ListCardContainer; need to define if this really uses a ListCardContainer though.a
  getDescription() {
    const result = [];
    if (this.brand) result.push(this.brand);
    if (this.model) result.push(this.model);
    return result.join(': ');
  }

  getFooter() {
    const price = this.getFormattedPrice();
    const total = new Number(this.price * this.quantity).toLocaleString(navigator.language, {
      currency: this.currency,
      style: 'currency',
    });
    return (this.quantity > 1 ? `Quantity: ${this.quantity}; Per Unit Cost: ${price}; Total: ${total}` : `Price: ${total}`);
  }
  getTitle() {
    return this.name;
  }
  getFormattedPrice() {
    if (!this.price) return '';
    return new Number(this.price).toLocaleString(navigator.language, {
      currency: this.currency,
      style: 'currency',
    });
  }
}

// Naming properties
ProductModel.prototype.name = '';
ProductModel.prototype.brand = '';

// Rendering properties
ProductModel.prototype.imageUrls = null;
ProductModel.prototype.description = '';

// Options Properties
ProductModel.prototype.options = null;

// Purchasing properties
ProductModel.prototype.currency = 'USD';
ProductModel.prototype.price = null;
ProductModel.prototype.quantity = 1;

// Action properties
ProductModel.prototype.url = ''; // Where to go for more information on this product
ProductModel.defaultAction = 'open-url';

ProductModel.Label = 'Product';
ProductModel.cardRenderer = 'layer-product-card';
ProductModel.MIMEType = 'application/vnd.layer.card.product+json';

MessagePart.TextualMimeTypes.push(ProductModel.MIMEType);

// Register the Card Model Class with the Client
Client.registerCardModelClass(ProductModel, 'ProductModel');

Root.initClass.apply(ProductModel, [ProductModel, 'ProductModel']);
module.exports = ProductModel;
