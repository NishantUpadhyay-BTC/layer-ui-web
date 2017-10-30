/**
 *
 * @class
 * @extends layerUI.components.Component
 */
import { registerComponent } from '../../components/component';
import { animatedScrollLeftTo } from '../../base';
import CardMixin from '../card-mixin';
import Throttler from '../../mixins/throttler';
import Clickable from '../../mixins/clickable';

registerComponent('layer-carousel-card', {
  template: `
    <span layer-id='prev' class="layer-next-icon layer-previous-icon" ></span>
    <div class="layer-carousel-card-items" layer-id="items"></div>
    <span layer-id='next' class="layer-next-icon" ></span>
  `,
  style: `
  layer-carousel-card {
    display: flex;
    flex-direction: row;
    align-items: center;
    max-width: 100%;
    position: relative;
  }
  layer-carousel-card .layer-next-icon {
    display: inline-block;
    z-index: 10;
    position: absolute;
    cursor: pointer;
  }

  layer-carousel-card.layer-carousel-end .layer-next-icon:not(.layer-previous-icon) {
    display: none;
  }
  layer-carousel-card.layer-carousel-start .layer-previous-icon {
    display: none;
  }
  .layer-carousel-card-items {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow-x: hidden;
  }
  .layer-carousel-card-items:after {
    content: "";
    flex: 0 0 5px;
  }
  `,

  mixins: [CardMixin, Throttler, Clickable],

  // Note that there is also a message property managed by the MessageHandler mixin
  properties: {
    cardContainerTagName: {
      noGetterFromSetter: true,
      get() {
        return this.model.title ? 'layer-titled-card-container' : null;
      },
    },
    widthType: {
      value: 'flex-card',
    },
  },
  methods: {
    getIconClass() {
      return '';
    },
    getTitle() {
      return this.model.title;
    },

    onDestroy() {
      window.removeEventListener('resize', this.properties.onResize);
    },

    onCreate() {
      this.addClickHandler('click-next', this.nodes.next, this._scroll.bind(this, true));
      this.addClickHandler('click-prev', this.nodes.prev, this._scroll.bind(this, false));
      this.properties.startX = this.properties.startY = null;
      this.properties.touching = false;
      this.properties.dx = 0;
      this.addEventListener('touchstart', this.touchstart.bind(this));
      this.addEventListener('touchend', this.touchend.bind(this));
      this.addEventListener('touchmove', this.touchmove.bind(this));

      this.properties.onResize = this._onResize.bind(this);
      window.addEventListener('resize', this.properties.onResize);
    },
    onRerender() {
      if (!this.properties._internalState.onAttachCalled) return;
      this._adjustCarouselWidth();

      // console.log("CAROUSEL onRERENDER");
      // TODO: Assign items ids so we don't need to blow away and then recreate them
      this.nodes.items.innerHTML = '';
      const maxCardWidth = this._getMaxCardWidth();
      this.model.items.forEach((item) => {
        // console.log('GENERATE: ' + item.id + '    ' + item.title);
        const card = this.createElement('layer-card-view', {
          message: this.model.message,
          rootPart: item.part,
          model: item,
          parentNode: this.nodes.items,
        });
        const preferedMinWidth = card.nodes.ui.preferredMinWidth;
        const preferedMaxWidth = Math.min(maxCardWidth, card.nodes.ui.preferredMaxWidth);
        switch (card.widthType) {
          case 'full-card':
            card.style.width = card.style.minWidth = preferedMaxWidth + 'px';
            break;
          case 'flex-card':
            if (preferedMaxWidth < preferedMinWidth) {
              card.style.maxWidth = card.style.minWidth = card.style.width = preferedMaxWidth + 'px';
            } else {
              card.style.maxWidth = card.style.minWidth = card.style.width = preferedMinWidth + 'px';
            }
            break;
        }
      });
      setTimeout(this._updateScrollButtons.bind(this), 10);
    },

    onAttach: {
      mode: registerComponent.MODES.AFTER,
      value() {
        setTimeout(this._updateScrollButtons.bind(this), 10);
        this.onRerender();
      },
    },
    _onResize() {
      this._throttler(() => this._adjustCarouselWidth());
    },

    _adjustCarouselWidth() {
      const parent = this.parentComponent.parentNode;
      if (!parent || !parent.clientWidth) return 0;
      const carouselWidth = parent.clientWidth ? Math.floor(parent.clientWidth - 2) : 0;
      if (carouselWidth) this.cardView.style.maxWidth = carouselWidth + 'px';
    },

    _getMaxCardWidth() {
      const parent = this.parentComponent.parentNode;
      if (!parent || !parent.clientWidth) return 350;
      let width = parent.clientWidth;
      if (width > 600) width = width * 0.6;
      else width = width * 0.8;
      return width;
    },


    _updateScrollButtons() {
      const root = this.nodes.items;
      if (!root.childNodes.length) return;
      this.toggleClass('layer-carousel-start', root.scrollLeft <= root.firstElementChild.offsetLeft);

      const lastVisible = this._findLastFullyVisibleCard() || this._findFirstPartiallyVisibleCard();
      const children = this.nodes.items.childNodes;
      this.toggleClass('layer-carousel-end', lastVisible === children[children.length - 1]);
    },

    // TODO:
    // 1. animated scroll
    // 2. scroll at 50-100% of width,
    // 3. Stop scrolling when a card is flush to the left or 100% is reached
    _scroll(isForward, evt) {
      evt.preventDefault();
      evt.stopPropagation();
      const root = this.nodes.items;
      const nodes = root.childNodes;
      const currentScroll = root.scrollLeft;

      if (isForward) {
        const lastVisible = this._findLastFullyVisibleCard() || this._findFirstPartiallyVisibleCard();
        const lastVisibleIndex = Array.prototype.indexOf.call(root.childNodes, lastVisible);
        if (lastVisible && lastVisibleIndex !== -1 && lastVisibleIndex < root.childNodes.length - 1) {
          const scrollToNode = nodes[lastVisibleIndex + 1];
          const scrollTo = scrollToNode.offsetLeft;
          animatedScrollLeftTo(root, scrollTo, 200, this._updateScrollButtons.bind(this));
          this.classList.remove('layer-carousel-start');
        }
      } else {
        this.classList.remove('layer-carousel-end');
        const firstVisible = this._findFirstFullyVisibleCard();
        const firstVisibleIndex = Array.prototype.indexOf.call(nodes, firstVisible);

        // If we aren't already at the left most item, process the scroll request
        if (firstVisibleIndex > 0) {

          // Starting with one item left of the first fully visible item, look for the right amont to scroll
          const rightMostCard = nodes[firstVisibleIndex - 1];
          const minScrollLeft = rightMostCard.offsetLeft - root.clientWidth + rightMostCard.clientWidth + 10;
          let found = false;
          for (let i = 0; i <= firstVisibleIndex - 1; i++) {
            const node = nodes[i];
            const scrollTo = node.offsetLeft;
            if (scrollTo > minScrollLeft) {
              animatedScrollLeftTo(root, scrollTo, 200, this._updateScrollButtons.bind(this));
              this.toggleClass('layer-carousel-start', scrollTo <= nodes[0].offsetLeft);
              found = true;
              break;
            }
          }
          if (!found) {
            const scrollTo = nodes[firstVisibleIndex - 1].offsetLeft;
            animatedScrollLeftTo(root, scrollTo, 200, this._updateScrollButtons.bind(this));
            this.toggleClass('layer-carousel-start', scrollTo <= nodes[0].offsetLeft);
            found = true;
          }
        }
      }
    },

    _findLastFullyVisibleCard(optionalScroll) {
      const root = this.nodes.items;
      if (!optionalScroll) optionalScroll = root.scrollLeft;
      const nodes = root.childNodes;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if ((node.offsetLeft + node.clientWidth) <= (root.offsetLeft + root.clientWidth + optionalScroll) &&
            node.offsetLeft >= root.offsetLeft + optionalScroll) return node;
      }
    },

    _findFirstFullyVisibleCard() {
      const root = this.nodes.items;
      const nodes = root.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.offsetLeft >= root.offsetLeft + root.scrollLeft) return node;
      }
    },

    _findFirstPartiallyVisibleCard() {
      const root = this.nodes.items;
      const nodes = root.childNodes;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.offsetLeft + node.clientWidth >= root.offsetLeft + root.scrollLeft) return node;
      }
    },

    /**
     *
     * @method
     */
    onRender() {

    },

    touchstart(evt) {
      this.properties.touching = true;
      const touch = evt.touches ? evt.touches[0] : evt;
      this.properties.dx = 0;
      this.properties.startScrollX = this.nodes.items.scrollLeft;
      this.properties.startX = touch.pageX;
      this.properties.startY = touch.pageY;
      //this.width = this.$element.width()
    },

    touchmove(evt) {
      if (!this.properties.touching) return;
      const touch = evt.touches ? evt.touches[0] : evt;
      const dx = touch.pageX - this.properties.startX;
      const dy = touch.pageY - this.properties.startY;
      if (Math.abs(dx) < Math.abs(dy)) return; // vertical scroll

      evt.preventDefault(); // prevent vertical scroll

      const scrollLeft = -dx;
      this.nodes.items.scrollLeft = this.properties.startScrollX + scrollLeft;
      if (document.activeElement.tagName === 'TEXTAREA') document.activeElement.blur();
    },

    touchend(evt) {
      if (!this.properties.touching) return;
      const root = this.nodes.items;

      const touch = evt.changedTouches ? evt.changedTouches[0] : evt;

      // If finger ended on a larger X than it started, then it moved right
      // If finger moved right, we are decreasing our scrollLeft value
      const fingerDirection = touch.pageX - this.properties.startX > 0 ? 'right' : 'left';

      const firstPartialCard = this._findFirstPartiallyVisibleCard();
      const cardWidth = firstPartialCard.clientWidth;
      const visibleCardWidth = firstPartialCard.offsetLeft + firstPartialCard.clientWidth - root.scrollLeft;
      const percentShown = visibleCardWidth / cardWidth;
      const distanceToEnd = root.scrollWidth - root.scrollLeft - root.clientWidth;
      const percentDistanceToEnd = distanceToEnd / cardWidth;

      if (fingerDirection === 'left') {
        if (percentDistanceToEnd < 0.6) {
          animatedScrollLeftTo(root, root.lastChild.offsetLeft, 200, this._updateScrollButtons.bind(this));
        } else if (percentShown > 0.6) {
          animatedScrollLeftTo(root, firstPartialCard.offsetLeft, 200, this._updateScrollButtons.bind(this));
        } else {
          animatedScrollLeftTo(root, firstPartialCard.nextElementSibling.offsetLeft, 200, this._updateScrollButtons.bind(this));
        }
      } else {
        if (percentDistanceToEnd < 0.4) {
          animatedScrollLeftTo(root, root.lastChild.offsetLeft, 200, this._updateScrollButtons.bind(this));
        } else if (percentShown < 0.4) {
          animatedScrollLeftTo(root, firstPartialCard.nextElementSibling.offsetLeft, 200, this._updateScrollButtons.bind(this));
        } else {
          animatedScrollLeftTo(root, firstPartialCard.offsetLeft, 200, this._updateScrollButtons.bind(this));
        }
      }
      this.properties.touching = false;
    },
  },
});

