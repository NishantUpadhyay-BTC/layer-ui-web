/**
 * TODO: Location Model should be able to use one of these
 */

import { Client, MessagePart, CardModel, Util }  from 'layer-websdk';

class PersonModel extends CardModel {

  _parseMessage() {
    super._parseMessage();

    const payload = JSON.parse(this.part.body);
    Object.keys(payload).forEach((propertyName) => {
      this[Util.camelCase(propertyName)] = payload[propertyName];
    });

    this.addressModels = this.getModelsFromPart('address');
  }
}

PersonModel.prototype.addressModels = null;
PersonModel.prototype.phone = '';
PersonModel.prototype.email = '';
PersonModel.prototype.name = '';
PersonModel.prototype.jobRole = ''; // Used for Person who is an Employee only, not for customers
PersonModel.prototype.identity_id = '';

PersonModel.MIMEType = 'application/vnd.layer.card.person+json';

MessagePart.TextualMimeTypes.push(PersonModel.MIMEType);

// Register the Card Model Class with the Client
Client.registerCardModelClass(PersonModel, 'PersonModel');

module.exports = PersonModel;
