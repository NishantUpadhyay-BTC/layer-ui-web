if (window.Notification) {
  describe('layer-notifier', function() {
    var el, testRoot, client, conversation, message;

    beforeAll(function(done) {
      if (layerUI.components['layer-conversation-panel'] && !layerUI.components['layer-conversation-panel'].classDef) layerUI.init({});
      setTimeout(done, 1000);
    });

    beforeEach(function() {
      client = new layer.Client({
        appId: 'Fred'
      });
      client.user = new layer.Identity({
        client: client,
        userId: 'FrodoTheDodo',
        id: 'layer:///identities/FrodoTheDodo',
        isFullIdentity: true
      });
      client._clientAuthenticated();

      if (layerUI.components['layer-conversation-panel'] && !layerUI.components['layer-conversation-panel'].classDef) layerUI.init({});
      testRoot = document.createElement('div');
      document.body.appendChild(testRoot);
      el = document.createElement('layer-notifier');
      el.client = client;
      testRoot.appendChild(el);
      conversation = client.createConversation({
        participants: ['layer:///identities/FrodoTheDodo']
      });
      message = conversation.createMessage("Hello");
      layer.Util.defer.flush();
    });
    afterEach(function() {
      layer.Util.defer.reset();
      document.body.removeChild(testRoot);
      layer.Client.removeListenerForNewClient();
    });

    describe('Event Handling', function() {
      it("Should call onMessageNotification when it triggers layer-message-notification", function() {
        var spy = jasmine.createSpy('callback');
        el.onMessageNotification = spy;
        el.trigger('layer-message-notification', {message: message});
        expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
      });

      it("Should call onNotificationClick when it triggerse layer-notification-click", function() {
        var spy = jasmine.createSpy('callback');
        el.onNotificationClick = spy;
        el.trigger('layer-notification-click', {message: message});
        expect(spy).toHaveBeenCalledWith(jasmine.any(CustomEvent));
      });
    });

    describe("The flagTitlebar property", function() {
      var title
      beforeAll(function() {
        title = document.title;
      });
      afterAll(function() {
        document.title = title;
      });

      it("Should show the badge", function() {
        document.title = "hello";
        el.flagTitlebar = true;
        expect(document.title).toEqual("⬤ hello");
        el.flagTitlebar = false;
        el.flagTitlebar = true;
        expect(document.title).toEqual("⬤ hello");
      });

      it("Should hide the badge", function() {
        document.title = "⬤ hello";
        el.properties.flagTitlebar = true;
        el.flagTitlebar = false; // trigger the setter
        expect(document.title).toEqual("hello");
        el.flagTitlebar = true;
        el.flagTitlebar = false;
        expect(document.title).toEqual("hello");
      });
    });

    describe("The notifyCharacterForTitlebar property", function() {
      var title
      beforeAll(function() {
        title = document.title;
      });
      afterAll(function() {
        document.title = title;
      });

      it("Should set how bading is rendered", function() {
        el.notifyCharacterForTitlebar = "frodo says";
        document.title = "hello";
        el.flagTitlebar = true;
        expect(document.title).toEqual("frodo says hello");
      });
    });

    describe("The flagTitlebarForMessage property", function() {
      var title
      beforeAll(function() {
        title = document.title;
      });
      afterAll(function() {
        document.title = title;
      });

      it("Should flag the titlebar if message is unread, but not if message is read", function() {
        message.isRead = true;
        el.flagTitlebar = false;

        el.flagTitlebarForMessage = message;
        expect(el.flagTitlebar).toBe(false);
        el.flagTitlebarForMessage = null;

        message.isRead = false;

        el.flagTitlebarForMessage = message;
        expect(el.flagTitlebar).toBe(true);
      });

      it("Should wire up _handleTitlebarMessageChange for the message if unread", function() {
        spyOn(el, "_handleTitlebarMessageChange");
        message.isRead = true;

        el.flagTitlebarForMessage = message;
        message.trigger("messages:change");
        expect(el._handleTitlebarMessageChange).not.toHaveBeenCalled();
        el.flagTitlebarForMessage = null;

        message.isRead = false;
        el.flagTitlebarForMessage = message;
        message.trigger("messages:change");
        expect(el._handleTitlebarMessageChange).toHaveBeenCalled();
      });

      it("Should unwire up _handleTitlebarMessageChange for prior message", function() {
        spyOn(el, "_handleTitlebarMessageChange");
        message.isRead = false;
        el.flagTitlebarForMessage = message;

        el.flagTitlebarForMessage = conversation.createMessage("hey");

        message.trigger("messages:change");
        expect(el._handleTitlebarMessageChange).not.toHaveBeenCalled();
      });
    });

    describe("The created() method", function() {
      it("Should setup the avatar, title and container", function() {
        expect(el.nodes.avatar.tagName).toEqual('LAYER-AVATAR');
        expect(el.nodes.title.classList.contains('layer-notifier-title')).toBe(true);
        expect(el.nodes.container.classList.contains('layer-message-item-main')).toBe(true);
      });

      it("Should wire up client messages-notify event", function() {
        var restoreFunc = window.layerUI.isInBackground;
        window.layerUI.isInBackground = jasmine.createSpy('spy');
        client.trigger('messages:notify');
        expect(window.layerUI.isInBackground).toHaveBeenCalled();
        window.layerUI.isInBackground = restoreFunc;
      });

      it("Should wire up the click handler to onClickToast", function() {
        spyOn(el, 'onNotificationClick');
        el.properties.toastMessage = message;
        el.click();
        expect(el.onNotificationClick).toHaveBeenCalled();
      });
    });

    describe("The _onPermissionGranted() method", function() {
      it("Should flag desktop notifications are enabled", function() {
        testRoot.innerHTML = '<layer-notifier notify-in-background="false"></layer-notifier>';
        CustomElements.takeRecords();
        el = testRoot.firstChild;
        expect(el.properties.userEnabledDesktopNotifications).toBe(false);
        el._onPermissionGranted();
        expect(el.properties.userEnabledDesktopNotifications).toBe(true);
      });
    });

    describe("Run with permissions granted", function() {
      beforeEach(function() {
        el.properties.userEnabledDesktopNotifications = true;
      });
      describe("The notify() method", function() {

        it("Should set flagTitlebarForMessage if isInBackground and notifyInTitlebar is true", function() {
          el.flagTitlebarForMessage = null;
          message.isRead = false;
          var restoreFunc = window.layerUI.isInBackground;
          spyOn(window.layerUI, 'isInBackground').and.returnValue(true);

          el._notify({message: message});
          expect(el.flagTitlebarForMessage).toBe(message);


          // Run 2: notifyInTitlebar is false
          el.flagTitlebarForMessage = null;
          el.notifyInTitlebar = false;
          el._notify({message: message});
          expect(el.flagTitlebarForMessage).toBe(null);

          // Run 3: isInBackground is false
          el.flagTitlebarForMessage = null;
          el.notifyInTitlebar = true;
          window.layerUI.isInBackground = restoreFunc;
          spyOn(window.layerUI, 'isInBackground').and.returnValue(false);
          el._notify({message: message});
          expect(el.flagTitlebarForMessage).toBe(null);

          // Restore
          window.layerUI.isInBackground = restoreFunc;
        });

        it("Should use background notification setting if isInBackground returns true", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var restoreFunc = window.layerUI.isInBackground;
          spyOn(window.layerUI, 'isInBackground').and.returnValue(true);

          // Part 1
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'toast';
          el._notify({message: message});
          expect(el.desktopNotify).toHaveBeenCalledWith(message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(message);
          el.desktopNotify.calls.reset();

          // Part 2
          el.notifyInBackground = 'toast';
          el.notifyInForeground = 'desktop';
          el._notify({message: message});
          expect(el.desktopNotify).not.toHaveBeenCalledWith(message);
          expect(el.toastNotify).toHaveBeenCalledWith(message);

          // Cleanup
          window.layerUI.isInBackground = restoreFunc;
        });

        it("Should use foreground notification setting if isInBackground returns false", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var restoreFunc = window.layerUI.isInBackground;
          spyOn(window.layerUI, 'isInBackground').and.returnValue(false);

          // Part 1
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'toast';
          el._notify({message: message});
          expect(el.desktopNotify).not.toHaveBeenCalledWith(message);
          expect(el.toastNotify).toHaveBeenCalledWith(message);
          el.toastNotify.calls.reset();

          // Part 2
          el.notifyInBackground = 'toast';
          el.notifyInForeground = 'desktop';
          el._notify({message: message});
          expect(el.desktopNotify).toHaveBeenCalledWith(message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(message);

          // Cleanup
          window.layerUI.isInBackground = restoreFunc;
        });

        it("Should trigger the layer-message-notification event", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          el.notifyInBackground = 'toast';
          var spy = jasmine.createSpy('onNotify');
          document.body.addEventListener('layer-message-notification', spy);
          var restoreFunc = window.layerUI.isInBackground;
          spyOn(window.layerUI, 'isInBackground').and.returnValue(true);

          // Run
          el._notify({message: message});

          // Posttest
          var args = spy.calls.allArgs()[0];
          expect(args.length).toEqual(1);
          expect(args[0].detail).toEqual({
            type: 'toast',
            isBackground: true,
            item: message
          });

          // Cleanup
          window.layerUI.isInBackground = restoreFunc;
        });

        it("Should prevent handling if evt.preventDefault is called", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var restoreFunc = window.layerUI.isInBackground;
          spyOn(window.layerUI, 'isInBackground').and.returnValue(true);
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'desktop';
          document.body.addEventListener('layer-message-notification', function(evt) {
            evt.preventDefault();
          });

          // Run
          el._notify({message: message});

          // Posttest
          expect(el.desktopNotify).not.toHaveBeenCalledWith(message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(message);

          // Cleanup
          window.layerUI.isInBackground = restoreFunc;
        });

        it("Should do nothing if desktop notification is configured and permissions not granted", function() {
          spyOn(el, "desktopNotify");
          spyOn(el, "toastNotify");
          var restoreFunc = window.layerUI.isInBackground;
          spyOn(window.layerUI, 'isInBackground').and.returnValue(true);
          el.notifyInBackground = 'desktop';
          el.notifyInForeground = 'desktop';
          el.properties.userEnabledDesktopNotifications = false;

          // Run
          el._notify({message: message});

          // Posttest
          expect(el.desktopNotify).not.toHaveBeenCalledWith(message);
          expect(el.toastNotify).not.toHaveBeenCalledWith(message);

          // Cleanup
          window.layerUI.isInBackground = restoreFunc;
        });
      });

      describe("The _handleTitlebarMessageChange() method", function() {
        it("Should clear the badge if the message is read", function() {
          message.isRead = false;
          el.flagTitlebarForMessage = message;
          expect(el.flagTitlebar).toBe(true);

          message.__isRead = true;

          el._handleTitlebarMessageChange();
          expect(el.flagTitlebar).toBe(false);
        });

        it("Should clear the event handler if the message is read", function() {
          message.isRead = false;
          el.flagTitlebarForMessage = message;
          expect(el.flagTitlebar).toBe(true);

          message.__isRead = true;

          el._handleTitlebarMessageChange();
          expect(el.flagTitlebar).toBe(false);

          // Run
          spyOn(el, "_handleTitlebarMessageChange");
          message.trigger("messages:change");

          expect(el._handleTitlebarMessageChange).not.toHaveBeenCalled();
        });


        it("Should clear the badge if the message is destroyed", function() {
          spyOn(el, "_handleTitlebarMessageChange").and.callThrough();
          message.isRead = false;
          el.flagTitlebarForMessage = message;
          expect(el.flagTitlebar).toBe(true);

          message.destroy();

          expect(el._handleTitlebarMessageChange).toHaveBeenCalled();
          expect(el.flagTitlebar).toBe(false);
        });
      });

      describe("The desktopNotify() method", function() {
        it("Should calls closeDesktopNotify if needed", function() {
          spyOn(el, "closeDesktopNotify");
          expect(Boolean(el.properties.desktopNotify)).toBe(false);

          // Run 1
          el.desktopNotify(message);
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          expect(Boolean(el.properties.desktopNotify)).toBe(true);

          // Run 2
          el.desktopNotify(message);
          expect(el.closeDesktopNotify).toHaveBeenCalled();
        });

        it("Should set desktopMessage and desktopNotify", function() {
          expect(Boolean(el.properties.desktopNotify)).toBe(false);
          expect(Boolean(el.properties.desktopMessage)).toBe(false);

          // Run
          el.desktopNotify(message);

          // Posttest
          expect(Boolean(el.properties.desktopNotify)).toBe(true);
          expect(el.properties.desktopMessage).toBe(message);
        });

        it("Should listen for the message to be read and call closeDesktopNotify", function() {
          spyOn(el, "closeDesktopNotify");
          message.isRead = false;

          // Run
          el.desktopNotify(message);
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          message.trigger('messages:change', {});
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          message.isRead = true;
          message.trigger('messages:change', {});
          expect(el.closeDesktopNotify).toHaveBeenCalled();
        });

        it("Should listen for the message to be destroyed and call closeDesktopNotify", function() {
          spyOn(el, "closeDesktopNotify");
          message.isRead = false;

          // Run
          el.desktopNotify(message);
          expect(el.closeDesktopNotify).not.toHaveBeenCalled();
          message.trigger('destroy', {});
          expect(el.closeDesktopNotify).toHaveBeenCalled();
        });
      });

      describe("The closeDesktopNotify() method", function() {
        it("Should set desktopMessage and desktopNotify to null", function() {
          el.properties.desktopMessage = message;
          var spy = jasmine.createSpy('close');
          el.properties.desktopNotify = {
            close: spy
          };

          // Run
          el.closeDesktopNotify();

          // Posttest
          expect(el.properties.desktopMessage).toBe(null);
          expect(el.properties.desktopNotify).toBe(null);
          expect(spy).toHaveBeenCalled();
        });
      });

      describe("The toastNotify() method", function() {
        it("Should set the avatar users", function() {
          expect(el.nodes.avatar.users).toEqual([]);
          el.toastNotify(message);
          expect(el.nodes.avatar.users).toEqual([message.sender]);
        });

        it("Should set the title", function() {
          expect(el.nodes.title.innerHTML).toEqual('');
          el.toastNotify(message);
          expect(el.nodes.title.innerHTML.indexOf(message.sender.displayName)).not.toEqual(-1);
        });

        it("Should generate a layer-message-text-plain content", function() {
          expect(el.querySelectorAllArray('layer-message-text-plain').length).toEqual(0);
          el.toastNotify(message);
          expect(el.querySelectorAllArray('layer-message-text-plain').length).toEqual(1);
        });

        it("Should replace the layer-message-text-plain content", function() {
          expect(el.querySelectorAllArray('layer-message-text-plain').length).toEqual(0);
          el.toastNotify(message);
          el.toastNotify(conversation.createMessage("test 2"));
          el.toastNotify(conversation.createMessage("test 3"));
          el.toastNotify(conversation.createMessage("test 4"));
          expect(el.querySelectorAllArray('layer-message-text-plain').length).toEqual(1);

        });

        it("Should listen for the message to be read and call closeToast", function() {
          spyOn(el, "closeToast");
          message.isRead = false;

          // Run
          el.toastNotify(message);
          expect(el.closeToast).not.toHaveBeenCalled();
          message.trigger('messages:change', {});
          expect(el.closeToast).not.toHaveBeenCalled();
          message.isRead = true;
          message.trigger('messages:change', {});
          expect(el.closeToast).toHaveBeenCalled();
        });

        it("Should listen for the message to be destroyed and call closeToast", function() {
          spyOn(el, "closeToast");
          message.isRead = false;

          // Run
          el.toastNotify(message);
          expect(el.closeToast).not.toHaveBeenCalled();
          message.trigger('destroy');
          expect(el.closeToast).toHaveBeenCalled();
        });

        it("Should add the layer-notifier-toast css class", function() {
          expect(el.classList.contains('layer-notifier-toast')).toBe(false);
          el.toastNotify(message);
          expect(el.classList.contains('layer-notifier-toast')).toBe(true);
        });
      });

      describe("The closeToast() method", function() {
        it("Should clear the layer-notifier-toast css class", function() {
          el.classList.add('layer-notifier-toast');
          el.closeToast();
          expect(el.classList.contains('layer-notifier-toast')).toBe(false);
        });

        it("Should no longer listen for the message to be read and call closeToast", function() {
          message.isRead = false;

          // Run
          el.closeToast();

          // Posttest
          spyOn(el, "closeToast");
          el.toastNotify(message);
          expect(el.closeToast).not.toHaveBeenCalled();
          message.trigger('messages:change', {});
          expect(el.closeToast).not.toHaveBeenCalled();
          message.isRead = true;
          message.trigger('messages:change', {});
          expect(el.closeToast).toHaveBeenCalled();
        });

        it("Should clear timeouts", function() {
          el.properties._toastTimeout = 5;
          el.closeToast();
          expect(el.properties._toastTimeout).toEqual(0);
        });
      });

      describe("The onClickToast() method", function() {
        beforeEach(function() {
          el.properties.toastMessage = message;
        });
        it("Should prevent bubbling", function() {
          var preventDefaultSpy = jasmine.createSpy('preventDefault');
          var stopPropagationSpy = jasmine.createSpy('stopPropagation');

          // Run
          el.onClickToast({
            preventDefault: preventDefaultSpy,
            stopPropagation: stopPropagationSpy
          });

          // Posttest
          expect(preventDefaultSpy).toHaveBeenCalled();
          expect(stopPropagationSpy).toHaveBeenCalled();
        });

        it("Should trigger layer-notification-click", function() {
          var spy1 = jasmine.createSpy('spy1');
          document.body.addEventListener('layer-notification-click', spy1);

          // Run
          el.click();

          // Posttest
          var args = spy1.calls.allArgs()[0];
          expect(args.length).toEqual(1);
          expect(args[0].detail).toEqual({
            item: message
          });
        });
      });
    });
  });
}