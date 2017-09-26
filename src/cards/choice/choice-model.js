/**

   ChoiceModel = layer.Client.getCardModelClass('ChoiceModel')
   model = new ChoiceModel({
     question: "What is the airspeed velocity of an unladen swallow?",
     responseName: 'airselection',
     selectedAnswer: 'clever bastard',
     choices: [
        {text:  "Zero, it can not get off the ground!", id: "zero"},
        {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
        {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
      ],
   });
   model.generateMessage($("layer-conversation-view").conversation, message => message.send())


   ChoiceModel = layer.Client.getCardModelClass('ChoiceModel')
   model = new ChoiceModel({
     question: "What is the airspeed velocity of an unladen swallow?",
     responseName: 'airselection',
     selectedAnswer: 'clever bastard',
     customResponseData: {
       hey: "ho"
     },
     choices: [
        {text:  "Zero, it can not get off the ground!", id: "zero"},
        {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
        {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
      ],
   });
   model.generateMessage($("layer-conversation-view").conversation, message => message.send())


   ChoiceModel = layer.Client.getCardModelClass('ChoiceModel')
   model = new ChoiceModel({
     question: "Pick a color",
     responseName: 'color',
     selectedAnswer: 'black',
     allowReselect: true,
     choices: [
        {text:  "red", id: "red"},
        {
          text: "blue",
          id: "blue",
          states: {
            selected: {
              text: "blueish"
            }
          }
        },
        {
          text:  "black",
          id: "black",
          states: {
            default: {
              text: "darkgray"
            }
          }
        },
      ],
   });
   model.generateMessage($("layer-conversation-view").conversation, message => message.send())

  ChoiceModel = layer.Client.getCardModelClass('ChoiceModel')
   model = new ChoiceModel({
     question: "Pick a color",
     responseName: 'color',
     selectedAnswer: 'black',
     allowMultiselect: true,
     choices: [
        {text:  "red", id: "red"},
        {text:  "blue", id: "blue"},
        {text:  "black", id: "black"},
      ],
   });
   model.generateMessage($("layer-conversation-view").conversation, message => message.send())


  model = new ChoiceModel({
    allowReselect: true,
    question: "What is the airspeed velocity of an unladen swallow?",
    choices: [
        {text:  "Zero, it can not get off the ground!", id: "zero"},
        {text:  "Are we using Imperial or Metric units?", id: "clever bastard"},
        {text:  "What do you mean? African or European swallow?", id: "just a smart ass"},
      ]
   });
   model.generateMessage($("layer-conversation-view").conversation, message => message.send())
 *
 *
 * @class layerUI.cards.ChoiceModel
 * @extends layer.model
 */
import { Client, MessagePart, Root, CardModel } from '@layerhq/layer-websdk';
import ResponseModel from '../response/response-model';
import TextModel from '../text/text-model';

class ChoiceModel extends CardModel {
  _generateParts(callback) {
    const body = this._initBodyWithMetadata([
      'question', 'choices', 'selectedAnswer', 'type',
      'allowReselect', 'allowDeselect', 'allowMultiselect',
      'title', 'customResponseData',
    ]);
    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });
    this._buildActionModels();
    // if (this.selectedAnswer) this.selectAnswer({ id: this.selectedAnswer });
    callback([this.part]);
  }

  _parseMessage(payload) {
    if (this.selectedAnswer) delete payload.selected_answer;
    super._parseMessage(payload);
    if (this.allowMultiselect) this.allowDeselect = true;
    if (this.allowDeselect) this.allowReselect = true;
    this._buildActionModels();
    if (this.responses) {
      this._processNewResponses();
    }
    if (this.selectedAnswer) this.__updateSelectedAnswer(this.selectedAnswer);
  }

  _buildActionModels() {
    this.actionModels = this.choices.map((choice, index) => ({
      type: 'action',
      text: this.getText(index),
      event: 'layer-choice-select',
      data: { id: choice.id },
    }));
  }

  selectAnswer(answerData) {
    if (this.allowMultiselect) {
      this._selectMultipleAnswers(answerData);
    } else {
      this._selectSingleAnswer(answerData);
    }
  }

  _selectMultipleAnswers(answerData) {
    let selectionText;
    const { id, text } = this.getChoiceById(answerData.id);
    const selectedAnswers = (this.selectedAnswer || '').split(/\s*,\s*/);
    const answerDataIndex = selectedAnswers.indexOf(answerData.id);

    // Deselect it
    if (answerDataIndex !== -1) {
      selectedAnswers.splice(answerDataIndex, 1);
      selectionText = ' deselected ';
    } else {
      selectedAnswers.push(id);
      selectionText = ' selected ';
    }

    const responseModel = new ResponseModel({
      responseToMessage: this.message,
      responseToNodeId: this.parentNodeId || this.nodeId,
      participantData: {
        [this.responseName]: selectedAnswers.join(','),
      },
      messageModel: new TextModel({
        text: this.getClient().user.displayName + selectionText + text,
      }),
    });
    if (!this.message.isNew()) {
      responseModel.send();
    }
    this.selectedAnswer = selectedAnswers.join(',');
    this.trigger('change');
    if (this.pauseUpdateTimeout) clearTimeout(this.pauseUpdateTimeout);

    // We generate local changes, we generate more local changes then the server sends us the first changes
    // which we need to ignore. Pause 6 seconds and wait for all changes to come in before rendering changes
    // from the server after a user change.
    this.pauseUpdateTimeout = setTimeout(() => {
      this.pauseUpdateTimeout = 0;
      if (this.message && !this.message.isNew()) this._processNewResponses();
    }, 6000);
  }

  _getNameOfCard() {
    const client = this.getClient();
    if (this.parentNodeId) {
      const parentNode = this.message.getPartsMatchingAttribute({'parent-node-id': this.parentNodeId })[0];
      if (parentNode) {
        const model = client.createCardModel(this.message, parentNode);
        if (model && model.getChoiceModelResponseTopic && model.getChoiceModelResponseTopic()) {
          return model.getChoiceModelResponseTopic();
        }
      }
    }

    if (this.question) {
      return this.question;
    }
  }

  _selectSingleAnswer(answerData) {
    let selectedIndex = this.getChoiceIndexById(answerData.id);
    let selectedId = selectedIndex === -1 ? '' : this.choices[selectedIndex].id;
    const nameOfCard = this._getNameOfCard();
    if (!this.selectedAnswer || this.allowReselect) {
      let action = 'selected';
      const selectedText = this.getText(selectedIndex);

      if (this.isSelectedIndex(selectedIndex) && this.allowDeselect) {
        selectedIndex = -1;
        selectedId = '';
        action = 'deselected';
      }

      const participantData = {
        [this.responseName]: selectedId,
      };
      if (this.customResponseData) {
        Object.keys(this.customResponseData).forEach(key => (participantData[key] = this.customResponseData[key]));
      }

      const responseModel = new ResponseModel({
        participantData,
        responseToMessage: this.message,
        responseToNodeId: this.parentNodeId || this.nodeId,
        messageModel: new TextModel({
          text: `${this.getClient().user.displayName} ${action} "${selectedText}"` + (nameOfCard ? ` for "${nameOfCard}"` : ''),
        }),
      });
      if (!this.message.isNew()) {
        responseModel.send();
      }
      this.selectedAnswer = selectedId;
      this.trigger('change');
      if (this.pauseUpdateTimeout) clearTimeout(this.pauseUpdateTimeout);

      // We generate local changes, we generate more local changes then the server sends us the first changes
      // which we need to ignore. Pause 6 seconds and wait for all changes to come in before rendering changes
      // from the server after a user change.
      this.pauseUpdateTimeout = setTimeout(() => {
        this.pauseUpdateTimeout = 0;
        if (this._hasPendingResponse) this._processNewResponses();
      }, 6000);
    }
  }

  _processNewResponses() {
    if (!this.pauseUpdateTimeout) {
      this._hasPendingResponse = false;
      const senderId = this.message.sender.userId;
      const data = this.responses.participantData;
      let responseIdentityIds = Object.keys(data).filter(participantId => data[participantId][this.responseName]);
      if (responseIdentityIds.length > 1) {
        responseIdentityIds = responseIdentityIds.filter(id => senderId !== id);
      } else if (responseIdentityIds.length) {
        this.selectedAnswer = data[responseIdentityIds[0]][this.responseName];
      }
    } else {
      this._hasPendingResponse = true;
    }
  }

  __updateSelectedAnswer(newValue) {
    this._triggerAsync('change');
  }

  getOneLineSummary() {
    return this.question || this.title;
  }


  __getCurrentCardRenderer() {
    switch (this.type) {
      case 'standard':
        return 'layer-choice-card';
      // case 'TiledChoices':
      // return 'layer-choice-tiles-card';
      case 'Label':
        return 'layer-choice-label-card';
    }
  }

  __updateAllowDeselect(newValue) {
    if (newValue) {
      this.allowReselect = true;
    }
  }

  __updateAllowMultiselect(newValue) {
    if (newValue) {
      this.allowDeselect = true;
    }
  }

  getChoiceById(id) {
    for (let i = 0; i < this.choices.length; i++) {
      if (this.choices[i].id === id) return this.choices[i];
    }
    return null;
  }

  getChoiceIndexById(id) {
    const choice = this.getChoiceById(id);
    return this.choices.indexOf(choice);
  }

  isSelectedIndex(choiceIndex) {
    if (choiceIndex >= this.choices.length) return false;
    const indexId = this.choices[choiceIndex].id;
    if (this.allowMultiselect) {
      const selectedAnswers = (this.selectedAnswer || '').split(/\s*,\s*/);
      return selectedAnswers.indexOf(indexId) !== -1;
    } else {
      return indexId === this.selectedAnswer;
    }
  }

  getText(choiceIndex) {
    const choice = this.choices[choiceIndex];
    let text = choice.text;
    const state = this.getState(choiceIndex);
    if (choice.states && choice.states[state] && choice.states[state].text) {
      text = choice.states[state].text;
    }
    return text;
  }
  getTooltip(choiceIndex) {
    const choice = this.choices[choiceIndex];
    let tooltip = choice.tooltip;
    const state = this.getState(choiceIndex);
    if (choice.states && choice.states[state] && choice.states[state].tooltip) {
      tooltip = choice.states[state].tooltip;
    }
    return tooltip;
  }
  getState(choiceIndex) {
    if (this.isSelectedIndex(choiceIndex)) {
      return 'selected';
    } else {
      return 'default';
    }
  }
}

ChoiceModel.prototype.pauseUpdateTimeout = 0;
ChoiceModel.prototype.allowReselect = false;
ChoiceModel.prototype.allowDeselect = true; // if true, allowReselect is forced to true
ChoiceModel.prototype.allowMultiselect = false; // if true, allowReselect is forced to true and allowDeselect is forced to true
ChoiceModel.prototype.type = 'standard';
ChoiceModel.prototype.title = 'Choose One';
ChoiceModel.prototype.question = '';
ChoiceModel.prototype.choices = null;
ChoiceModel.prototype.responseName = 'selection';
ChoiceModel.prototype.responses = null;
ChoiceModel.prototype.currentCardRenderer = null;
ChoiceModel.prototype.selectedAnswer = null;
ChoiceModel.prototype.customResponseData = null;

ChoiceModel.Label = 'Choose One';
ChoiceModel.defaultAction = 'layer-choice-select';
ChoiceModel.cardRenderer = 'layer-choice-card';
ChoiceModel.MIMEType = 'application/vnd.layer.card.choice+json';
MessagePart.TextualMimeTypes.push(ChoiceModel.MIMEType);

Root.initClass.apply(ChoiceModel, [ChoiceModel, 'ChoiceModel']);

// Register the Card Model Class with the Client
Client.registerCardModelClass(ChoiceModel, 'ChoiceModel');

module.exports = ChoiceModel;
