/**
 * The Layer Date widget renders a date.
 *
 * This is provided as a specialized component so that it can be easily redefined by your app to
 * provide your own date formatting.  Note that most customization of date rendering can be accomplished instead
 * using layerUI.components.ConversationPanel.dateRenderer.
 *
 * ```
 * layerUI.registerComponent('layer-date', {
 *    properties: {
 *      date: {
 *        set: function(value) {
 *           // Render a random date value that is related to but not exactly the provided value
 *           var newDate = new Date(value);
 *           newDate.setHours(newDate.getHours() + Math.random() * 10);
 *           this.innerHTML = newDate.toISOString();
 *        }
 *      }
 *    }
 * });
 *
 * // Call init after custom components are defined
 * layerUI.init({
 *   appId:  'layer:///apps/staging/UUID'
 * });
 * ```
 *
 * @class layerUI.components.subcomponents.Date
 * @extends layerUI.components.Component
 */
import { registerComponent } from '../../../components/component';

registerComponent('layer-date', {
  properties: {
    defaultFormat: {
      value: { hour: '2-digit', minute: '2-digit' },
      set(value) {
        if (typeof value === 'string') {
          try {
            this.properties.defaultFormat = JSON.parse(value);
          } catch (e) {
            this.properties.defaultFormat = {};
          }
        }
        this.onRender();
      },
    },

    todayFormat: {
      set(value) {
        if (typeof value === 'string') {
          try {
            this.properties.todayFormat = JSON.parse(value);
          } catch (e) {
            // No-op
          }
        }
        this.onRender();
      },
    },

    weekFormat: {
      set(value) {
        if (typeof value === 'string') {
          try {
            this.properties.weekFormat = JSON.parse(value);
          } catch (e) {
            // No-op
          }
        }
        this.onRender();
      },
    },
    olderFormat: {
      set(value) {
        if (typeof value === 'string') {
          try {
            this.properties.olderFormat = JSON.parse(value);
          } catch (e) {
            // No-op
          }
        }
        this.onRender();
      },
    },

    /**
     * Date to be rendered
     *
     * TODO: We do not need seconds in a typical date output; need to investigate how to do that with localizations
     *
     * @property {Date} [date=null]
     */
    date: {
      set(value) {
        this.setAttribute('title', value ? value.toLocaleString() : '');
        this.onRender();
      },
    },

    /**
     * The actual rendered string.
     *
     * @property {String} [value='']
     */
    value: {
      set(value) {
        this.innerHTML = value;
      },
    },

    /**
     * Provide property to override the function used to render a date for each Message Item.
     *
     * Note that changing this will not regenerate the list; this should be set when initializing a new List.
     *
     * ```javascript
     * dateItem.dateRenderer = function(date) {
     *    return date.toISOString();
     * };
     * ```
     *
     * @property {Function} [dateRender=null]
     */
    dateRenderer: {},
  },
  methods: {
    onRender: function onRender() {
      const value = this.date;
      if (value) {
        if (this.dateRenderer) {
          this.value = this.dateRenderer(value);
        } else {
          const today = new Date();
          const isToday = value.toLocaleDateString() === today.toLocaleDateString();
          const isWeek = value.getTime() > today.getTime() - 6 * 24 * 60 * 60 * 1000;
          const isThisYear = today.getFullYear() === value.getFullYear();

          let format;
          if (isToday && this.todayFormat) {
            format = this.todayFormat;
          } else if (isWeek && this.weekFormat) {
            format = this.weekFormat;
          } else if (!isThisYear && this.olderFormat) {
            format = this.olderFormat;
          } else {
            format = this.defaultFormat;
          }

          this.value = value.toLocaleString('lookup', format);
        }
      } else {
        this.value = '';
      }
    },
  },
});

