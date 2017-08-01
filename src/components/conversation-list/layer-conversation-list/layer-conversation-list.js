/**
 * The Layer Conversation List widget renders a scrollable, pagable list of Conversations.
 *
 * This Component can be added to your project directly in the HTML file:
 *
 * ```
 * <layer-conversation-list></layer-conversation-list>
 * ```
 *
 * Or via DOM Manipulation:
 *
 * ```javascript
 * var conversation = document.createElement('layer-conversation-list');
 * ```
 *
 * And then its properties can be set as:
 *
 * ```javascript
 * var list = document.querySelector('layer-conversation-list');
 * list.onConversationSelected = function(evt) {
 *    alert(evt.detail.item.id + ' has been selected');
 * }
 * ```
 *
 * ## Common Properties
 *
 * The most common property of this widget is layerUI.components.ConversationsListPanel.onConversationSelected, as typical use
 * of this widget is to prompt the user to select a Conversation, and use that selection elsewhere.
 *
 * Note that you can also listen for `layer-conversation-selected` to achieve the same result:
 *
 * ```
 * document.body.addEventListener('layer-conversation-selected', function(evt) {
 *    alert(evt.detail.item.id + ' has been selected');
 * });
 * ```
 *
 * You may also sometimes want to set which Conversation to mark as selected:
 *
 * ```javascript
 * conversationList.selectedConversationId = myConversation.id;
 * ```
 *
 * @class layerUI.components.ConversationsListPanel.List
 * @extends layerUI.components.Component
 * @mixin layerUI.mixins.List
 * @mixin layerUI.mixins.MainComponent
 * @mixin layerUI.mixins.ListSelection
 * @mixin layerUI.mixins.ListLoadIndicator
 * @mixin layerUI.mixins.EmptyList
 */
import Layer from 'layer-websdk';
import { registerComponent } from '../../../components/component';
import List from '../../../mixins/list';
import ListLoadIndicator from '../../../mixins/list-load-indicator';
import ListSelection from '../../../mixins/list-selection';
import MainComponent from '../../../mixins/main-component';
import SizeProperty from '../../../mixins/size-property';
import EmptyList from '../../../mixins/empty-list';
import QueryEndIndicator from '../../../mixins/query-end-indicator';
import '../layer-conversation-item/layer-conversation-item';
import '../layer-channel-item/layer-channel-item';


registerComponent('layer-conversation-list', {
  mixins: [List, ListSelection, MainComponent, ListLoadIndicator, SizeProperty, EmptyList, QueryEndIndicator],

  /**
   * Configure a custom action when a Conversation is selected;
   *
   * Use `evt.preventDefault()` to prevent default handling from occuring.
   *
   * ```javascript
   *    document.body.addEventListener('layer-conversation-selected', function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to select this conversation:
   *      evt.preventDefault();
   *    });
   * ```
   *
   * OR
   *
   * ```javascript
   *    converationList.onConversationSelected = function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to select this conversation:
   *      evt.preventDefault();
   *    });
   * ```
   *
   * @property {Function} onConversationSelected
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {layer.Conversation} evt.detail.item   The selected Conversation
   * @param {Event} evt.detail.originalEvent               The click event that selected the Conversation
   */

  /**
   * See layerUI.components.ConversationsListPanel.onConversationSelected.
   *
   * @event layer-conversation-selected
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {layer.Conversation} evt.detail.item   The selected Conversation
   * @param {Event} evt.detail.originalEvent               The click event that selected the Conversation
   */

  /**
   * The user has clicked to delete a conversation.
   *
   * ```javascript
   *    conversationListNode.onConversationDeleted = function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to delete this conversation (perhaps you want
   *      // to leave the Conversation instead of delete it):
   *      evt.preventDefault();
   *      conversation.leave();
   *    };
   * ```
   *
   *  OR
   *
   * ```javascript
   *    document.body.addEventListener('layer-conversation-deleted', function(evt) {
   *      var conversation = evt.detail.item;
   *
   *      // To prevent the UI from proceding to delete this conversation (perhaps you want
   *      // to leave the Conversation instead of delete it):
   *      evt.preventDefault();
   *      conversation.leave();
   *    });
   * ```
   *
   * @property {Function} onConversationDeleted
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {layer.Conversation} evt.detail.item
   */

  /**
   * See layerUI.components.ConversationsListPanel.List.onConversationDeleted.
   *
   * @event layer-conversation-deleted
   * @param {Event} evt
   * @param {Object} evt.detail
   * @param {layer.Conversation} evt.detail.item
   */

  events: ['layer-conversation-selected', 'layer-conversation-deleted'],
  properties: {

    /**
     * Get/Set the selected Conversation by ID.
     *
     * ```javascript
     * conversationList.selectedConversationId = myConversation.id;
     * ```
     *
     * Or if using a templating engine:
     *
     * ```html
     * <layer-conversation-list selected-conversation-id={{selectedConversation.id}}></layer-conversation-list>
     * ```
     *
     * The above code will set the selected Conversation and render the conversation as selected.
     *
     * @property {String} [selectedConversationId='']
     * @deprecated see layerUI.components.ConversationsListPanel.ListSelection.selectedId
     */
    selectedConversationId: {
      set(value) {
        this.selectedId = value;
      },
      get() {
        return this.selectedId;
      },
    },

    /**
     * Function allows for control over which Conversations can be deleted and which can not.
     *
     * Return true means enabled, false is disabled.
     *
     *  ```javascript
     * conversationPanel.deleteConversationEnabled = function(conversation) {
     *     return conversation.metadata.category !== 'adminStuff';
     * });
     * ```
     *
     * If delete is enabled, the layerUI.components.misc.Delete.enabled property is changed, causing
     * the `layer-delete-enabled` css class to be added/removed on that widget.
     *
     * @property {Function} [deleteConversationEnabled=null]
     * @property {layer.Conversation} deleteConversationEnabled.conversation
     * @property {Boolean} deleteConversationEnabled.return
     */
    deleteConversationEnabled: {
      type: Function,
    },

    /**
     * The model to generate a Query for if a Query is not provided.
     *
     * @readonly
     * @private
     * @property {String} [_queryModel=layer.Query.Conversation]
     */
    _queryModel: {
      value: Layer.Query.Conversation,
    },

    /**
     * Sort by takes as value `lastMessage` or `createdAt`; for initialization only.
     *
     * This will not resort your list after initialization; use `list.query.update()` for that.
     *
     * @property {String} [sortBy=lastMessage]
     */
    sortBy: {
      order: -1, // needs to fire before appId and client are set
      value: 'lastMessage',
      set(value) {
        switch (value) {
          case 'lastMessage':
            this.properties.sortBy = [{ 'lastMessage.sentAt': 'desc' }];
            break;
          default:
            this.properties.sortBy = [{ 'createdAt': 'desc' }];
        }
      },
    },

    /**
     * The event name to trigger on selecting a Conversation.
     *
     * @readonly
     * @private
     * @property {String} [_selectedItemEventName=layer-conversation-selected]
     */
    _selectedItemEventName: {
      value: 'layer-conversation-selected',
    },

    /**
     * Provide a function to determine if the last message is rendered in the Conversation List.
     *
     * By default, only text/plain last-messages are rendered in the Conversation List.
     *
     * ```javascript
     * list.canFullyRenderLastMessage = function(message) {
     *     return message.parts[0].mimeType === 'text/mountain' ||
     *            message.parts[0].mimeType === 'text/plain';
     * }
     * ```
     *
     * If you enable rendering of images for example, you would be enabling the handler that renders image messages
     * in the Message List to render that same image in the Conversation List.
     *
     * If you prevent rendering of a Message, it will instead render the `label` attribute for that message handler;
     * see layerUI.registerMessageHandler for more info on the `label`.
     *
     * TODO: Should test to see what handler is returned rather than testing the mimeType
     *
     * @property {Function} canFullyRenderLastMessage
     * @removed
     */


    /**
     * Provide a function that returns the menu items for the given Conversation.
     *
     * Note that this is called each time the user clicks on a menu button to open the menu,
     * but is not dynamic in that it will regenerate the list as the Conversation's properties change.
     *
     * Format is:
     *
     * ```
     * widget.getMenuOptions = function(conversation) {
     *   return [
     *     {text: "label1", method: method1},
     *     {text: "label2", method: method2},
     *     {text: "label3", method: method3}
     *   ];
     * }
     * ```
     *
     * @property {Function} getMenuOptions
     * @property {layer.Conversation} getMenuOptions.conversation
     * @property {Object[]} getMenuOptions.returns
     */
    getMenuOptions: {
      type: Function,
      value: function getMenuOptions(conversation) {
        return [
          {
            text: 'delete',
            method() {
              conversation.delete(Layer.Constants.DELETION_MODE.ALL);
            },
          },
        ];
      },
    },

    /**
     * This iteration of this property is not dynamic; it will be applied to all future Conversation Items,
     * but not to the currently generated items.
     *
     * Use this to configure how dates are rendered.
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString for details
     * on the parameters that are supported by `toLocaleString`.
     *
     * There are four supported inputs
     *
     * * `today`: How to render dates that are today
     * * `week`: How to render dates that are not today, but within a 6 of today (note if today is
     *   wednesday, 1 week ago is also wednesday, and rendering `wednesday` would be confusing, so its 6 rather than 7 days.
     * * `default`: The default format to use
     * * `older`: The format to use for dates that are in a different year and more than 6 months in the past
     *
     * Example:
     *
     * ```
     * widget.dateFormat = {
     *    today: {"hour": "numeric", "minute": "numeric"},
     *    week: {"weekday": "short"},
     *    default: {"month": "short", "day": "2-digit"},
     *    older: {"month": "short", "year": "numeric"}
     * }
     * ```
     *
     * @property {Object}
     */
    dateFormat: {},


    size: {
      value: 'large',
      set(size) {
        for (let i = 0; i < this.childNodes.length; i++) {
          this.childNodes[i].size = size;
        }
      },
    },
    supportedSizes: {
      value: ['tiny', 'small', 'medium', 'large'],
    },

    replaceableContent: {
      value: {
        conversationRowLeftSide(widget) {
          const div = document.createElement('div');
          const avatar = document.createElement('layer-avatar');
          avatar.setAttribute('layer-id', 'avatar');
          avatar.size = this.size;
          const presence = document.createElement('layer-presence');
          presence.setAttribute('layer-id', 'presence');
          presence.size = 'medium';
          const groupCounter = document.createElement('div');
          groupCounter.classList.add('layer-group-counter');
          groupCounter.setAttribute('layer-id', 'groupCounter');
          div.appendChild(avatar);
          div.appendChild(presence);
          div.appendChild(groupCounter);
          return div;
        },
        conversationRowRightSide(widget) {
          const div = document.createElement('div');
          const menuButton = document.createElement('layer-menu-button');
          menuButton.setAttribute('layer-id', 'menuButton');
          div.appendChild(menuButton);
          return div;
        },
      },
    },
  },
  methods: {
    /**
     * Generate a `layer-conversation-item` widget.
     *
     * @method _generateItem
     * @private
     * @param {layer.Conversation} conversation
     */
    _generateItem(conversation) {
      const isChannel = conversation instanceof Layer.Channel;
      const conversationWidget = document.createElement(`layer-${isChannel ? 'channel' : 'conversation'}-item`);
      conversationWidget.id = this._getItemId(conversation.id);
      conversationWidget.deleteConversationEnabled = typeof this.deleteConversationEnabled === 'function' ?
        this.deleteConversationEnabled(conversation) : true;
      conversationWidget.canFullyRenderLastMessage = this.canFullyRenderLastMessage;
      conversationWidget.item = conversation;
      conversationWidget.size = this.size;
      if (this.getMenuOptions) conversationWidget.getMenuOptions = this.getMenuOptions;
      if (this.dateFormat) conversationWidget.dateFormat = this.dateFormat;

      if (this.filter) conversationWidget._runFilter(this.filter);
      return conversationWidget;
    },
  },
  listeners: {
    'layer-notification-click': function notificationClick(evt) {
      const message = evt.detail.item;
      const conversation = message.getConversation();
      if (conversation) this.selectedId = conversation.id;
    },
  },
});