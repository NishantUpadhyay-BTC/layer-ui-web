import Layer from '@layerhq/layer-websdk';

/**
 * A Mixin for main components that can receive or generate a Query
 *
 * @class layerUI.mixins.HasQuery
 */
module.exports = {
  properties: {

    /**
     * The Client is needed in order for the list to get a Query from a queryId
     *
     * @property {layer.Client} [client=null]
     */
    client: {
      set(value) {
        if (value) {
          if (this.queryId) {
            this.query = value.getQuery(this.queryId);
          }
          if (this.properties._isMainComponent && this.useGeneratedQuery) {
            this._setupGeneratedQuery();
          }
        }
      },
    },

    /**
     * The ID for the layer.Query providing the items to render.
     *
     * Note that you can directly set the `query` property as well.
     *
     * Leaving this and the query properties empty will cause a layer.Query to be generated for you.
     *
     * @property {String} [queryId='']
     */
    queryId: {
      set(value) {
        if (value && value.indexOf('layer:///') !== 0) this.properties.queryId = '';
        if (this.client) {
          this.query = this.queryId ? this.client.getQuery(this.queryId) : null;
        }
      },
    },

    /**
     * A layer.Query provides the items to render.
     *
     * Suggested practices:
     *
     * * If your not using this query elsewhere in your app, let this widget generate its own Query
     * * If setting this from an html template, use layerUI.mixins.List.queryId instead.
     *
     * @property {layer.Query} [query=null]
     */
    query: {
      set(newValue, oldValue) {
        if (oldValue) oldValue.off(null, null, this);
        if (newValue instanceof Layer.Query) {
          this._updateQuery();
        } else {
          this.properties.query = null;
        }

        // If there is an oldQuery that we didn't generate, its up to the app to destroy it when it is done.
        if (this.properties._isMainComponent && this.hasGeneratedQuery) {
          this.hasGeneratedQuery = false;
          oldValue.destroy();
        }
      },
    },

    queryFilter: {
      set() {
        if (this.query) this.query.filter = this.properties.queryFilter;
      },
    },

    /**
     * The Query was generated internally, not passed in as an attribute or property.
     *
     * @property {Boolean} [hasGeneratedQuery=false]
     * @readonly
     */
    hasGeneratedQuery: {
      value: false,
      type: Boolean,
    },

    /**
     * Does this widget generate its own query or should that behavior be prevented?
     *
     * If your providing your own Query, its a good practice to insure that a Query is NOT generated by the widget
     * as that Query will promptly fire, and consume your user's bandwidth.
     *
     * @property {Boolean } [useGeneratedQuery=true]
     */
    useGeneratedQuery: {
      value: true,
      type: Boolean,
    },

    /**
     * How many items to page in each time we page the Query.
     *
     * @property {Number} [pageSize=50]
     */
    pageSize: {
      value: 50,
    },
  },
  methods: {

    /**
     * A Component typically expects a Query as an input... or it needs to create its own.
     *
     * This method tests to see if it expects or has a Query, and creates one if needed.
     *
     * @method
     * @private
     */
    _setupGeneratedQuery() {
      // Warning: Do not call the query getter via `this.query` as it may cause an infinite loop
      if (this._queryModel && !this.properties.query && this.client && !this.client.isDestroyed) {
        this.query = this.client.createQuery({
          model: this._queryModel,
          dataType: Layer.Query.InstanceDataType,
          paginationWindow: this.pageSize || 50,
          sortBy: this.sortBy,
        });
        if (this.properties.queryFilter) this.query.filter = this.properties.queryFilter;
        this.hasGeneratedQuery = true;
      }
    },

    /**
     * Any time we get a new Query assigned, wire it up.
     *
     * @method _updateQuery
     * @private
     */
    _updateQuery() {
      this.client = this.query.client;
      this.onRender();
      this.query.on('change', this.onRerender, this);
    },
  },
};
