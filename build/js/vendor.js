/*!
	Modaal - accessible modals - v0.4.4
	by Humaan, for all humans.
	http://humaan.com
 */
/**
 Modaal jQuery Plugin : Accessible Modals

 ==== General Options ===
 type (string) 					: ajax, inline, image, iframe, confirm. Defaults to 'inline'
 content_source (stribg)			: Accepts a string value for your target element, such as '#my-content'. This allows for when trigger element is
 an `<a href="#">` link. Not to be confused with the already existing `source` event.
 animation (string) 				: Fade, expand, down, up. Defaults to 'fade'
 after_callback_delay (integer)	: Specify a delay value for the after open callbacks. This is necessary because with the bundled animations
 have a set duration in the bundled CSS. Specify a delay of the same amount as the animation duration in so
 more accurately fire the after open/close callbacks. Defaults 350, does not apply if animation is 'none',
 after open callbacks are dispatched immediately

 is_locked (boolean)				: Set this to true to disable closing the modal via keypress or clicking the background. Beware that if
 type != 'confirm' there will be no interface to dismiss the modal if is_locked = true, you'd have to
 programmatically arrange to dismiss the modal. Confirm modals are always locked regardless of this option
 Defaults to false

 hide_close (boolean)			: Set this to true to hide the close modal button. Key press and overlay click will still close the modal.
 This method is best used when you want to put a custom close button inside the modal container space.

 background (string)				: Background overlay style. Defaults to '#000'
 overlay_opacity (float) 		: Background overlay transparency. Defaults to 0.8
 overlay_close (boolean)			: Set this to false if you want to disable click to close on overlay background.

 accessible_title (string)		: Accessible title. Default 'Dialog Window'
 start_open (boolean)			: Set this to true to launch the Modaal window immediately on page open
 fullscreen (boolean)			: Set this to true to make the modaal fill the entire screen, false will default to own width/height attributes.
 custom_class (string)			: Fill in this string with a custom class that will be applied to the outer most modal wrapper.

 width (integer)					: Desired width of the modal. Required for iframe type. Defaults to undefined //TODO
 height (integer)				: Desired height of the modal. Required for iframe type. Defaults to undefined //TODO

 background_scroll (boolean)		: Set this to true to enable the page to scroll behind the open modal.

 should_open (boolean|function)  : Boolean or closure that returns a boolean to determine whether to open the modal or not.

 close_text						: String for close button text. Available for localisation and alternative languages to be used.
 close_aria_label				: String for close button aria-label attribute (value that screen readers will read out). Available for localisation and alternative languages to be used.

 === Events ===
 before_open (function) 			: Callback function executed before modal is opened
 after_open (function)			: Callback function executed after modal is opened
 before_close (function)			: Callback function executed before modal is closed
 after_close (function)			: Callback function executed after modal is closed
 source (function(element, src))	: Callback function executed on the default source, it is intended to transform the
 source (href in an AJAX modal or iframe). The function passes in the triggering element
 as well as the default source depending of the modal type. The default output of the
 function is an untransformed default source.


 === Confirm Options & Events ===
 confirm_button_text (string)	: Text on the confirm button. Defaults to 'Confirm'
 confirm_cancel_button_text (string) : Text on the confirm modal cancel button. Defaults to 'Cancel'
 confirm_title (string)			: Title for confirm modal. Default 'Confirm Title'
 confirm_content (string)		: HTML content for confirm message
 confirm_callback (function)		: Callback function for when the confirm button is pressed as opposed to cancel
 confirm_cancel_callback (function) : Callback function for when the cancel button is pressed


 === Gallery Options & Events ===
 gallery_active_class (string)	: Active class applied to the currently active image or image slide in a gallery 'gallery_active_item'
 outer_controls (boolean)		: Set to true to put the next/prev controls outside the Modaal wrapper, at the edges of the browser window.
 before_image_change (function)	: Callback function executed before the image slide changes in a gallery modal. Default function( current_item, incoming_item )
 after_image_change (function)	: Callback function executed after the image slide changes in a gallery modal. Default function ( current_item )


 === AJAX Options & Events ===
 loading_content (string)		: HTML content for loading message. Default 'Loading &hellip;'
 loading_class (string)			: Class name to be applied while content is loaded via AJAX. Default 'is_loading'
 ajax_error_class (string)		: Class name to be applied when content has failed to load. Default is 'modaal-error'
 ajax_success (function)		 	: Callback for when AJAX content is loaded in


 === SOCIAL CONTENT ===
 instagram_id (string)			: Unique photo ID for an Instagram photo.

 */
( function( $ ) {

  var modaal_loading_spinner = '<div class="modaal-loading-spinner"><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div><div><div></div></div></div>'

  var Modaal = {
    init : function(options, elem) {
      var self = this;

      self.dom = $('body');

      self.$elem = $(elem);
      self.options = $.extend({}, $.fn.modaal.options, self.$elem.data(), options);
      self.xhr = null;

      // set up the scope
      self.scope = {
        is_open: false,
        id: 'modaal_' + ( new Date().getTime() ) + ( Math.random().toString(16).substring(2) ),
        source: self.options.content_source ? self.options.content_source : self.$elem.attr('href')
      };

      // add scope attribute to trigger element
      self.$elem.attr('data-modaal-scope', self.scope.id);

      // private options
      self.private_options = {
        active_class: 'is_active'
      };

      self.lastFocus = null;

      // if is_locked
      if ( self.options.is_locked || self.options.type == 'confirm' || self.options.hide_close ) {
        self.scope.close_btn = '';
      } else {
        self.scope.close_btn = '<button type="button" class="modaal-close" id="modaal-close" aria-label="' + self.options.close_aria_label + '"><span>' + self.options.close_text + '</span></button>';
      }

      // reset animation_speed
      if (self.options.animation === 'none' ){
        self.options.animation_speed = 0;
        self.options.after_callback_delay = 0;
      }

      // On click to open modal
      $(elem).on('click.Modaal', function(e) {
        e.preventDefault();
        self.create_modaal(self, e);
      });

      // Define next/prev buttons
      if (self.options.outer_controls === true) {
        var mod_class = 'outer';
      } else {
        var mod_class = 'inner';
      }
      self.scope.prev_btn = '<button type="button" class="modaal-gallery-control modaal-gallery-prev modaal-gallery-prev-' + mod_class + '" id="modaal-gallery-prev" aria-label="Previous image (use left arrow to change)"><span>Previous Image</span></button>';
      self.scope.next_btn = '<button type="button" class="modaal-gallery-control modaal-gallery-next modaal-gallery-next-' + mod_class + '" id="modaal-gallery-next" aria-label="Next image (use right arrow to change)"><span>Next Image</span></button>';

      // Check for start_open
      if (self.options.start_open === true ){
        self.create_modaal( self );
      }
    },

    // Initial create to determine which content type it requires
    // ----------------------------------------------------------------
    create_modaal : function(self, e) {
      var self = this;
      var source;

      // Save last active state before modal
      self.lastFocus = self.$elem;

      if ( self.options.should_open === false || ( typeof self.options.should_open === 'function' && self.options.should_open() === false ) ) {
        return;
      }

      // CB: before_open
      self.options.before_open.call(self, e);

      switch (self.options.type) {
        case 'inline':
          self.create_basic();
          break;

        case 'ajax':
          source = self.options.source( self.$elem, self.scope.source );
          self.fetch_ajax( source );
          break;

        case 'confirm':
          self.options.is_locked = true;
          self.create_confirm();
          break;

        case 'image':
          self.create_image();
          break;

        case 'iframe':
          source = self.options.source( self.$elem, self.scope.source );
          self.create_iframe( source );
          break;

        case 'video':
          self.create_video(self.scope.source);
          break;

        case 'instagram':
          self.create_instagram();
          break;
      }

      // call events to be watched (click, tab, keyup, keydown etc.)
      self.watch_events();
    },

    // Watching Modal
    // ----------------------------------------------------------------
    watch_events : function() {
      var self = this;

      self.dom.off('click.Modaal keyup.Modaal keydown.Modaal');

      // Body keydown
      self.dom.on('keydown.Modaal', function(e) {
        var key = e.keyCode;
        var target = e.target;

        // look for tab change and reset focus to modal window
        // done in keydown so the check fires repeatedly when you hold the tab key down
        if (key == 9 && self.scope.is_open) {
          if (!$.contains(document.getElementById(self.scope.id), target) ) {
            $('#' + self.scope.id).find('*[tabindex="0"]').focus();
          }
        }
      });

      // Body keyup
      self.dom.on('keyup.Modaal', function(e) {
        var key = e.keyCode;
        var target = e.target;

        if ( (e.shiftKey && e.keyCode == 9) && self.scope.is_open) {
          // Watch for shift + tab key press. if open shift focus to close button.
          if (!$.contains(document.getElementById(self.scope.id), target) ) {
            $('#' + self.scope.id).find('.modaal-close').focus();
          }
        }

        if ( !self.options.is_locked ){
          // On escape key press close modal
          if (key == 27 && self.scope.is_open ) {
            if ( $(document.activeElement).is('input:not(:checkbox):not(:radio)') ) {
              return false;
            }

            self.modaal_close();
            return;
          }
        }

        // is gallery open and images length is > 1
        if ( self.options.type == 'image' ) {
          // arrow left for back
          if (key == 37 && self.scope.is_open && (!$('#' + self.scope.id + ' .modaal-gallery-prev').hasClass('is_hidden')) ) {
            self.gallery_update('prev');
          }
          // arrow right for next
          if (key == 39 && self.scope.is_open && (!$('#' + self.scope.id + ' .modaal-gallery-next').hasClass('is_hidden')) ) {
            self.gallery_update('next');
          }
          return;
        }
      });

      // Body click/touch
      self.dom.on('click.Modaal', function(e) {
        var trigger = $(e.target);

        // General Controls: If it's not locked allow greedy close
        if ( !self.options.is_locked ){
          if ( (self.options.overlay_close && trigger.is('.modaal-inner-wrapper')) || trigger.is('.modaal-close') || trigger.closest('.modaal-close').length ) {
            self.modaal_close();
            return;
          }
        }

        //Confirm Controls
        if ( trigger.is('.modaal-confirm-btn' ) ){
          // if 'OK' button is clicked, run confirm_callback()
          if ( trigger.is('.modaal-ok') ) {
            self.options.confirm_callback.call(self, self.lastFocus);
          }

          if ( trigger.is('.modaal-cancel') ) {
            self.options.confirm_cancel_callback.call(self, self.lastFocus);
          }
          self.modaal_close();
          return;
        }

        // Gallery Controls
        if ( trigger.is( '.modaal-gallery-control' ) ){
          // it not active, don't do nuthin!
          if ( trigger.hasClass('is_hidden') ) {
            return;
          }

          // trigger previous
          if ( trigger.is('.modaal-gallery-prev') ) {
            self.gallery_update('prev');
          }
          // trigger next
          if ( trigger.is('.modaal-gallery-next') ) {
            self.gallery_update('next');
          }
          return;
        }
      });
    },

    // Append markup into DOM
    build_modal : function(content) {
      var self = this;

      // if is instagram
      var igClass = '';
      if ( self.options.type == 'instagram' ) {
        igClass = ' modaal-instagram';
      }

      var wrap_class = (self.options.type == 'video') ? 'modaal-video-wrap' : 'modaal-content';

      /*
        modaal-start_none : fully hidden via display:none;
        modaal-start_fade : hidden via opacity:0
        modaal-start_slidedown : ...

      */
      var animation_class;
      switch ( self.options.animation ) {
        case 'fade' :
          animation_class = ' modaal-start_fade';
          break;
        case 'slide-down' :
          animation_class = ' modaal-start_slidedown';
          break;
        default :
          animation_class = ' modaal-start_none'
      }

      // fullscreen check
      var fullscreen_class = '';
      if ( self.options.fullscreen ) {
        fullscreen_class = ' modaal-fullscreen';
      }

      // custom class check
      if ( self.options.custom_class !== '' || typeof(self.options.custom_class) !== 'undefined' ) {
        self.options.custom_class = ' ' + self.options.custom_class;
      }

      // if width and heights exists and is typeof number
      var dimensionsStyle = '';
      if ( self.options.width && self.options.height && typeof self.options.width == 'number' && typeof self.options.height == 'number' ) {
        // if width and height exist, and they are both numbers
        dimensionsStyle = ' style="max-width:' + self.options.width + 'px;height:' + self.options.height + 'px;overflow:auto;"';
      } else if ( self.options.width && typeof self.options.width == 'number' ) {
        // if only width
        dimensionsStyle = ' style="max-width:' + self.options.width + 'px;"';
      } else if ( self.options.height && typeof self.options.height == 'number' ) {
        // if only height
        dimensionsStyle = ' style="height:' + self.options.height + 'px;overflow:auto;"';
      }

      // Reset dimensions style (width and height) for certain types
      if ( self.options.type == 'image' || self.options.type == 'video' || self.options.type == 'instagram' || self.options.fullscreen ) {
        dimensionsStyle = '';
      }

      // if is touch
      // this is a bug fix for iOS to allow regular click events on div elements.
      var touchTrigger = '';
      if ( self.is_touch() ) {
        touchTrigger = ' style="cursor:pointer;"'
      }

      var build_markup = '<div class="modaal-wrapper modaal-' + self.options.type + animation_class + igClass + fullscreen_class + self.options.custom_class + '" id="' + self.scope.id + '"><div class="modaal-outer-wrapper"><div class="modaal-inner-wrapper"' + touchTrigger + '>';

      // hide if video
      if (self.options.type != 'video') {
        build_markup += '<div class="modaal-container"' + dimensionsStyle + '>';
      }

      // add the guts of the content
      build_markup +=	'<div class="' + wrap_class + ' modaal-focus" aria-hidden="false" aria-label="' + self.options.accessible_title + ' - ' + self.options.close_aria_label + '" role="dialog">';

      // If it's inline type, we want to clone content instead of dropping it straight in
      if (self.options.type == 'inline') {
        build_markup += '<div class="modaal-content-container" role="document"></div>';
      } else {
        // Drop in the content if it's not inline
        build_markup +=	content;
      }

      // close wrap_class
      build_markup += '</div>' + self.scope.close_btn;

      // hide if video
      if (self.options.type != 'video') {
        build_markup += '</div>';
      }

      // close off modaal-inner-wrapper
      build_markup +=	'</div>';

      // If type is image AND outer_controls is true: add gallery next and previous controls.
      if (self.options.type == 'image' && self.options.outer_controls === true) {
        build_markup += self.scope.prev_btn + self.scope.next_btn;
      }

      // close off modaal-wrapper
      build_markup +=	'</div></div>';

      // append ajax modal markup to dom
      if ($('#' + self.scope.id + '_overlay').length < 1) {
        self.dom.append(build_markup);
      }

      // if inline, clone content into space
      if (self.options.type == 'inline') {
        content.appendTo('#' + self.scope.id + ' .modaal-content-container');
      }

      // Trigger overlay show (which triggers modal show)
      self.modaal_overlay('show');
    },

    // Create Basic Inline Modal
    // ----------------------------------------------------------------
    create_basic : function() {
      var self = this;
      var target = $(self.scope.source);
      var content = '';

      if (target.length) {
        content = target.contents().detach();
        target.empty();
      } else {
        content = 'Content could not be loaded. Please check the source and try again.';
      }

      // now push content into markup
      self.build_modal(content);
    },

    // Create Instagram Modal
    // ----------------------------------------------------------------
    create_instagram : function() {
      var self = this;
      var id = self.options.instagram_id;
      var content = '';

      var error_msg = 'Instagram photo couldn\'t be loaded, please check the embed code and try again.';

      self.build_modal('<div class="modaal-content-container' + ( self.options.loading_class != '' ? ' ' + self.options.loading_class : '' ) + '">' + self.options.loading_content + '</div>' );

      // ID exists, is not empty null or undefined.
      if ( id != '' && id !== null && id !== undefined ) {
        // set up oembed url
        var ig_url = 'https://api.instagram.com/oembed?url=http://instagr.am/p/' + id + '/';

        $.ajax({
          url: ig_url,
          dataType: "jsonp",
          cache: false,
          success: function (data) {

            // Create temp dom element from which we'll clone into the modaal instance. This is required to bypass the unusual small thumb issue instagram oembed was serving up
            self.dom.append('<div id="temp-ig" style="width:0;height:0;overflow:hidden;">' + data.html + '</div>');

            // Check if it has loaded once before.
            // This is to stop the Embeds.process from throwing and error the first time it's being loaded.
            // private_options are individual to a modaal_scope so will not work across multiple scopes when checking if true, only that one item.
            if ( self.dom.attr('data-igloaded') ) {
              window.instgrm.Embeds.process();
            } else {
              // first time it's loaded, let's set a new private option to use next time it's opened.
              self.dom.attr('data-igloaded', 'true');
            }

            // now set location for new content
            // timeout is required as well to bypass the unusual small thumb issue instagram oembed was serving up
            var target = '#' + self.scope.id + ' .modaal-content-container';
            if ( $(target).length > 0) {
              setTimeout(function() {
                $('#temp-ig').contents().clone().appendTo( target );
                $('#temp-ig').remove();
              }, 1000);
            }

          },
          error: function() {
            content = error_msg;

            // now set location for new content
            var target = $('#' + self.scope.id + ' .modaal-content-container');
            if ( target.length > 0) {
              target.removeClass( self.options.loading_class ).addClass( self.options.ajax_error_class );
              target.html(content);
            }
          }
        });

      } else {
        content = error_msg;
      }

      return false;
    },

    // Fetch Ajax Data
    // ----------------------------------------------------------------
    fetch_ajax : function(url) {
      var self = this;
      var content = '';

      // If no accessible title, set it to 'Dialog Window'
      if ( self.options.accessible_title == null ) {
        self.options.accessible_title = 'Dialog Window'
      }

      if ( self.xhr !== null ){
        self.xhr.abort();
        self.xhr = null;
      }

      self.build_modal('<div class="modaal-content-container' + ( self.options.loading_class != '' ? ' ' + self.options.loading_class : '' ) + '">' + self.options.loading_content + '</div>' );

      self.xhr = $.ajax(url, {
        success: function(data) {
          // content fetch is successful so push it into markup
          var target = $('#' + self.scope.id).find('.modaal-content-container');
          if ( target.length > 0){
            target.removeClass( self.options.loading_class );
            target.html( data );

            self.options.ajax_success.call(self, target);
          }
        },
        error: function( xhr ) {
          // There were some errors so return an error message
          if ( xhr.statusText == 'abort' ){
            return;
          }

          var target = $('#' + self.scope.id + ' .modaal-content-container');
          if ( target.length > 0){
            target.removeClass( self.options.loading_class ).addClass( self.options.ajax_error_class );
            target.html( 'Content could not be loaded. Please check the source and try again.' );
          }
        }
      });
    },

    // Create Confirm Modal
    // ----------------------------------------------------------------
    create_confirm : function() {
      var self = this;
      var content;

      content = '<div class="modaal-content-container">' +
        '<h1 id="modaal-title">' + self.options.confirm_title + '</h1>' +
        '<div class="modaal-confirm-content">' + self.options.confirm_content + '</div>' +
        '<div class="modaal-confirm-wrap">' +
        '<button type="button" class="modaal-confirm-btn modaal-ok" aria-label="Confirm">' + self.options.confirm_button_text + '</button>' +
        '<button type="button" class="modaal-confirm-btn modaal-cancel" aria-label="Cancel">' + self.options.confirm_cancel_button_text + '</button>' +
        '</div>' +
        '</div>' +
        '</div>';

      // now push content into markup
      self.build_modal(content);
    },

    // Create Image/Gallery Modal
    // ----------------------------------------------------------------
    create_image : function() {
      var self = this;
      var content;

      var modaal_image_markup = '';
      var gallery_total;

      // If has group attribute
      if ( self.$elem.is('[data-group]') || self.$elem.is('[rel]') ) {

        // find gallery groups
        var use_group = self.$elem.is('[data-group]');
        var gallery_group = use_group ? self.$elem.attr('data-group') : self.$elem.attr('rel');
        var gallery_group_items = use_group ? $('[data-group="' + gallery_group + '"]') : $('[rel="' + gallery_group + '"]');

        // remove any previous active attribute to any in the group
        gallery_group_items.removeAttr('data-gallery-active', 'is_active');
        // add active attribute to the item clicked
        self.$elem.attr('data-gallery-active', 'is_active');

        // how many in the grouping are there (-1 to connect with each function starting with 0)
        gallery_total = gallery_group_items.length - 1;

        // prepare array for gallery data
        var gallery = [];

        // start preparing markup
        modaal_image_markup = '<div class="modaal-gallery-item-wrap">';

        // loop each grouping item and push it into our gallery array
        gallery_group_items.each(function(i, item) {
          // setup default content
          var img_src = '';
          var img_alt = '';
          var img_description = '';
          var img_active = false;
          var img_src_error = false;

          var data_modaal_desc = item.getAttribute('data-modaal-desc');
          var data_item_active = item.getAttribute('data-gallery-active');

          // if item has inline custom source, use that instead of href. Fall back to href if available.
          if ( $(item).attr('data-modaal-content-source') ) {
            img_src = $(item).attr('data-modaal-content-source');
          } else if ( $(item).attr('href') ) {
            img_src = $(item).attr('href');
          } else if ( $(item).attr('src') ) {
            img_src = $(item).attr('src');
          } else {
            img_src = 'trigger requires href or data-modaal-content-source attribute';
            img_src_error = true;
          }

          // Does it have a modaal description
          if ( data_modaal_desc != '' && data_modaal_desc !== null && data_modaal_desc !== undefined ) {
            img_alt = data_modaal_desc;
            img_description = '<div class="modaal-gallery-label"><span class="modaal-accessible-hide">Image ' + (i+1) + ' - </span>' + data_modaal_desc.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>'
          } else {
            img_description = '<div class="modaal-gallery-label"><span class="modaal-accessible-hide">Image ' + (i+1) + '</span></div>';
          }

          // is it the active item
          if ( data_item_active ) {
            img_active = true
          }

          // set new object for values we want
          var gallery_item = {
            'url': img_src,
            'alt': img_alt,
            'rawdesc': data_modaal_desc,
            'desc': img_description,
            'active': img_active,
            'src_error': img_src_error
          };

          // push object into gallery array
          gallery.push( gallery_item );
        });

        // now loop through all items in the gallery and build up the markup
        for (var i = 0; i < gallery.length; i++) {
          // Set default active class, then check if array item active is true and update string for class
          var is_active = '';
          var aria_label = gallery[i].rawdesc ? 'Image: ' + gallery[i].rawdesc : 'Image ' + i + ' no description';

          if ( gallery[i].active ) {
            is_active = ' ' + self.private_options.active_class;
          }

          // if gallery item has source error, output message rather than undefined image
          var image_output = gallery[i].src_error ? gallery[i].url : '<img src="' + gallery[i].url + '" alt=" " style="width:100%">';

          // for each item build up the markup
          modaal_image_markup += '<div class="modaal-gallery-item gallery-item-' + i + is_active + '" aria-label="' + aria_label + '">' +
            image_output + gallery[i].desc +
            '</div>';
        }

        // Close off the markup for the gallery
        modaal_image_markup += '</div>';

        // Add next and previous buttons if outside
        if (self.options.outer_controls != true) {
          modaal_image_markup += self.scope.prev_btn + self.scope.next_btn;
        }
      } else {
        // This is only a single gallery item so let's grab the necessary values

        // define the source, check if content_source option exists, and use that or fall back to href.
        var this_img_src;
        var img_src_error = false;
        if ( self.$elem.attr('data-modaal-content-source') ) {
          this_img_src = self.$elem.attr('data-modaal-content-source');
        } else if ( self.$elem.attr('href') ) {
          this_img_src = self.$elem.attr('href');
        } else if ( self.$elem.attr('src') ) {
          this_img_src = self.$elem.attr('src');
        } else {
          this_img_src = 'trigger requires href or data-modaal-content-source attribute';
          img_src_error = true;
        }

        var this_img_alt_txt = '';
        var this_img_alt = '';
        var aria_label = '';

        if ( self.$elem.attr('data-modaal-desc') ) {
          aria_label = self.$elem.attr('data-modaal-desc');
          this_img_alt_txt = self.$elem.attr('data-modaal-desc');
          this_img_alt = '<div class="modaal-gallery-label"><span class="modaal-accessible-hide">Image - </span>' + this_img_alt_txt.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</div>';
        } else {
          aria_label = "Image with no description";
        }

        // if image item has source error, output message rather than undefined image
        var image_output = img_src_error ? this_img_src : '<img src="' + this_img_src + '" alt=" " style="width:100%">';

        // build up the html
        modaal_image_markup = '<div class="modaal-gallery-item is_active" aria-label="' + aria_label + '">' +
          image_output + this_img_alt +
          '</div>';
      }

      // Update content variable
      content = modaal_image_markup;

      // now push content into markup
      self.build_modal(content);

      // setup next & prev buttons
      if ( $('.modaal-gallery-item.is_active').is('.gallery-item-0') ) {
        $('.modaal-gallery-prev').hide();
      }
      if ( $('.modaal-gallery-item.is_active').is('.gallery-item-' + gallery_total) ) {
        $('.modaal-gallery-next').hide();
      }
    },

    // Gallery Change Image
    // ----------------------------------------------------------------
    gallery_update : function(direction) {
      var self = this;
      var this_gallery = $('#' + self.scope.id);
      var this_gallery_item = this_gallery.find('.modaal-gallery-item');
      var this_gallery_total = this_gallery_item.length - 1;

      // if single item, don't proceed
      if ( this_gallery_total == 0 ) {
        return false;
      }

      var prev_btn = this_gallery.find('.modaal-gallery-prev'),
        next_btn = this_gallery.find('.modaal-gallery-next');

      var duration = 250;

      var new_img_w = 0,
        new_img_h = 0;

      // CB: Before image change
      var current_item = this_gallery.find( '.modaal-gallery-item.' + self.private_options.active_class ),
        incoming_item = ( direction == 'next' ? current_item.next( '.modaal-gallery-item' ) : current_item.prev( '.modaal-gallery-item' ) );
      self.options.before_image_change.call(self, current_item, incoming_item);

      // stop change if at start of end
      if ( direction == 'prev' && this_gallery.find('.gallery-item-0').hasClass('is_active') ) {
        return false;
      } else if ( direction == 'next' && this_gallery.find('.gallery-item-' + this_gallery_total).hasClass('is_active') ) {
        return false;
      }


      // lock dimensions
      current_item.stop().animate({
        opacity: 0
      }, duration, function(){
        // Move to appropriate image
        incoming_item.addClass('is_next').css({
          'position': 'absolute',
          'display': 'block',
          'opacity': 0
        });

        // Collect doc width
        var doc_width = $(document).width();
        var width_threshold = doc_width > 1140 ? 280 : 50;

        // start toggle to 'is_next'
        new_img_w = this_gallery.find('.modaal-gallery-item.is_next').width();
        new_img_h = this_gallery.find('.modaal-gallery-item.is_next').height();

        var new_natural_w = this_gallery.find('.modaal-gallery-item.is_next img').prop('naturalWidth');
        var new_natural_h = this_gallery.find('.modaal-gallery-item.is_next img').prop('naturalHeight');

        // if new image is wider than doc width
        if ( new_natural_w > (doc_width - width_threshold) ) {
          // set new width just below doc width
          new_img_w = doc_width - width_threshold;

          // Set temp widths so we can calulate the correct height;
          this_gallery.find('.modaal-gallery-item.is_next').css({ 'width': new_img_w });
          this_gallery.find('.modaal-gallery-item.is_next img').css({ 'width': new_img_w });

          // Set new height variable
          new_img_h = this_gallery.find('.modaal-gallery-item.is_next').find('img').height();
        } else {
          // new img is not wider than screen, so let's set the new dimensions
          new_img_w = new_natural_w;
          new_img_h = new_natural_h;
        }

        // resize gallery region
        this_gallery.find('.modaal-gallery-item-wrap').stop().animate({
          'width': new_img_w,
          'height': new_img_h
        }, duration, function() {
          // hide old active image
          current_item.removeClass(self.private_options.active_class + ' ' + self.options.gallery_active_class).removeAttr('style');
          current_item.find('img').removeAttr('style');

          // show new image
          incoming_item.addClass(self.private_options.active_class + ' ' + self.options.gallery_active_class).removeClass('is_next').css('position','');

          // animate in new image (now has the normal is_active class
          incoming_item.stop().animate({
            opacity: 1
          }, duration, function(){
            $(this).removeAttr('style').css({
              'width': '100%'
            });
            $(this).find('img').css('width', '100%');

            // remove dimension lock
            this_gallery.find('.modaal-gallery-item-wrap').removeAttr('style');

            // CB: After image change
            self.options.after_image_change.call( self, incoming_item );
          });

          // Focus on the new gallery item
          this_gallery.find('.modaal-gallery-item').removeAttr('tabindex');
          this_gallery.find('.modaal-gallery-item.' + self.private_options.active_class + '').attr('tabindex', '0').focus();

          // hide/show next/prev
          if ( this_gallery.find('.modaal-gallery-item.' + self.private_options.active_class).is('.gallery-item-0') ) {
            prev_btn.stop().animate({
              opacity: 0
            }, 150, function(){
              $(this).hide();
            });
          } else {
            prev_btn.stop().css({
              'display': 'block',
              'opacity': prev_btn.css('opacity')
            }).animate({
              opacity: 1
            }, 150);
          }
          if ( this_gallery.find('.modaal-gallery-item.' + self.private_options.active_class).is('.gallery-item-' + this_gallery_total) ) {
            next_btn.stop().animate({
              opacity: 0
            }, 150, function(){
              $(this).hide();
            });
          } else {
            next_btn.stop().css({
              'display': 'block',
              'opacity': prev_btn.css('opacity')
            }).animate({
              opacity: 1
            }, 150);
          }
        });
      });
    },

    // Create Video Modal
    // ----------------------------------------------------------------
    create_video : function(url) {
      var self = this;
      var content;

      // video markup
      content = '<iframe src="' + url + '" class="modaal-video-frame" frameborder="0" allowfullscreen></iframe>';

      // now push content into markup
      self.build_modal('<div class="modaal-video-container">' + content + '</div>');
    },

    // Create iFrame Modal
    // ----------------------------------------------------------------
    create_iframe : function(url) {
      var self = this;
      var content;

      if ( self.options.width !== null || self.options.width !== undefined || self.options.height !== null || self.options.height !== undefined ) {
        // video markup
        content = '<iframe src="' + url + '" class="modaal-iframe-elem" frameborder="0" allowfullscreen></iframe>';
      } else {
        content = '<div class="modaal-content-container">Please specify a width and height for your iframe</div>';
      }

      // now push content into markup
      self.build_modal(content);
    },

    // Open Modaal
    // ----------------------------------------------------------------
    modaal_open : function() {
      var self = this;
      var modal_wrapper = $( '#' + self.scope.id );
      var animation_type = self.options.animation;

      if (animation_type === 'none' ){
        modal_wrapper.removeClass('modaal-start_none');
        self.options.after_open.call(self, modal_wrapper);
      }

      // Open with fade
      if (animation_type === 'fade') {
        modal_wrapper.removeClass('modaal-start_fade');
      }

      // Open with slide down
      if (animation_type === 'slide-down') {
        modal_wrapper.removeClass('modaal-start_slide_down');
      }

      var focusTarget = modal_wrapper;

      // Switch focusTarget tabindex (switch from other modal if exists)
      $('.modaal-wrapper *[tabindex=0]').removeAttr('tabindex');

      if ( self.options.type == 'image' ) {
        focusTarget = $('#' + self.scope.id).find('.modaal-gallery-item.' + self.private_options.active_class);

      } else if ( modal_wrapper.find('.modaal-iframe-elem').length ) {
        focusTarget = modal_wrapper.find('.modaal-iframe-elem');

      } else if ( modal_wrapper.find('.modaal-video-wrap').length ) {
        focusTarget = modal_wrapper.find('.modaal-video-wrap');

      } else {
        focusTarget = modal_wrapper.find('.modaal-focus');

      }

      // now set the focus
      focusTarget.attr('tabindex', '0').focus();

      // Run after_open
      if (animation_type !== 'none') {
        // CB: after_open
        setTimeout(function() {
          self.options.after_open.call(self, modal_wrapper)
        }, self.options.after_callback_delay);
      }
    },

    // Close Modal
    // ----------------------------------------------------------------
    modaal_close : function() {
      var self = this;
      var modal_wrapper = $( '#' + self.scope.id );

      // CB: before_close
      self.options.before_close.call(self, modal_wrapper);

      if (self.xhr !== null){
        self.xhr.abort();
        self.xhr = null;
      }

      // Now we close the modal
      if (self.options.animation === 'none' ){
        modal_wrapper.addClass('modaal-start_none');
      }

      // Close with fade
      if (self.options.animation === 'fade') {
        modal_wrapper.addClass('modaal-start_fade');
      }

      // Close with slide up (using initial slide down)
      if (self.options.animation === 'slide-down') {
        modal_wrapper.addClass('modaal-start_slide_down');
      }

      // CB: after_close and remove
      setTimeout(function() {
        // clone inline content back to origin place
        if (self.options.type == 'inline') {
          $('#' + self.scope.id + ' .modaal-content-container').contents().detach().appendTo( self.scope.source )
        }
        // remove markup from dom
        modal_wrapper.remove();
        // CB: after_close
        self.options.after_close.call(self);
        // scope is now closed
        self.scope.is_open = false;

      }, self.options.after_callback_delay);

      // Call overlay hide
      self.modaal_overlay('hide');

      // Roll back to last focus state before modal open. If was closed programmatically, this might not be set
      if (self.lastFocus != null) {
        self.lastFocus.focus();
      }
    },

    // Overlay control (accepts action for show or hide)
    // ----------------------------------------------------------------
    modaal_overlay : function(action) {
      var self = this;

      if (action == 'show') {
        // Modal is open so update scope
        self.scope.is_open = true;

        // set body to overflow hidden if background_scroll is false
        if (! self.options.background_scroll) {
          self.dom.addClass('modaal-noscroll');
        }

        // append modaal overlay
        if ($('#' + self.scope.id + '_overlay').length < 1) {
          self.dom.append('<div class="modaal-overlay" id="' + self.scope.id + '_overlay"></div>');
        }

        // now show
        $('#' + self.scope.id + '_overlay').css('background', self.options.background).stop().animate({
          opacity: self.options.overlay_opacity
        }, self.options.animation_speed, function(){
          // now open the modal
          self.modaal_open();
        });

      } else if (action == 'hide') {

        // now hide the overlay
        $('#' + self.scope.id + '_overlay').stop().animate({
          opacity: 0
        }, self.options.animation_speed, function(){
          // remove overlay from dom
          $(this).remove();

          // remove body overflow lock
          self.dom.removeClass('modaal-noscroll');
        });
      }
    },

    // Check if is touch
    // ----------------------------------------------------------------
    is_touch : function() {
      return 'ontouchstart' in window || navigator.maxTouchPoints;
    }
  };

  // Define default object to store
  var modaal_existing_selectors = [];

  // Declare the modaal jQuery method
  // ------------------------------------------------------------
  $.fn.modaal = function(options) {
    return this.each(function (i) {
      var existing_modaal = $(this).data('modaal');

      if ( existing_modaal ){
        // Checking for string value, used for methods
        if (typeof(options) == 'string'){
          switch (options) {
            case 'open':
              // create the modal
              existing_modaal.create_modaal(existing_modaal);
              break;
            case 'close':
              existing_modaal.modaal_close();
              break;
          }
        }
      } else {
        // Not a string, so let's setup the modal ready to use
        var modaal = Object.create(Modaal);
        modaal.init(options, this);
        $.data(this, "modaal", modaal);

        // push this select into existing selectors array which is referenced during modaal_dom_observer
        modaal_existing_selectors.push({
          'element': $(this).attr('class'),
          'options': options
        });
      }
    });
  };

  // Default options
  // ------------------------------------------------------------
  $.fn.modaal.options = {

    //General
    type: 'inline',
    content_source: null,
    animation: 'fade',
    animation_speed: 300,
    after_callback_delay: 350,
    is_locked: false,
    hide_close: false,
    background: '#000',
    overlay_opacity: '0.8',
    overlay_close: true,
    accessible_title: 'Dialog Window',
    start_open: false,
    fullscreen: false,
    custom_class: '',
    background_scroll: false,
    should_open: true,
    close_text: 'Close',
    close_aria_label: 'Close (Press escape to close)',
    width: null,
    height: null,

    //Events
    before_open: function(){},
    after_open: function(){},
    before_close: function(){},
    after_close: function(){},
    source: function( element, src ){
      return src;
    },

    //Confirm Modal
    confirm_button_text: 'Confirm', // text on confirm button
    confirm_cancel_button_text: 'Cancel',
    confirm_title: 'Confirm Title', // title for confirm modal
    confirm_content: '<p>This is the default confirm dialog content. Replace me through the options</p>', // html for confirm message
    confirm_callback: function() {},
    confirm_cancel_callback: function() {},


    //Gallery Modal
    gallery_active_class: 'gallery_active_item',
    outer_controls:	false,
    before_image_change: function( current_item, incoming_item ) {},
    after_image_change: function( current_item ) {},

    //Ajax Modal
    loading_content: modaal_loading_spinner,
    loading_class: 'is_loading',
    ajax_error_class: 'modaal-error',
    ajax_success: function(){},

    //Instagram
    instagram_id: null
  };

  // Check and Set Inline Options
  // ------------------------------------------------------------
  function modaal_inline_options(self) {

    // new empty options
    var options = {};
    var inline_options = false;

    // option: type
    if ( self.attr('data-modaal-type') ) {
      inline_options = true;
      options.type = self.attr('data-modaal-type');
    }

    // option: type
    if ( self.attr('data-modaal-content-source') ) {
      inline_options = true;
      options.content_source = self.attr('data-modaal-content-source');
    }

    // option: animation
    if ( self.attr('data-modaal-animation') ) {
      inline_options = true;
      options.animation = self.attr('data-modaal-animation');
    }

    // option: animation_speed
    if ( self.attr('data-modaal-animation-speed') ) {
      inline_options = true;
      options.animation_speed = self.attr('data-modaal-animation-speed');
    }

    // option: after_callback_delay
    if ( self.attr('data-modaal-after-callback-delay') ) {
      inline_options = true;
      options.after_callback_delay = self.attr('data-modaal-after-callback-delay');
    }

    // option: is_locked
    if ( self.attr('data-modaal-is-locked') ) {
      inline_options = true;
      options.is_locked = (self.attr('data-modaal-is-locked') === 'true' ? true : false);
    }

    // option: hide_close
    if ( self.attr('data-modaal-hide-close') ) {
      inline_options = true;
      options.hide_close = (self.attr('data-modaal-hide-close') === 'true' ? true : false);
    }

    // option: background
    if ( self.attr('data-modaal-background') ) {
      inline_options = true;
      options.background = self.attr('data-modaal-background');
    }

    // option: overlay_opacity
    if ( self.attr('data-modaal-overlay-opacity') ) {
      inline_options = true;
      options.overlay_opacity = self.attr('data-modaal-overlay-opacity');
    }

    // option: overlay_close
    if ( self.attr('data-modaal-overlay-close') ) {
      inline_options = true;
      options.overlay_close = (self.attr('data-modaal-overlay-close') === 'false' ? false : true);
    }

    // option: accessible_title
    if ( self.attr('data-modaal-accessible-title') ) {
      inline_options = true;
      options.accessible_title = self.attr('data-modaal-accessible-title');
    }

    // option: start_open
    if ( self.attr('data-modaal-start-open') ) {
      inline_options = true;
      options.start_open = (self.attr('data-modaal-start-open') === 'true' ? true : false);
    }

    // option: fullscreen
    if ( self.attr('data-modaal-fullscreen') ) {
      inline_options = true;
      options.fullscreen = (self.attr('data-modaal-fullscreen') === 'true' ? true : false);
    }

    // option: custom_class
    if ( self.attr('data-modaal-custom-class') ) {
      inline_options = true;
      options.custom_class = self.attr('data-modaal-custom-class');
    }

    // option: close_text
    if ( self.attr('data-modaal-close-text') ) {
      inline_options = true;
      options.close_text = self.attr('data-modaal-close-text');
    }

    // option: close_aria_label
    if ( self.attr('data-modaal-close-aria-label') ) {
      inline_options = true;
      options.close_aria_label = self.attr('data-modaal-close-aria-label');
    }

    // option: background_scroll
    if ( self.attr('data-modaal-background-scroll') ) {
      inline_options = true;
      options.background_scroll = (self.attr('data-modaal-background-scroll') === 'true' ? true : false);
    }

    // option: width
    if ( self.attr('data-modaal-width') ) {
      inline_options = true;
      options.width = parseInt( self.attr('data-modaal-width') );
    }

    // option: height
    if ( self.attr('data-modaal-height') ) {
      inline_options = true;
      options.height = parseInt( self.attr('data-modaal-height') );
    }

    // option: confirm_button_text
    if ( self.attr('data-modaal-confirm-button-text') ) {
      inline_options = true;
      options.confirm_button_text = self.attr('data-modaal-confirm-button-text');
    }

    // option: confirm_cancel_button_text
    if ( self.attr('data-modaal-confirm-cancel-button-text') ) {
      inline_options = true;
      options.confirm_cancel_button_text = self.attr('data-modaal-confirm-cancel-button-text');
    }

    // option: confirm_title
    if ( self.attr('data-modaal-confirm-title') ) {
      inline_options = true;
      options.confirm_title = self.attr('data-modaal-confirm-title');
    }

    // option: confirm_content
    if ( self.attr('data-modaal-confirm-content') ) {
      inline_options = true;
      options.confirm_content = self.attr('data-modaal-confirm-content');
    }

    // option: gallery_active_class
    if ( self.attr('data-modaal-gallery-active-class') ) {
      inline_options = true;
      options.gallery_active_class = self.attr('data-modaal-gallery-active-class');
    }

    // option: loading_content
    if ( self.attr('data-modaal-loading-content') ) {
      inline_options = true;
      options.loading_content = self.attr('data-modaal-loading-content');
    }

    // option: loading_class
    if ( self.attr('data-modaal-loading-class') ) {
      inline_options = true;
      options.loading_class = self.attr('data-modaal-loading-class');
    }

    // option: ajax_error_class
    if ( self.attr('data-modaal-ajax-error-class') ) {
      inline_options = true;
      options.ajax_error_class = self.attr('data-modaal-ajax-error-class');
    }

    // option: start_open
    if ( self.attr('data-modaal-instagram-id') ) {
      inline_options = true;
      options.instagram_id = self.attr('data-modaal-instagram-id');
    }

    // now set it up for the trigger, but only if inline_options is true
    if ( inline_options ) {
      self.modaal(options);
    }
  };

  // On body load (or now, if already loaded), init any modaals defined inline
  // Ensure this is done after $.fn.modaal and default options are declared
  // ----------------------------------------------------------------
  $(function(){

    var single_modaal = $('.modaal');

    // Check for existing modaal elements
    if ( single_modaal.length ) {
      single_modaal.each(function() {
        var self = $(this);
        modaal_inline_options(self);
      });
    }

    // Obvserve DOM mutations for newly added triggers
    var modaal_dom_observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          // element added to DOM
          var findElement = [].some.call(mutation.addedNodes, function(el) {
            var elm = $(el);
            if ( elm.is('a') || elm.is('button') ) {

              if ( elm.hasClass('modaal') ) {
                // is inline Modaal, initialise options
                modaal_inline_options(elm);
              } else {
                // is not inline modaal. Check for existing selector
                modaal_existing_selectors.forEach(function(modaalSelector) {
                  if ( modaalSelector.element == elm.attr('class') ) {
                    $(elm).modaal( modaalSelector.options );
                    return false;
                  }
                });
              }

            }
          });
        }
      });
    });
    var observer_config = {
      subtree: true,
      attributes: true,
      childList: true,
      characterData: true
    };

    // pass in the target node, as well as the observer options
    setTimeout(function() {
      modaal_dom_observer.observe(document.body, observer_config);
    }, 500);

  });

} ( jQuery, window, document ) );

// SLICK
/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.8.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues
*/
/* global window, document, define, jQuery, setInterval, clearInterval */
;(function(factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports !== 'undefined') {
    module.exports = factory(require('jquery'));
  } else {
    factory(jQuery);
  }

}(function($) {
  'use strict';
  var Slick = window.Slick || {};

  Slick = (function() {

    var instanceUid = 0;

    function Slick(element, settings) {

      var _ = this, dataSettings;

      _.defaults = {
        accessibility: true,
        adaptiveHeight: false,
        appendArrows: $(element),
        appendDots: $(element),
        arrows: true,
        asNavFor: null,
        prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
        nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
        autoplay: false,
        autoplaySpeed: 3000,
        centerMode: false,
        centerPadding: '50px',
        cssEase: 'ease',
        customPaging: function(slider, i) {
          return $('<button type="button" />').text(i + 1);
        },
        dots: false,
        dotsClass: 'slick-dots',
        draggable: true,
        easing: 'linear',
        edgeFriction: 0.35,
        fade: false,
        focusOnSelect: false,
        focusOnChange: false,
        infinite: true,
        initialSlide: 0,
        lazyLoad: 'ondemand',
        mobileFirst: false,
        pauseOnHover: true,
        pauseOnFocus: true,
        pauseOnDotsHover: false,
        respondTo: 'window',
        responsive: null,
        rows: 1,
        rtl: false,
        slide: '',
        slidesPerRow: 1,
        slidesToShow: 1,
        slidesToScroll: 1,
        speed: 500,
        swipe: true,
        swipeToSlide: false,
        touchMove: true,
        touchThreshold: 5,
        useCSS: true,
        useTransform: true,
        variableWidth: false,
        vertical: false,
        verticalSwiping: false,
        waitForAnimate: true,
        zIndex: 1000
      };

      _.initials = {
        animating: false,
        dragging: false,
        autoPlayTimer: null,
        currentDirection: 0,
        currentLeft: null,
        currentSlide: 0,
        direction: 1,
        $dots: null,
        listWidth: null,
        listHeight: null,
        loadIndex: 0,
        $nextArrow: null,
        $prevArrow: null,
        scrolling: false,
        slideCount: null,
        slideWidth: null,
        $slideTrack: null,
        $slides: null,
        sliding: false,
        slideOffset: 0,
        swipeLeft: null,
        swiping: false,
        $list: null,
        touchObject: {},
        transformsEnabled: false,
        unslicked: false
      };

      $.extend(_, _.initials);

      _.activeBreakpoint = null;
      _.animType = null;
      _.animProp = null;
      _.breakpoints = [];
      _.breakpointSettings = [];
      _.cssTransitions = false;
      _.focussed = false;
      _.interrupted = false;
      _.hidden = 'hidden';
      _.paused = true;
      _.positionProp = null;
      _.respondTo = null;
      _.rowCount = 1;
      _.shouldClick = true;
      _.$slider = $(element);
      _.$slidesCache = null;
      _.transformType = null;
      _.transitionType = null;
      _.visibilityChange = 'visibilitychange';
      _.windowWidth = 0;
      _.windowTimer = null;

      dataSettings = $(element).data('slick') || {};

      _.options = $.extend({}, _.defaults, settings, dataSettings);

      _.currentSlide = _.options.initialSlide;

      _.originalSettings = _.options;

      if (typeof document.mozHidden !== 'undefined') {
        _.hidden = 'mozHidden';
        _.visibilityChange = 'mozvisibilitychange';
      } else if (typeof document.webkitHidden !== 'undefined') {
        _.hidden = 'webkitHidden';
        _.visibilityChange = 'webkitvisibilitychange';
      }

      _.autoPlay = $.proxy(_.autoPlay, _);
      _.autoPlayClear = $.proxy(_.autoPlayClear, _);
      _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);
      _.changeSlide = $.proxy(_.changeSlide, _);
      _.clickHandler = $.proxy(_.clickHandler, _);
      _.selectHandler = $.proxy(_.selectHandler, _);
      _.setPosition = $.proxy(_.setPosition, _);
      _.swipeHandler = $.proxy(_.swipeHandler, _);
      _.dragHandler = $.proxy(_.dragHandler, _);
      _.keyHandler = $.proxy(_.keyHandler, _);

      _.instanceUid = instanceUid++;

      // A simple way to check for HTML strings
      // Strict HTML recognition (must start with <)
      // Extracted from jQuery v1.11 source
      _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;


      _.registerBreakpoints();
      _.init(true);

    }

    return Slick;

  }());

  Slick.prototype.activateADA = function() {
    var _ = this;

    _.$slideTrack.find('.slick-active').attr({
      'aria-hidden': 'false'
    }).find('a, input, button, select').attr({
      'tabindex': '0'
    });

  };

  Slick.prototype.addSlide = Slick.prototype.slickAdd = function(markup, index, addBefore) {

    var _ = this;

    if (typeof(index) === 'boolean') {
      addBefore = index;
      index = null;
    } else if (index < 0 || (index >= _.slideCount)) {
      return false;
    }

    _.unload();

    if (typeof(index) === 'number') {
      if (index === 0 && _.$slides.length === 0) {
        $(markup).appendTo(_.$slideTrack);
      } else if (addBefore) {
        $(markup).insertBefore(_.$slides.eq(index));
      } else {
        $(markup).insertAfter(_.$slides.eq(index));
      }
    } else {
      if (addBefore === true) {
        $(markup).prependTo(_.$slideTrack);
      } else {
        $(markup).appendTo(_.$slideTrack);
      }
    }

    _.$slides = _.$slideTrack.children(this.options.slide);

    _.$slideTrack.children(this.options.slide).detach();

    _.$slideTrack.append(_.$slides);

    _.$slides.each(function(index, element) {
      $(element).attr('data-slick-index', index);
    });

    _.$slidesCache = _.$slides;

    _.reinit();

  };

  Slick.prototype.animateHeight = function() {
    var _ = this;
    if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
      var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
      _.$list.animate({
        height: targetHeight
      }, _.options.speed);
    }
  };

  Slick.prototype.animateSlide = function(targetLeft, callback) {

    var animProps = {},
      _ = this;

    _.animateHeight();

    if (_.options.rtl === true && _.options.vertical === false) {
      targetLeft = -targetLeft;
    }
    if (_.transformsEnabled === false) {
      if (_.options.vertical === false) {
        _.$slideTrack.animate({
          left: targetLeft
        }, _.options.speed, _.options.easing, callback);
      } else {
        _.$slideTrack.animate({
          top: targetLeft
        }, _.options.speed, _.options.easing, callback);
      }

    } else {

      if (_.cssTransitions === false) {
        if (_.options.rtl === true) {
          _.currentLeft = -(_.currentLeft);
        }
        $({
          animStart: _.currentLeft
        }).animate({
          animStart: targetLeft
        }, {
          duration: _.options.speed,
          easing: _.options.easing,
          step: function(now) {
            now = Math.ceil(now);
            if (_.options.vertical === false) {
              animProps[_.animType] = 'translate(' +
                now + 'px, 0px)';
              _.$slideTrack.css(animProps);
            } else {
              animProps[_.animType] = 'translate(0px,' +
                now + 'px)';
              _.$slideTrack.css(animProps);
            }
          },
          complete: function() {
            if (callback) {
              callback.call();
            }
          }
        });

      } else {

        _.applyTransition();
        targetLeft = Math.ceil(targetLeft);

        if (_.options.vertical === false) {
          animProps[_.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
        } else {
          animProps[_.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
        }
        _.$slideTrack.css(animProps);

        if (callback) {
          setTimeout(function() {

            _.disableTransition();

            callback.call();
          }, _.options.speed);
        }

      }

    }

  };

  Slick.prototype.getNavTarget = function() {

    var _ = this,
      asNavFor = _.options.asNavFor;

    if ( asNavFor && asNavFor !== null ) {
      asNavFor = $(asNavFor).not(_.$slider);
    }

    return asNavFor;

  };

  Slick.prototype.asNavFor = function(index) {

    var _ = this,
      asNavFor = _.getNavTarget();

    if ( asNavFor !== null && typeof asNavFor === 'object' ) {
      asNavFor.each(function() {
        var target = $(this).slick('getSlick');
        if(!target.unslicked) {
          target.slideHandler(index, true);
        }
      });
    }

  };

  Slick.prototype.applyTransition = function(slide) {

    var _ = this,
      transition = {};

    if (_.options.fade === false) {
      transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
    } else {
      transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;
    }

    if (_.options.fade === false) {
      _.$slideTrack.css(transition);
    } else {
      _.$slides.eq(slide).css(transition);
    }

  };

  Slick.prototype.autoPlay = function() {

    var _ = this;

    _.autoPlayClear();

    if ( _.slideCount > _.options.slidesToShow ) {
      _.autoPlayTimer = setInterval( _.autoPlayIterator, _.options.autoplaySpeed );
    }

  };

  Slick.prototype.autoPlayClear = function() {

    var _ = this;

    if (_.autoPlayTimer) {
      clearInterval(_.autoPlayTimer);
    }

  };

  Slick.prototype.autoPlayIterator = function() {

    var _ = this,
      slideTo = _.currentSlide + _.options.slidesToScroll;

    if ( !_.paused && !_.interrupted && !_.focussed ) {

      if ( _.options.infinite === false ) {

        if ( _.direction === 1 && ( _.currentSlide + 1 ) === ( _.slideCount - 1 )) {
          _.direction = 0;
        }

        else if ( _.direction === 0 ) {

          slideTo = _.currentSlide - _.options.slidesToScroll;

          if ( _.currentSlide - 1 === 0 ) {
            _.direction = 1;
          }

        }

      }

      _.slideHandler( slideTo );

    }

  };

  Slick.prototype.buildArrows = function() {

    var _ = this;

    if (_.options.arrows === true ) {

      _.$prevArrow = $(_.options.prevArrow).addClass('slick-arrow');
      _.$nextArrow = $(_.options.nextArrow).addClass('slick-arrow');

      if( _.slideCount > _.options.slidesToShow ) {

        _.$prevArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');
        _.$nextArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');

        if (_.htmlExpr.test(_.options.prevArrow)) {
          _.$prevArrow.prependTo(_.options.appendArrows);
        }

        if (_.htmlExpr.test(_.options.nextArrow)) {
          _.$nextArrow.appendTo(_.options.appendArrows);
        }

        if (_.options.infinite !== true) {
          _.$prevArrow
            .addClass('slick-disabled')
            .attr('aria-disabled', 'true');
        }

      } else {

        _.$prevArrow.add( _.$nextArrow )

          .addClass('slick-hidden')
          .attr({
            'aria-disabled': 'true',
            'tabindex': '-1'
          });

      }

    }

  };

  Slick.prototype.buildDots = function() {

    var _ = this,
      i, dot;

    if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

      _.$slider.addClass('slick-dotted');

      dot = $('<ul />').addClass(_.options.dotsClass);

      for (i = 0; i <= _.getDotCount(); i += 1) {
        dot.append($('<li />').append(_.options.customPaging.call(this, _, i)));
      }

      _.$dots = dot.appendTo(_.options.appendDots);

      _.$dots.find('li').first().addClass('slick-active');

    }

  };

  Slick.prototype.buildOut = function() {

    var _ = this;

    _.$slides =
      _.$slider
        .children( _.options.slide + ':not(.slick-cloned)')
        .addClass('slick-slide');

    _.slideCount = _.$slides.length;

    _.$slides.each(function(index, element) {
      $(element)
        .attr('data-slick-index', index)
        .data('originalStyling', $(element).attr('style') || '');
    });

    _.$slider.addClass('slick-slider');

    _.$slideTrack = (_.slideCount === 0) ?
      $('<div class="slick-track"/>').appendTo(_.$slider) :
      _.$slides.wrapAll('<div class="slick-track"/>').parent();

    _.$list = _.$slideTrack.wrap(
      '<div class="slick-list"/>').parent();
    _.$slideTrack.css('opacity', 0);

    if (_.options.centerMode === true || _.options.swipeToSlide === true) {
      _.options.slidesToScroll = 1;
    }

    $('img[data-lazy]', _.$slider).not('[src]').addClass('slick-loading');

    _.setupInfinite();

    _.buildArrows();

    _.buildDots();

    _.updateDots();


    _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

    if (_.options.draggable === true) {
      _.$list.addClass('draggable');
    }

  };

  Slick.prototype.buildRows = function() {

    var _ = this, a, b, c, newSlides, numOfSlides, originalSlides,slidesPerSection;

    newSlides = document.createDocumentFragment();
    originalSlides = _.$slider.children();

    if(_.options.rows > 0) {

      slidesPerSection = _.options.slidesPerRow * _.options.rows;
      numOfSlides = Math.ceil(
        originalSlides.length / slidesPerSection
      );

      for(a = 0; a < numOfSlides; a++){
        var slide = document.createElement('div');
        for(b = 0; b < _.options.rows; b++) {
          var row = document.createElement('div');
          for(c = 0; c < _.options.slidesPerRow; c++) {
            var target = (a * slidesPerSection + ((b * _.options.slidesPerRow) + c));
            if (originalSlides.get(target)) {
              row.appendChild(originalSlides.get(target));
            }
          }
          slide.appendChild(row);
        }
        newSlides.appendChild(slide);
      }

      _.$slider.empty().append(newSlides);
      _.$slider.children().children().children()
        .css({
          'width':(100 / _.options.slidesPerRow) + '%',
          'display': 'inline-block'
        });

    }

  };

  Slick.prototype.checkResponsive = function(initial, forceUpdate) {

    var _ = this,
      breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
    var sliderWidth = _.$slider.width();
    var windowWidth = window.innerWidth || $(window).width();

    if (_.respondTo === 'window') {
      respondToWidth = windowWidth;
    } else if (_.respondTo === 'slider') {
      respondToWidth = sliderWidth;
    } else if (_.respondTo === 'min') {
      respondToWidth = Math.min(windowWidth, sliderWidth);
    }

    if ( _.options.responsive &&
      _.options.responsive.length &&
      _.options.responsive !== null) {

      targetBreakpoint = null;

      for (breakpoint in _.breakpoints) {
        if (_.breakpoints.hasOwnProperty(breakpoint)) {
          if (_.originalSettings.mobileFirst === false) {
            if (respondToWidth < _.breakpoints[breakpoint]) {
              targetBreakpoint = _.breakpoints[breakpoint];
            }
          } else {
            if (respondToWidth > _.breakpoints[breakpoint]) {
              targetBreakpoint = _.breakpoints[breakpoint];
            }
          }
        }
      }

      if (targetBreakpoint !== null) {
        if (_.activeBreakpoint !== null) {
          if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
            _.activeBreakpoint =
              targetBreakpoint;
            if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
              _.unslick(targetBreakpoint);
            } else {
              _.options = $.extend({}, _.originalSettings,
                _.breakpointSettings[
                  targetBreakpoint]);
              if (initial === true) {
                _.currentSlide = _.options.initialSlide;
              }
              _.refresh(initial);
            }
            triggerBreakpoint = targetBreakpoint;
          }
        } else {
          _.activeBreakpoint = targetBreakpoint;
          if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
            _.unslick(targetBreakpoint);
          } else {
            _.options = $.extend({}, _.originalSettings,
              _.breakpointSettings[
                targetBreakpoint]);
            if (initial === true) {
              _.currentSlide = _.options.initialSlide;
            }
            _.refresh(initial);
          }
          triggerBreakpoint = targetBreakpoint;
        }
      } else {
        if (_.activeBreakpoint !== null) {
          _.activeBreakpoint = null;
          _.options = _.originalSettings;
          if (initial === true) {
            _.currentSlide = _.options.initialSlide;
          }
          _.refresh(initial);
          triggerBreakpoint = targetBreakpoint;
        }
      }

      // only trigger breakpoints during an actual break. not on initialize.
      if( !initial && triggerBreakpoint !== false ) {
        _.$slider.trigger('breakpoint', [_, triggerBreakpoint]);
      }
    }

  };

  Slick.prototype.changeSlide = function(event, dontAnimate) {

    var _ = this,
      $target = $(event.currentTarget),
      indexOffset, slideOffset, unevenOffset;

    // If target is a link, prevent default action.
    if($target.is('a')) {
      event.preventDefault();
    }

    // If target is not the <li> element (ie: a child), find the <li>.
    if(!$target.is('li')) {
      $target = $target.closest('li');
    }

    unevenOffset = (_.slideCount % _.options.slidesToScroll !== 0);
    indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;

    switch (event.data.message) {

      case 'previous':
        slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
        if (_.slideCount > _.options.slidesToShow) {
          _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
        }
        break;

      case 'next':
        slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
        if (_.slideCount > _.options.slidesToShow) {
          _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
        }
        break;

      case 'index':
        var index = event.data.index === 0 ? 0 :
          event.data.index || $target.index() * _.options.slidesToScroll;

        _.slideHandler(_.checkNavigable(index), false, dontAnimate);
        $target.children().trigger('focus');
        break;

      default:
        return;
    }

  };

  Slick.prototype.checkNavigable = function(index) {

    var _ = this,
      navigables, prevNavigable;

    navigables = _.getNavigableIndexes();
    prevNavigable = 0;
    if (index > navigables[navigables.length - 1]) {
      index = navigables[navigables.length - 1];
    } else {
      for (var n in navigables) {
        if (index < navigables[n]) {
          index = prevNavigable;
          break;
        }
        prevNavigable = navigables[n];
      }
    }

    return index;
  };

  Slick.prototype.cleanUpEvents = function() {

    var _ = this;

    if (_.options.dots && _.$dots !== null) {

      $('li', _.$dots)
        .off('click.slick', _.changeSlide)
        .off('mouseenter.slick', $.proxy(_.interrupt, _, true))
        .off('mouseleave.slick', $.proxy(_.interrupt, _, false));

      if (_.options.accessibility === true) {
        _.$dots.off('keydown.slick', _.keyHandler);
      }
    }

    _.$slider.off('focus.slick blur.slick');

    if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
      _.$prevArrow && _.$prevArrow.off('click.slick', _.changeSlide);
      _.$nextArrow && _.$nextArrow.off('click.slick', _.changeSlide);

      if (_.options.accessibility === true) {
        _.$prevArrow && _.$prevArrow.off('keydown.slick', _.keyHandler);
        _.$nextArrow && _.$nextArrow.off('keydown.slick', _.keyHandler);
      }
    }

    _.$list.off('touchstart.slick mousedown.slick', _.swipeHandler);
    _.$list.off('touchmove.slick mousemove.slick', _.swipeHandler);
    _.$list.off('touchend.slick mouseup.slick', _.swipeHandler);
    _.$list.off('touchcancel.slick mouseleave.slick', _.swipeHandler);

    _.$list.off('click.slick', _.clickHandler);

    $(document).off(_.visibilityChange, _.visibility);

    _.cleanUpSlideEvents();

    if (_.options.accessibility === true) {
      _.$list.off('keydown.slick', _.keyHandler);
    }

    if (_.options.focusOnSelect === true) {
      $(_.$slideTrack).children().off('click.slick', _.selectHandler);
    }

    $(window).off('orientationchange.slick.slick-' + _.instanceUid, _.orientationChange);

    $(window).off('resize.slick.slick-' + _.instanceUid, _.resize);

    $('[draggable!=true]', _.$slideTrack).off('dragstart', _.preventDefault);

    $(window).off('load.slick.slick-' + _.instanceUid, _.setPosition);

  };

  Slick.prototype.cleanUpSlideEvents = function() {

    var _ = this;

    _.$list.off('mouseenter.slick', $.proxy(_.interrupt, _, true));
    _.$list.off('mouseleave.slick', $.proxy(_.interrupt, _, false));

  };

  Slick.prototype.cleanUpRows = function() {

    var _ = this, originalSlides;

    if(_.options.rows > 0) {
      originalSlides = _.$slides.children().children();
      originalSlides.removeAttr('style');
      _.$slider.empty().append(originalSlides);
    }

  };

  Slick.prototype.clickHandler = function(event) {

    var _ = this;

    if (_.shouldClick === false) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
    }

  };

  Slick.prototype.destroy = function(refresh) {

    var _ = this;

    _.autoPlayClear();

    _.touchObject = {};

    _.cleanUpEvents();

    $('.slick-cloned', _.$slider).detach();

    if (_.$dots) {
      _.$dots.remove();
    }

    if ( _.$prevArrow && _.$prevArrow.length ) {

      _.$prevArrow
        .removeClass('slick-disabled slick-arrow slick-hidden')
        .removeAttr('aria-hidden aria-disabled tabindex')
        .css('display','');

      if ( _.htmlExpr.test( _.options.prevArrow )) {
        _.$prevArrow.remove();
      }
    }

    if ( _.$nextArrow && _.$nextArrow.length ) {

      _.$nextArrow
        .removeClass('slick-disabled slick-arrow slick-hidden')
        .removeAttr('aria-hidden aria-disabled tabindex')
        .css('display','');

      if ( _.htmlExpr.test( _.options.nextArrow )) {
        _.$nextArrow.remove();
      }
    }


    if (_.$slides) {

      _.$slides
        .removeClass('slick-slide slick-active slick-center slick-visible slick-current')
        .removeAttr('aria-hidden')
        .removeAttr('data-slick-index')
        .each(function(){
          $(this).attr('style', $(this).data('originalStyling'));
        });

      _.$slideTrack.children(this.options.slide).detach();

      _.$slideTrack.detach();

      _.$list.detach();

      _.$slider.append(_.$slides);
    }

    _.cleanUpRows();

    _.$slider.removeClass('slick-slider');
    _.$slider.removeClass('slick-initialized');
    _.$slider.removeClass('slick-dotted');

    _.unslicked = true;

    if(!refresh) {
      _.$slider.trigger('destroy', [_]);
    }

  };

  Slick.prototype.disableTransition = function(slide) {

    var _ = this,
      transition = {};

    transition[_.transitionType] = '';

    if (_.options.fade === false) {
      _.$slideTrack.css(transition);
    } else {
      _.$slides.eq(slide).css(transition);
    }

  };

  Slick.prototype.fadeSlide = function(slideIndex, callback) {

    var _ = this;

    if (_.cssTransitions === false) {

      _.$slides.eq(slideIndex).css({
        zIndex: _.options.zIndex
      });

      _.$slides.eq(slideIndex).animate({
        opacity: 1
      }, _.options.speed, _.options.easing, callback);

    } else {

      _.applyTransition(slideIndex);

      _.$slides.eq(slideIndex).css({
        opacity: 1,
        zIndex: _.options.zIndex
      });

      if (callback) {
        setTimeout(function() {

          _.disableTransition(slideIndex);

          callback.call();
        }, _.options.speed);
      }

    }

  };

  Slick.prototype.fadeSlideOut = function(slideIndex) {

    var _ = this;

    if (_.cssTransitions === false) {

      _.$slides.eq(slideIndex).animate({
        opacity: 0,
        zIndex: _.options.zIndex - 2
      }, _.options.speed, _.options.easing);

    } else {

      _.applyTransition(slideIndex);

      _.$slides.eq(slideIndex).css({
        opacity: 0,
        zIndex: _.options.zIndex - 2
      });

    }

  };

  Slick.prototype.filterSlides = Slick.prototype.slickFilter = function(filter) {

    var _ = this;

    if (filter !== null) {

      _.$slidesCache = _.$slides;

      _.unload();

      _.$slideTrack.children(this.options.slide).detach();

      _.$slidesCache.filter(filter).appendTo(_.$slideTrack);

      _.reinit();

    }

  };

  Slick.prototype.focusHandler = function() {

    var _ = this;

    _.$slider
      .off('focus.slick blur.slick')
      .on('focus.slick blur.slick', '*', function(event) {

        event.stopImmediatePropagation();
        var $sf = $(this);

        setTimeout(function() {

          if( _.options.pauseOnFocus ) {
            _.focussed = $sf.is(':focus');
            _.autoPlay();
          }

        }, 0);

      });
  };

  Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {

    var _ = this;
    return _.currentSlide;

  };

  Slick.prototype.getDotCount = function() {

    var _ = this;

    var breakPoint = 0;
    var counter = 0;
    var pagerQty = 0;

    if (_.options.infinite === true) {
      if (_.slideCount <= _.options.slidesToShow) {
        ++pagerQty;
      } else {
        while (breakPoint < _.slideCount) {
          ++pagerQty;
          breakPoint = counter + _.options.slidesToScroll;
          counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }
      }
    } else if (_.options.centerMode === true) {
      pagerQty = _.slideCount;
    } else if(!_.options.asNavFor) {
      pagerQty = 1 + Math.ceil((_.slideCount - _.options.slidesToShow) / _.options.slidesToScroll);
    }else {
      while (breakPoint < _.slideCount) {
        ++pagerQty;
        breakPoint = counter + _.options.slidesToScroll;
        counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
      }
    }

    return pagerQty - 1;

  };

  Slick.prototype.getLeft = function(slideIndex) {

    var _ = this,
      targetLeft,
      verticalHeight,
      verticalOffset = 0,
      targetSlide,
      coef;

    _.slideOffset = 0;
    verticalHeight = _.$slides.first().outerHeight(true);

    if (_.options.infinite === true) {
      if (_.slideCount > _.options.slidesToShow) {
        _.slideOffset = (_.slideWidth * _.options.slidesToShow) * -1;
        coef = -1

        if (_.options.vertical === true && _.options.centerMode === true) {
          if (_.options.slidesToShow === 2) {
            coef = -1.5;
          } else if (_.options.slidesToShow === 1) {
            coef = -2
          }
        }
        verticalOffset = (verticalHeight * _.options.slidesToShow) * coef;
      }
      if (_.slideCount % _.options.slidesToScroll !== 0) {
        if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
          if (slideIndex > _.slideCount) {
            _.slideOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth) * -1;
            verticalOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight) * -1;
          } else {
            _.slideOffset = ((_.slideCount % _.options.slidesToScroll) * _.slideWidth) * -1;
            verticalOffset = ((_.slideCount % _.options.slidesToScroll) * verticalHeight) * -1;
          }
        }
      }
    } else {
      if (slideIndex + _.options.slidesToShow > _.slideCount) {
        _.slideOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * _.slideWidth;
        verticalOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * verticalHeight;
      }
    }

    if (_.slideCount <= _.options.slidesToShow) {
      _.slideOffset = 0;
      verticalOffset = 0;
    }

    if (_.options.centerMode === true && _.slideCount <= _.options.slidesToShow) {
      _.slideOffset = ((_.slideWidth * Math.floor(_.options.slidesToShow)) / 2) - ((_.slideWidth * _.slideCount) / 2);
    } else if (_.options.centerMode === true && _.options.infinite === true) {
      _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
    } else if (_.options.centerMode === true) {
      _.slideOffset = 0;
      _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
    }

    if (_.options.vertical === false) {
      targetLeft = ((slideIndex * _.slideWidth) * -1) + _.slideOffset;
    } else {
      targetLeft = ((slideIndex * verticalHeight) * -1) + verticalOffset;
    }

    if (_.options.variableWidth === true) {

      if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
        targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
      } else {
        targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow);
      }

      if (_.options.rtl === true) {
        if (targetSlide[0]) {
          targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
        } else {
          targetLeft =  0;
        }
      } else {
        targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
      }

      if (_.options.centerMode === true) {
        if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
          targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
        } else {
          targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow + 1);
        }

        if (_.options.rtl === true) {
          if (targetSlide[0]) {
            targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
          } else {
            targetLeft =  0;
          }
        } else {
          targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
        }

        targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
      }
    }

    return targetLeft;

  };

  Slick.prototype.getOption = Slick.prototype.slickGetOption = function(option) {

    var _ = this;

    return _.options[option];

  };

  Slick.prototype.getNavigableIndexes = function() {

    var _ = this,
      breakPoint = 0,
      counter = 0,
      indexes = [],
      max;

    if (_.options.infinite === false) {
      max = _.slideCount;
    } else {
      breakPoint = _.options.slidesToScroll * -1;
      counter = _.options.slidesToScroll * -1;
      max = _.slideCount * 2;
    }

    while (breakPoint < max) {
      indexes.push(breakPoint);
      breakPoint = counter + _.options.slidesToScroll;
      counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
    }

    return indexes;

  };

  Slick.prototype.getSlick = function() {

    return this;

  };

  Slick.prototype.getSlideCount = function() {

    var _ = this,
      slidesTraversed, swipedSlide, centerOffset;

    centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;

    if (_.options.swipeToSlide === true) {
      _.$slideTrack.find('.slick-slide').each(function(index, slide) {
        if (slide.offsetLeft - centerOffset + ($(slide).outerWidth() / 2) > (_.swipeLeft * -1)) {
          swipedSlide = slide;
          return false;
        }
      });

      slidesTraversed = Math.abs($(swipedSlide).attr('data-slick-index') - _.currentSlide) || 1;

      return slidesTraversed;

    } else {
      return _.options.slidesToScroll;
    }

  };

  Slick.prototype.goTo = Slick.prototype.slickGoTo = function(slide, dontAnimate) {

    var _ = this;

    _.changeSlide({
      data: {
        message: 'index',
        index: parseInt(slide)
      }
    }, dontAnimate);

  };

  Slick.prototype.init = function(creation) {

    var _ = this;

    if (!$(_.$slider).hasClass('slick-initialized')) {

      $(_.$slider).addClass('slick-initialized');

      _.buildRows();
      _.buildOut();
      _.setProps();
      _.startLoad();
      _.loadSlider();
      _.initializeEvents();
      _.updateArrows();
      _.updateDots();
      _.checkResponsive(true);
      _.focusHandler();

    }

    if (creation) {
      _.$slider.trigger('init', [_]);
    }

    if (_.options.accessibility === true) {
      _.initADA();
    }

    if ( _.options.autoplay ) {

      _.paused = false;
      _.autoPlay();

    }

  };

  Slick.prototype.initADA = function() {
    var _ = this,
      numDotGroups = Math.ceil(_.slideCount / _.options.slidesToShow),
      tabControlIndexes = _.getNavigableIndexes().filter(function(val) {
        return (val >= 0) && (val < _.slideCount);
      });

    _.$slides.add(_.$slideTrack.find('.slick-cloned')).attr({
      'aria-hidden': 'true',
      'tabindex': '-1'
    }).find('a, input, button, select').attr({
      'tabindex': '-1'
    });

    if (_.$dots !== null) {
      _.$slides.not(_.$slideTrack.find('.slick-cloned')).each(function(i) {
        var slideControlIndex = tabControlIndexes.indexOf(i);

        $(this).attr({
          'role': 'tabpanel',
          'id': 'slick-slide' + _.instanceUid + i,
          'tabindex': -1
        });

        if (slideControlIndex !== -1) {
          var ariaButtonControl = 'slick-slide-control' + _.instanceUid + slideControlIndex
          if ($('#' + ariaButtonControl).length) {
            $(this).attr({
              'aria-describedby': ariaButtonControl
            });
          }
        }
      });

      _.$dots.attr('role', 'tablist').find('li').each(function(i) {
        var mappedSlideIndex = tabControlIndexes[i];

        $(this).attr({
          'role': 'presentation'
        });

        $(this).find('button').first().attr({
          'role': 'tab',
          'id': 'slick-slide-control' + _.instanceUid + i,
          'aria-controls': 'slick-slide' + _.instanceUid + mappedSlideIndex,
          'aria-label': (i + 1) + ' of ' + numDotGroups,
          'aria-selected': null,
          'tabindex': '-1'
        });

      }).eq(_.currentSlide).find('button').attr({
        'aria-selected': 'true',
        'tabindex': '0'
      }).end();
    }

    for (var i=_.currentSlide, max=i+_.options.slidesToShow; i < max; i++) {
      if (_.options.focusOnChange) {
        _.$slides.eq(i).attr({'tabindex': '0'});
      } else {
        _.$slides.eq(i).removeAttr('tabindex');
      }
    }

    _.activateADA();

  };

  Slick.prototype.initArrowEvents = function() {

    var _ = this;

    if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
      _.$prevArrow
        .off('click.slick')
        .on('click.slick', {
          message: 'previous'
        }, _.changeSlide);
      _.$nextArrow
        .off('click.slick')
        .on('click.slick', {
          message: 'next'
        }, _.changeSlide);

      if (_.options.accessibility === true) {
        _.$prevArrow.on('keydown.slick', _.keyHandler);
        _.$nextArrow.on('keydown.slick', _.keyHandler);
      }
    }

  };

  Slick.prototype.initDotEvents = function() {

    var _ = this;

    if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
      $('li', _.$dots).on('click.slick', {
        message: 'index'
      }, _.changeSlide);

      if (_.options.accessibility === true) {
        _.$dots.on('keydown.slick', _.keyHandler);
      }
    }

    if (_.options.dots === true && _.options.pauseOnDotsHover === true && _.slideCount > _.options.slidesToShow) {

      $('li', _.$dots)
        .on('mouseenter.slick', $.proxy(_.interrupt, _, true))
        .on('mouseleave.slick', $.proxy(_.interrupt, _, false));

    }

  };

  Slick.prototype.initSlideEvents = function() {

    var _ = this;

    if ( _.options.pauseOnHover ) {

      _.$list.on('mouseenter.slick', $.proxy(_.interrupt, _, true));
      _.$list.on('mouseleave.slick', $.proxy(_.interrupt, _, false));

    }

  };

  Slick.prototype.initializeEvents = function() {

    var _ = this;

    _.initArrowEvents();

    _.initDotEvents();
    _.initSlideEvents();

    _.$list.on('touchstart.slick mousedown.slick', {
      action: 'start'
    }, _.swipeHandler);
    _.$list.on('touchmove.slick mousemove.slick', {
      action: 'move'
    }, _.swipeHandler);
    _.$list.on('touchend.slick mouseup.slick', {
      action: 'end'
    }, _.swipeHandler);
    _.$list.on('touchcancel.slick mouseleave.slick', {
      action: 'end'
    }, _.swipeHandler);

    _.$list.on('click.slick', _.clickHandler);

    $(document).on(_.visibilityChange, $.proxy(_.visibility, _));

    if (_.options.accessibility === true) {
      _.$list.on('keydown.slick', _.keyHandler);
    }

    if (_.options.focusOnSelect === true) {
      $(_.$slideTrack).children().on('click.slick', _.selectHandler);
    }

    $(window).on('orientationchange.slick.slick-' + _.instanceUid, $.proxy(_.orientationChange, _));

    $(window).on('resize.slick.slick-' + _.instanceUid, $.proxy(_.resize, _));

    $('[draggable!=true]', _.$slideTrack).on('dragstart', _.preventDefault);

    $(window).on('load.slick.slick-' + _.instanceUid, _.setPosition);
    $(_.setPosition);

  };

  Slick.prototype.initUI = function() {

    var _ = this;

    if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

      _.$prevArrow.show();
      _.$nextArrow.show();

    }

    if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

      _.$dots.show();

    }

  };

  Slick.prototype.keyHandler = function(event) {

    var _ = this;
    //Dont slide if the cursor is inside the form fields and arrow keys are pressed
    if(!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
      if (event.keyCode === 37 && _.options.accessibility === true) {
        _.changeSlide({
          data: {
            message: _.options.rtl === true ? 'next' :  'previous'
          }
        });
      } else if (event.keyCode === 39 && _.options.accessibility === true) {
        _.changeSlide({
          data: {
            message: _.options.rtl === true ? 'previous' : 'next'
          }
        });
      }
    }

  };

  Slick.prototype.lazyLoad = function() {

    var _ = this,
      loadRange, cloneRange, rangeStart, rangeEnd;

    function loadImages(imagesScope) {

      $('img[data-lazy]', imagesScope).each(function() {

        var image = $(this),
          imageSource = $(this).attr('data-lazy'),
          imageSrcSet = $(this).attr('data-srcset'),
          imageSizes  = $(this).attr('data-sizes') || _.$slider.attr('data-sizes'),
          imageToLoad = document.createElement('img');

        imageToLoad.onload = function() {

          image
            .animate({ opacity: 0 }, 100, function() {

              if (imageSrcSet) {
                image
                  .attr('srcset', imageSrcSet );

                if (imageSizes) {
                  image
                    .attr('sizes', imageSizes );
                }
              }

              image
                .attr('src', imageSource)
                .animate({ opacity: 1 }, 200, function() {
                  image
                    .removeAttr('data-lazy data-srcset data-sizes')
                    .removeClass('slick-loading');
                });
              _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
            });

        };

        imageToLoad.onerror = function() {

          image
            .removeAttr( 'data-lazy' )
            .removeClass( 'slick-loading' )
            .addClass( 'slick-lazyload-error' );

          _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

        };

        imageToLoad.src = imageSource;

      });

    }

    if (_.options.centerMode === true) {
      if (_.options.infinite === true) {
        rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
        rangeEnd = rangeStart + _.options.slidesToShow + 2;
      } else {
        rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
        rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
      }
    } else {
      rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
      rangeEnd = Math.ceil(rangeStart + _.options.slidesToShow);
      if (_.options.fade === true) {
        if (rangeStart > 0) rangeStart--;
        if (rangeEnd <= _.slideCount) rangeEnd++;
      }
    }

    loadRange = _.$slider.find('.slick-slide').slice(rangeStart, rangeEnd);

    if (_.options.lazyLoad === 'anticipated') {
      var prevSlide = rangeStart - 1,
        nextSlide = rangeEnd,
        $slides = _.$slider.find('.slick-slide');

      for (var i = 0; i < _.options.slidesToScroll; i++) {
        if (prevSlide < 0) prevSlide = _.slideCount - 1;
        loadRange = loadRange.add($slides.eq(prevSlide));
        loadRange = loadRange.add($slides.eq(nextSlide));
        prevSlide--;
        nextSlide++;
      }
    }

    loadImages(loadRange);

    if (_.slideCount <= _.options.slidesToShow) {
      cloneRange = _.$slider.find('.slick-slide');
      loadImages(cloneRange);
    } else
    if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
      cloneRange = _.$slider.find('.slick-cloned').slice(0, _.options.slidesToShow);
      loadImages(cloneRange);
    } else if (_.currentSlide === 0) {
      cloneRange = _.$slider.find('.slick-cloned').slice(_.options.slidesToShow * -1);
      loadImages(cloneRange);
    }

  };

  Slick.prototype.loadSlider = function() {

    var _ = this;

    _.setPosition();

    _.$slideTrack.css({
      opacity: 1
    });

    _.$slider.removeClass('slick-loading');

    _.initUI();

    if (_.options.lazyLoad === 'progressive') {
      _.progressiveLazyLoad();
    }

  };

  Slick.prototype.next = Slick.prototype.slickNext = function() {

    var _ = this;

    _.changeSlide({
      data: {
        message: 'next'
      }
    });

  };

  Slick.prototype.orientationChange = function() {

    var _ = this;

    _.checkResponsive();
    _.setPosition();

  };

  Slick.prototype.pause = Slick.prototype.slickPause = function() {

    var _ = this;

    _.autoPlayClear();
    _.paused = true;

  };

  Slick.prototype.play = Slick.prototype.slickPlay = function() {

    var _ = this;

    _.autoPlay();
    _.options.autoplay = true;
    _.paused = false;
    _.focussed = false;
    _.interrupted = false;

  };

  Slick.prototype.postSlide = function(index) {

    var _ = this;

    if( !_.unslicked ) {

      _.$slider.trigger('afterChange', [_, index]);

      _.animating = false;

      if (_.slideCount > _.options.slidesToShow) {
        _.setPosition();
      }

      _.swipeLeft = null;

      if ( _.options.autoplay ) {
        _.autoPlay();
      }

      if (_.options.accessibility === true) {
        _.initADA();

        if (_.options.focusOnChange) {
          var $currentSlide = $(_.$slides.get(_.currentSlide));
          $currentSlide.attr('tabindex', 0).focus();
        }
      }

    }

  };

  Slick.prototype.prev = Slick.prototype.slickPrev = function() {

    var _ = this;

    _.changeSlide({
      data: {
        message: 'previous'
      }
    });

  };

  Slick.prototype.preventDefault = function(event) {

    event.preventDefault();

  };

  Slick.prototype.progressiveLazyLoad = function( tryCount ) {

    tryCount = tryCount || 1;

    var _ = this,
      $imgsToLoad = $( 'img[data-lazy]', _.$slider ),
      image,
      imageSource,
      imageSrcSet,
      imageSizes,
      imageToLoad;

    if ( $imgsToLoad.length ) {

      image = $imgsToLoad.first();
      imageSource = image.attr('data-lazy');
      imageSrcSet = image.attr('data-srcset');
      imageSizes  = image.attr('data-sizes') || _.$slider.attr('data-sizes');
      imageToLoad = document.createElement('img');

      imageToLoad.onload = function() {

        if (imageSrcSet) {
          image
            .attr('srcset', imageSrcSet );

          if (imageSizes) {
            image
              .attr('sizes', imageSizes );
          }
        }

        image
          .attr( 'src', imageSource )
          .removeAttr('data-lazy data-srcset data-sizes')
          .removeClass('slick-loading');

        if ( _.options.adaptiveHeight === true ) {
          _.setPosition();
        }

        _.$slider.trigger('lazyLoaded', [ _, image, imageSource ]);
        _.progressiveLazyLoad();

      };

      imageToLoad.onerror = function() {

        if ( tryCount < 3 ) {

          /**
           * try to load the image 3 times,
           * leave a slight delay so we don't get
           * servers blocking the request.
           */
          setTimeout( function() {
            _.progressiveLazyLoad( tryCount + 1 );
          }, 500 );

        } else {

          image
            .removeAttr( 'data-lazy' )
            .removeClass( 'slick-loading' )
            .addClass( 'slick-lazyload-error' );

          _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

          _.progressiveLazyLoad();

        }

      };

      imageToLoad.src = imageSource;

    } else {

      _.$slider.trigger('allImagesLoaded', [ _ ]);

    }

  };

  Slick.prototype.refresh = function( initializing ) {

    var _ = this, currentSlide, lastVisibleIndex;

    lastVisibleIndex = _.slideCount - _.options.slidesToShow;

    // in non-infinite sliders, we don't want to go past the
    // last visible index.
    if( !_.options.infinite && ( _.currentSlide > lastVisibleIndex )) {
      _.currentSlide = lastVisibleIndex;
    }

    // if less slides than to show, go to start.
    if ( _.slideCount <= _.options.slidesToShow ) {
      _.currentSlide = 0;

    }

    currentSlide = _.currentSlide;

    _.destroy(true);

    $.extend(_, _.initials, { currentSlide: currentSlide });

    _.init();

    if( !initializing ) {

      _.changeSlide({
        data: {
          message: 'index',
          index: currentSlide
        }
      }, false);

    }

  };

  Slick.prototype.registerBreakpoints = function() {

    var _ = this, breakpoint, currentBreakpoint, l,
      responsiveSettings = _.options.responsive || null;

    if ( $.type(responsiveSettings) === 'array' && responsiveSettings.length ) {

      _.respondTo = _.options.respondTo || 'window';

      for ( breakpoint in responsiveSettings ) {

        l = _.breakpoints.length-1;

        if (responsiveSettings.hasOwnProperty(breakpoint)) {
          currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

          // loop through the breakpoints and cut out any existing
          // ones with the same breakpoint number, we don't want dupes.
          while( l >= 0 ) {
            if( _.breakpoints[l] && _.breakpoints[l] === currentBreakpoint ) {
              _.breakpoints.splice(l,1);
            }
            l--;
          }

          _.breakpoints.push(currentBreakpoint);
          _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;

        }

      }

      _.breakpoints.sort(function(a, b) {
        return ( _.options.mobileFirst ) ? a-b : b-a;
      });

    }

  };

  Slick.prototype.reinit = function() {

    var _ = this;

    _.$slides =
      _.$slideTrack
        .children(_.options.slide)
        .addClass('slick-slide');

    _.slideCount = _.$slides.length;

    if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
      _.currentSlide = _.currentSlide - _.options.slidesToScroll;
    }

    if (_.slideCount <= _.options.slidesToShow) {
      _.currentSlide = 0;
    }

    _.registerBreakpoints();

    _.setProps();
    _.setupInfinite();
    _.buildArrows();
    _.updateArrows();
    _.initArrowEvents();
    _.buildDots();
    _.updateDots();
    _.initDotEvents();
    _.cleanUpSlideEvents();
    _.initSlideEvents();

    _.checkResponsive(false, true);

    if (_.options.focusOnSelect === true) {
      $(_.$slideTrack).children().on('click.slick', _.selectHandler);
    }

    _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

    _.setPosition();
    _.focusHandler();

    _.paused = !_.options.autoplay;
    _.autoPlay();

    _.$slider.trigger('reInit', [_]);

  };

  Slick.prototype.resize = function() {

    var _ = this;

    if ($(window).width() !== _.windowWidth) {
      clearTimeout(_.windowDelay);
      _.windowDelay = window.setTimeout(function() {
        _.windowWidth = $(window).width();
        _.checkResponsive();
        if( !_.unslicked ) { _.setPosition(); }
      }, 50);
    }
  };

  Slick.prototype.removeSlide = Slick.prototype.slickRemove = function(index, removeBefore, removeAll) {

    var _ = this;

    if (typeof(index) === 'boolean') {
      removeBefore = index;
      index = removeBefore === true ? 0 : _.slideCount - 1;
    } else {
      index = removeBefore === true ? --index : index;
    }

    if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
      return false;
    }

    _.unload();

    if (removeAll === true) {
      _.$slideTrack.children().remove();
    } else {
      _.$slideTrack.children(this.options.slide).eq(index).remove();
    }

    _.$slides = _.$slideTrack.children(this.options.slide);

    _.$slideTrack.children(this.options.slide).detach();

    _.$slideTrack.append(_.$slides);

    _.$slidesCache = _.$slides;

    _.reinit();

  };

  Slick.prototype.setCSS = function(position) {

    var _ = this,
      positionProps = {},
      x, y;

    if (_.options.rtl === true) {
      position = -position;
    }
    x = _.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
    y = _.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

    positionProps[_.positionProp] = position;

    if (_.transformsEnabled === false) {
      _.$slideTrack.css(positionProps);
    } else {
      positionProps = {};
      if (_.cssTransitions === false) {
        positionProps[_.animType] = 'translate(' + x + ', ' + y + ')';
        _.$slideTrack.css(positionProps);
      } else {
        positionProps[_.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
        _.$slideTrack.css(positionProps);
      }
    }

  };

  Slick.prototype.setDimensions = function() {

    var _ = this;

    if (_.options.vertical === false) {
      if (_.options.centerMode === true) {
        _.$list.css({
          padding: ('0px ' + _.options.centerPadding)
        });
      }
    } else {
      _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
      if (_.options.centerMode === true) {
        _.$list.css({
          padding: (_.options.centerPadding + ' 0px')
        });
      }
    }

    _.listWidth = _.$list.width();
    _.listHeight = _.$list.height();


    if (_.options.vertical === false && _.options.variableWidth === false) {
      _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
      _.$slideTrack.width(Math.ceil((_.slideWidth * _.$slideTrack.children('.slick-slide').length)));

    } else if (_.options.variableWidth === true) {
      _.$slideTrack.width(5000 * _.slideCount);
    } else {
      _.slideWidth = Math.ceil(_.listWidth);
      _.$slideTrack.height(Math.ceil((_.$slides.first().outerHeight(true) * _.$slideTrack.children('.slick-slide').length)));
    }

    var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
    if (_.options.variableWidth === false) _.$slideTrack.children('.slick-slide').width(_.slideWidth - offset);

  };

  Slick.prototype.setFade = function() {

    var _ = this,
      targetLeft;

    _.$slides.each(function(index, element) {
      targetLeft = (_.slideWidth * index) * -1;
      if (_.options.rtl === true) {
        $(element).css({
          position: 'relative',
          right: targetLeft,
          top: 0,
          zIndex: _.options.zIndex - 2,
          opacity: 0
        });
      } else {
        $(element).css({
          position: 'relative',
          left: targetLeft,
          top: 0,
          zIndex: _.options.zIndex - 2,
          opacity: 0
        });
      }
    });

    _.$slides.eq(_.currentSlide).css({
      zIndex: _.options.zIndex - 1,
      opacity: 1
    });

  };

  Slick.prototype.setHeight = function() {

    var _ = this;

    if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
      var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
      _.$list.css('height', targetHeight);
    }

  };

  Slick.prototype.setOption =
    Slick.prototype.slickSetOption = function() {

      /**
       * accepts arguments in format of:
       *
       *  - for changing a single option's value:
       *     .slick("setOption", option, value, refresh )
       *
       *  - for changing a set of responsive options:
       *     .slick("setOption", 'responsive', [{}, ...], refresh )
       *
       *  - for updating multiple values at once (not responsive)
       *     .slick("setOption", { 'option': value, ... }, refresh )
       */

      var _ = this, l, item, option, value, refresh = false, type;

      if( $.type( arguments[0] ) === 'object' ) {

        option =  arguments[0];
        refresh = arguments[1];
        type = 'multiple';

      } else if ( $.type( arguments[0] ) === 'string' ) {

        option =  arguments[0];
        value = arguments[1];
        refresh = arguments[2];

        if ( arguments[0] === 'responsive' && $.type( arguments[1] ) === 'array' ) {

          type = 'responsive';

        } else if ( typeof arguments[1] !== 'undefined' ) {

          type = 'single';

        }

      }

      if ( type === 'single' ) {

        _.options[option] = value;


      } else if ( type === 'multiple' ) {

        $.each( option , function( opt, val ) {

          _.options[opt] = val;

        });


      } else if ( type === 'responsive' ) {

        for ( item in value ) {

          if( $.type( _.options.responsive ) !== 'array' ) {

            _.options.responsive = [ value[item] ];

          } else {

            l = _.options.responsive.length-1;

            // loop through the responsive object and splice out duplicates.
            while( l >= 0 ) {

              if( _.options.responsive[l].breakpoint === value[item].breakpoint ) {

                _.options.responsive.splice(l,1);

              }

              l--;

            }

            _.options.responsive.push( value[item] );

          }

        }

      }

      if ( refresh ) {

        _.unload();
        _.reinit();

      }

    };

  Slick.prototype.setPosition = function() {

    var _ = this;

    _.setDimensions();

    _.setHeight();

    if (_.options.fade === false) {
      _.setCSS(_.getLeft(_.currentSlide));
    } else {
      _.setFade();
    }

    _.$slider.trigger('setPosition', [_]);

  };

  Slick.prototype.setProps = function() {

    var _ = this,
      bodyStyle = document.body.style;

    _.positionProp = _.options.vertical === true ? 'top' : 'left';

    if (_.positionProp === 'top') {
      _.$slider.addClass('slick-vertical');
    } else {
      _.$slider.removeClass('slick-vertical');
    }

    if (bodyStyle.WebkitTransition !== undefined ||
      bodyStyle.MozTransition !== undefined ||
      bodyStyle.msTransition !== undefined) {
      if (_.options.useCSS === true) {
        _.cssTransitions = true;
      }
    }

    if ( _.options.fade ) {
      if ( typeof _.options.zIndex === 'number' ) {
        if( _.options.zIndex < 3 ) {
          _.options.zIndex = 3;
        }
      } else {
        _.options.zIndex = _.defaults.zIndex;
      }
    }

    if (bodyStyle.OTransform !== undefined) {
      _.animType = 'OTransform';
      _.transformType = '-o-transform';
      _.transitionType = 'OTransition';
      if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
    }
    if (bodyStyle.MozTransform !== undefined) {
      _.animType = 'MozTransform';
      _.transformType = '-moz-transform';
      _.transitionType = 'MozTransition';
      if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
    }
    if (bodyStyle.webkitTransform !== undefined) {
      _.animType = 'webkitTransform';
      _.transformType = '-webkit-transform';
      _.transitionType = 'webkitTransition';
      if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
    }
    if (bodyStyle.msTransform !== undefined) {
      _.animType = 'msTransform';
      _.transformType = '-ms-transform';
      _.transitionType = 'msTransition';
      if (bodyStyle.msTransform === undefined) _.animType = false;
    }
    if (bodyStyle.transform !== undefined && _.animType !== false) {
      _.animType = 'transform';
      _.transformType = 'transform';
      _.transitionType = 'transition';
    }
    _.transformsEnabled = _.options.useTransform && (_.animType !== null && _.animType !== false);
  };


  Slick.prototype.setSlideClasses = function(index) {

    var _ = this,
      centerOffset, allSlides, indexOffset, remainder;

    allSlides = _.$slider
      .find('.slick-slide')
      .removeClass('slick-active slick-center slick-current')
      .attr('aria-hidden', 'true');

    _.$slides
      .eq(index)
      .addClass('slick-current');

    if (_.options.centerMode === true) {

      var evenCoef = _.options.slidesToShow % 2 === 0 ? 1 : 0;

      centerOffset = Math.floor(_.options.slidesToShow / 2);

      if (_.options.infinite === true) {

        if (index >= centerOffset && index <= (_.slideCount - 1) - centerOffset) {
          _.$slides
            .slice(index - centerOffset + evenCoef, index + centerOffset + 1)
            .addClass('slick-active')
            .attr('aria-hidden', 'false');

        } else {

          indexOffset = _.options.slidesToShow + index;
          allSlides
            .slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2)
            .addClass('slick-active')
            .attr('aria-hidden', 'false');

        }

        if (index === 0) {

          allSlides
            .eq(allSlides.length - 1 - _.options.slidesToShow)
            .addClass('slick-center');

        } else if (index === _.slideCount - 1) {

          allSlides
            .eq(_.options.slidesToShow)
            .addClass('slick-center');

        }

      }

      _.$slides
        .eq(index)
        .addClass('slick-center');

    } else {

      if (index >= 0 && index <= (_.slideCount - _.options.slidesToShow)) {

        _.$slides
          .slice(index, index + _.options.slidesToShow)
          .addClass('slick-active')
          .attr('aria-hidden', 'false');

      } else if (allSlides.length <= _.options.slidesToShow) {

        allSlides
          .addClass('slick-active')
          .attr('aria-hidden', 'false');

      } else {

        remainder = _.slideCount % _.options.slidesToShow;
        indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;

        if (_.options.slidesToShow == _.options.slidesToScroll && (_.slideCount - index) < _.options.slidesToShow) {

          allSlides
            .slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder)
            .addClass('slick-active')
            .attr('aria-hidden', 'false');

        } else {

          allSlides
            .slice(indexOffset, indexOffset + _.options.slidesToShow)
            .addClass('slick-active')
            .attr('aria-hidden', 'false');

        }

      }

    }

    if (_.options.lazyLoad === 'ondemand' || _.options.lazyLoad === 'anticipated') {
      _.lazyLoad();
    }
  };

  Slick.prototype.setupInfinite = function() {

    var _ = this,
      i, slideIndex, infiniteCount;

    if (_.options.fade === true) {
      _.options.centerMode = false;
    }

    if (_.options.infinite === true && _.options.fade === false) {

      slideIndex = null;

      if (_.slideCount > _.options.slidesToShow) {

        if (_.options.centerMode === true) {
          infiniteCount = _.options.slidesToShow + 1;
        } else {
          infiniteCount = _.options.slidesToShow;
        }

        for (i = _.slideCount; i > (_.slideCount -
          infiniteCount); i -= 1) {
          slideIndex = i - 1;
          $(_.$slides[slideIndex]).clone(true).attr('id', '')
            .attr('data-slick-index', slideIndex - _.slideCount)
            .prependTo(_.$slideTrack).addClass('slick-cloned');
        }
        for (i = 0; i < infiniteCount  + _.slideCount; i += 1) {
          slideIndex = i;
          $(_.$slides[slideIndex]).clone(true).attr('id', '')
            .attr('data-slick-index', slideIndex + _.slideCount)
            .appendTo(_.$slideTrack).addClass('slick-cloned');
        }
        _.$slideTrack.find('.slick-cloned').find('[id]').each(function() {
          $(this).attr('id', '');
        });

      }

    }

  };

  Slick.prototype.interrupt = function( toggle ) {

    var _ = this;

    if( !toggle ) {
      _.autoPlay();
    }
    _.interrupted = toggle;

  };

  Slick.prototype.selectHandler = function(event) {

    var _ = this;

    var targetElement =
      $(event.target).is('.slick-slide') ?
        $(event.target) :
        $(event.target).parents('.slick-slide');

    var index = parseInt(targetElement.attr('data-slick-index'));

    if (!index) index = 0;

    if (_.slideCount <= _.options.slidesToShow) {

      _.slideHandler(index, false, true);
      return;

    }

    _.slideHandler(index);

  };

  Slick.prototype.slideHandler = function(index, sync, dontAnimate) {

    var targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null,
      _ = this, navTarget;

    sync = sync || false;

    if (_.animating === true && _.options.waitForAnimate === true) {
      return;
    }

    if (_.options.fade === true && _.currentSlide === index) {
      return;
    }

    if (sync === false) {
      _.asNavFor(index);
    }

    targetSlide = index;
    targetLeft = _.getLeft(targetSlide);
    slideLeft = _.getLeft(_.currentSlide);

    _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;

    if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
      if (_.options.fade === false) {
        targetSlide = _.currentSlide;
        if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
          _.animateSlide(slideLeft, function() {
            _.postSlide(targetSlide);
          });
        } else {
          _.postSlide(targetSlide);
        }
      }
      return;
    } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > (_.slideCount - _.options.slidesToScroll))) {
      if (_.options.fade === false) {
        targetSlide = _.currentSlide;
        if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
          _.animateSlide(slideLeft, function() {
            _.postSlide(targetSlide);
          });
        } else {
          _.postSlide(targetSlide);
        }
      }
      return;
    }

    if ( _.options.autoplay ) {
      clearInterval(_.autoPlayTimer);
    }

    if (targetSlide < 0) {
      if (_.slideCount % _.options.slidesToScroll !== 0) {
        animSlide = _.slideCount - (_.slideCount % _.options.slidesToScroll);
      } else {
        animSlide = _.slideCount + targetSlide;
      }
    } else if (targetSlide >= _.slideCount) {
      if (_.slideCount % _.options.slidesToScroll !== 0) {
        animSlide = 0;
      } else {
        animSlide = targetSlide - _.slideCount;
      }
    } else {
      animSlide = targetSlide;
    }

    _.animating = true;

    _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);

    oldSlide = _.currentSlide;
    _.currentSlide = animSlide;

    _.setSlideClasses(_.currentSlide);

    if ( _.options.asNavFor ) {

      navTarget = _.getNavTarget();
      navTarget = navTarget.slick('getSlick');

      if ( navTarget.slideCount <= navTarget.options.slidesToShow ) {
        navTarget.setSlideClasses(_.currentSlide);
      }

    }

    _.updateDots();
    _.updateArrows();

    if (_.options.fade === true) {
      if (dontAnimate !== true) {

        _.fadeSlideOut(oldSlide);

        _.fadeSlide(animSlide, function() {
          _.postSlide(animSlide);
        });

      } else {
        _.postSlide(animSlide);
      }
      _.animateHeight();
      return;
    }

    if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
      _.animateSlide(targetLeft, function() {
        _.postSlide(animSlide);
      });
    } else {
      _.postSlide(animSlide);
    }

  };

  Slick.prototype.startLoad = function() {

    var _ = this;

    if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

      _.$prevArrow.hide();
      _.$nextArrow.hide();

    }

    if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

      _.$dots.hide();

    }

    _.$slider.addClass('slick-loading');

  };

  Slick.prototype.swipeDirection = function() {

    var xDist, yDist, r, swipeAngle, _ = this;

    xDist = _.touchObject.startX - _.touchObject.curX;
    yDist = _.touchObject.startY - _.touchObject.curY;
    r = Math.atan2(yDist, xDist);

    swipeAngle = Math.round(r * 180 / Math.PI);
    if (swipeAngle < 0) {
      swipeAngle = 360 - Math.abs(swipeAngle);
    }

    if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
      return (_.options.rtl === false ? 'left' : 'right');
    }
    if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
      return (_.options.rtl === false ? 'left' : 'right');
    }
    if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
      return (_.options.rtl === false ? 'right' : 'left');
    }
    if (_.options.verticalSwiping === true) {
      if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
        return 'down';
      } else {
        return 'up';
      }
    }

    return 'vertical';

  };

  Slick.prototype.swipeEnd = function(event) {

    var _ = this,
      slideCount,
      direction;

    _.dragging = false;
    _.swiping = false;

    if (_.scrolling) {
      _.scrolling = false;
      return false;
    }

    _.interrupted = false;
    _.shouldClick = ( _.touchObject.swipeLength > 10 ) ? false : true;

    if ( _.touchObject.curX === undefined ) {
      return false;
    }

    if ( _.touchObject.edgeHit === true ) {
      _.$slider.trigger('edge', [_, _.swipeDirection() ]);
    }

    if ( _.touchObject.swipeLength >= _.touchObject.minSwipe ) {

      direction = _.swipeDirection();

      switch ( direction ) {

        case 'left':
        case 'down':

          slideCount =
            _.options.swipeToSlide ?
              _.checkNavigable( _.currentSlide + _.getSlideCount() ) :
              _.currentSlide + _.getSlideCount();

          _.currentDirection = 0;

          break;

        case 'right':
        case 'up':

          slideCount =
            _.options.swipeToSlide ?
              _.checkNavigable( _.currentSlide - _.getSlideCount() ) :
              _.currentSlide - _.getSlideCount();

          _.currentDirection = 1;

          break;

        default:


      }

      if( direction != 'vertical' ) {

        _.slideHandler( slideCount );
        _.touchObject = {};
        _.$slider.trigger('swipe', [_, direction ]);

      }

    } else {

      if ( _.touchObject.startX !== _.touchObject.curX ) {

        _.slideHandler( _.currentSlide );
        _.touchObject = {};

      }

    }

  };

  Slick.prototype.swipeHandler = function(event) {

    var _ = this;

    if ((_.options.swipe === false) || ('ontouchend' in document && _.options.swipe === false)) {
      return;
    } else if (_.options.draggable === false && event.type.indexOf('mouse') !== -1) {
      return;
    }

    _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ?
      event.originalEvent.touches.length : 1;

    _.touchObject.minSwipe = _.listWidth / _.options
      .touchThreshold;

    if (_.options.verticalSwiping === true) {
      _.touchObject.minSwipe = _.listHeight / _.options
        .touchThreshold;
    }

    switch (event.data.action) {

      case 'start':
        _.swipeStart(event);
        break;

      case 'move':
        _.swipeMove(event);
        break;

      case 'end':
        _.swipeEnd(event);
        break;

    }

  };

  Slick.prototype.swipeMove = function(event) {

    var _ = this,
      edgeWasHit = false,
      curLeft, swipeDirection, swipeLength, positionOffset, touches, verticalSwipeLength;

    touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

    if (!_.dragging || _.scrolling || touches && touches.length !== 1) {
      return false;
    }

    curLeft = _.getLeft(_.currentSlide);

    _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
    _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

    _.touchObject.swipeLength = Math.round(Math.sqrt(
      Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

    verticalSwipeLength = Math.round(Math.sqrt(
      Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));

    if (!_.options.verticalSwiping && !_.swiping && verticalSwipeLength > 4) {
      _.scrolling = true;
      return false;
    }

    if (_.options.verticalSwiping === true) {
      _.touchObject.swipeLength = verticalSwipeLength;
    }

    swipeDirection = _.swipeDirection();

    if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
      _.swiping = true;
      event.preventDefault();
    }

    positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
    if (_.options.verticalSwiping === true) {
      positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
    }


    swipeLength = _.touchObject.swipeLength;

    _.touchObject.edgeHit = false;

    if (_.options.infinite === false) {
      if ((_.currentSlide === 0 && swipeDirection === 'right') || (_.currentSlide >= _.getDotCount() && swipeDirection === 'left')) {
        swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
        _.touchObject.edgeHit = true;
      }
    }

    if (_.options.vertical === false) {
      _.swipeLeft = curLeft + swipeLength * positionOffset;
    } else {
      _.swipeLeft = curLeft + (swipeLength * (_.$list.height() / _.listWidth)) * positionOffset;
    }
    if (_.options.verticalSwiping === true) {
      _.swipeLeft = curLeft + swipeLength * positionOffset;
    }

    if (_.options.fade === true || _.options.touchMove === false) {
      return false;
    }

    if (_.animating === true) {
      _.swipeLeft = null;
      return false;
    }

    _.setCSS(_.swipeLeft);

  };

  Slick.prototype.swipeStart = function(event) {

    var _ = this,
      touches;

    _.interrupted = true;

    if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
      _.touchObject = {};
      return false;
    }

    if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
      touches = event.originalEvent.touches[0];
    }

    _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
    _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

    _.dragging = true;

  };

  Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {

    var _ = this;

    if (_.$slidesCache !== null) {

      _.unload();

      _.$slideTrack.children(this.options.slide).detach();

      _.$slidesCache.appendTo(_.$slideTrack);

      _.reinit();

    }

  };

  Slick.prototype.unload = function() {

    var _ = this;

    $('.slick-cloned', _.$slider).remove();

    if (_.$dots) {
      _.$dots.remove();
    }

    if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
      _.$prevArrow.remove();
    }

    if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
      _.$nextArrow.remove();
    }

    _.$slides
      .removeClass('slick-slide slick-active slick-visible slick-current')
      .attr('aria-hidden', 'true')
      .css('width', '');

  };

  Slick.prototype.unslick = function(fromBreakpoint) {

    var _ = this;
    _.$slider.trigger('unslick', [_, fromBreakpoint]);
    _.destroy();

  };

  Slick.prototype.updateArrows = function() {

    var _ = this,
      centerOffset;

    centerOffset = Math.floor(_.options.slidesToShow / 2);

    if ( _.options.arrows === true &&
      _.slideCount > _.options.slidesToShow &&
      !_.options.infinite ) {

      _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
      _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

      if (_.currentSlide === 0) {

        _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
        _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

      } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {

        _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
        _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

      } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {

        _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
        _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

      }

    }

  };

  Slick.prototype.updateDots = function() {

    var _ = this;

    if (_.$dots !== null) {

      _.$dots
        .find('li')
        .removeClass('slick-active')
        .end();

      _.$dots
        .find('li')
        .eq(Math.floor(_.currentSlide / _.options.slidesToScroll))
        .addClass('slick-active');

    }

  };

  Slick.prototype.visibility = function() {

    var _ = this;

    if ( _.options.autoplay ) {

      if ( document[_.hidden] ) {

        _.interrupted = true;

      } else {

        _.interrupted = false;

      }

    }

  };

  $.fn.slick = function() {
    var _ = this,
      opt = arguments[0],
      args = Array.prototype.slice.call(arguments, 1),
      l = _.length,
      i,
      ret;
    for (i = 0; i < l; i++) {
      if (typeof opt == 'object' || typeof opt == 'undefined')
        _[i].slick = new Slick(_[i], opt);
      else
        ret = _[i].slick[opt].apply(_[i].slick, args);
      if (typeof ret != 'undefined') return ret;
    }
    return _;
  };

}));

// SVG4EVERYBODY

!function(root, factory) {
  "function" == typeof define && define.amd ? // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function() {
      return root.svg4everybody = factory();
    }) : "object" == typeof module && module.exports ? // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory() : root.svg4everybody = factory();
}(this, function() {
  /*! svg4everybody v2.1.9 | github.com/jonathantneal/svg4everybody */
  function embed(parent, svg, target, use) {
    // if the target exists
    if (target) {
      // create a document fragment to hold the contents of the target
      var fragment = document.createDocumentFragment(), viewBox = !svg.hasAttribute("viewBox") && target.getAttribute("viewBox");
      // conditionally set the viewBox on the svg
      viewBox && svg.setAttribute("viewBox", viewBox);
      // copy the contents of the clone into the fragment
      for (// clone the target
        var clone = document.importNode ? document.importNode(target, !0) : target.cloneNode(!0), g = document.createElementNS(svg.namespaceURI || "http://www.w3.org/2000/svg", "g"); clone.childNodes.length; ) {
        g.appendChild(clone.firstChild);
      }
      if (use) {
        for (var i = 0; use.attributes.length > i; i++) {
          var attr = use.attributes[i];
          "xlink:href" !== attr.name && "href" !== attr.name && g.setAttribute(attr.name, attr.value);
        }
      }
      fragment.appendChild(g), // append the fragment into the svg
        parent.appendChild(fragment);
    }
  }
  function loadreadystatechange(xhr, use) {
    // listen to changes in the request
    xhr.onreadystatechange = function() {
      // if the request is ready
      if (4 === xhr.readyState) {
        // get the cached html document
        var cachedDocument = xhr._cachedDocument;
        // ensure the cached html document based on the xhr response
        cachedDocument || (cachedDocument = xhr._cachedDocument = document.implementation.createHTMLDocument(""),
          cachedDocument.body.innerHTML = xhr.responseText, // ensure domains are the same, otherwise we'll have issues appending the
          // element in IE 11
        cachedDocument.domain !== document.domain && (cachedDocument.domain = document.domain),
          xhr._cachedTarget = {}), // clear the xhr embeds list and embed each item
          xhr._embeds.splice(0).map(function(item) {
            // get the cached target
            var target = xhr._cachedTarget[item.id];
            // ensure the cached target
            target || (target = xhr._cachedTarget[item.id] = cachedDocument.getElementById(item.id)),
              // embed the target into the svg
              embed(item.parent, item.svg, target, use);
          });
      }
    }, // test the ready state change immediately
      xhr.onreadystatechange();
  }
  function svg4everybody(rawopts) {
    function oninterval() {
      // if all <use>s in the array are being bypassed, don't proceed.
      if (numberOfSvgUseElementsToBypass && uses.length - numberOfSvgUseElementsToBypass <= 0) {
        return void requestAnimationFrame(oninterval, 67);
      }
      // if there are <use>s to process, proceed.
      // reset the bypass counter, since the counter will be incremented for every bypassed element,
      // even ones that were counted before.
      numberOfSvgUseElementsToBypass = 0;
      // while the index exists in the live <use> collection
      for (// get the cached <use> index
        var index = 0; index < uses.length; ) {
        // get the current <use>
        var use = uses[index], parent = use.parentNode, svg = getSVGAncestor(parent), src = use.getAttribute("xlink:href") || use.getAttribute("href");
        if (!src && opts.attributeName && (src = use.getAttribute(opts.attributeName)),
        svg && src) {
          if (polyfill) {
            if (!opts.validate || opts.validate(src, svg, use)) {
              // remove the <use> element
              parent.removeChild(use);
              // parse the src and get the url and id
              var srcSplit = src.split("#"), url = srcSplit.shift(), id = srcSplit.join("#");
              // if the link is external
              if (url.length) {
                // get the cached xhr request
                var xhr = requests[url];
                // ensure the xhr request exists
                xhr || (xhr = requests[url] = new XMLHttpRequest(), xhr.open("GET", url), xhr.send(),
                  xhr._embeds = []), // add the svg and id as an item to the xhr embeds list
                  xhr._embeds.push({
                    parent: parent,
                    svg: svg,
                    id: id
                  }), // prepare the xhr ready state change event
                  loadreadystatechange(xhr, use);
              } else {
                // embed the local id into the svg
                embed(parent, svg, document.getElementById(id), use);
              }
            } else {
              // increase the index when the previous value was not "valid"
              ++index, ++numberOfSvgUseElementsToBypass;
            }
          }
        } else {
          // increase the index when the previous value was not "valid"
          ++index;
        }
      }
      // continue the interval
      requestAnimationFrame(oninterval, 67);
    }
    var polyfill, opts = Object(rawopts), newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/, webkitUA = /\bAppleWebKit\/(\d+)\b/, olderEdgeUA = /\bEdge\/12\.(\d+)\b/, edgeUA = /\bEdge\/.(\d+)\b/, inIframe = window.top !== window.self;
    polyfill = "polyfill" in opts ? opts.polyfill : newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537 || edgeUA.test(navigator.userAgent) && inIframe;
    // create xhr requests object
    var requests = {}, requestAnimationFrame = window.requestAnimationFrame || setTimeout, uses = document.getElementsByTagName("use"), numberOfSvgUseElementsToBypass = 0;
    // conditionally start the interval if the polyfill is active
    polyfill && oninterval();
  }
  function getSVGAncestor(node) {
    for (var svg = node; "svg" !== svg.nodeName.toLowerCase() && (svg = svg.parentNode); ) {}
    return svg;
  }
  return svg4everybody;
});

/*
	Main code
*/

$(document).ready(function() {
  $('.main-header--open').removeClass('main-header--open');
  $('.slider').removeClass('slider--nojs');
  $('.main-header__login').modaal({
    background: '#FFFFFF',
    overlay_opacity: 1
    }
  );
  $('.product__add').modaal({
    content_source: '#modal-basket',
    background: '#1D1613',
    overlay_opacity: 0.25
  });
  $('.main__filters-btn').modaal({
    content_source: '.filters',
    hide_close: true
  });
  $('.slider__wrapper').on('init', function(event, slick) {
    $(this).append('<div class="slick-dots-mobile"><p><span id="current">1</span> of <span id="total">'+ slick.slideCount +'</span></p></div>');
  });
  $('.slider__wrapper').slick({
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 4,
    prevArrow: '.slider__btn--left',
    nextArrow: '.slider__btn--right',
    dots: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: true,
        }
      },
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: true,
          dots: false
        }
      }
    ]
  });
  $('.slider__wrapper').on('afterChange', function(event, slick, currentSlide, nextSlide){
    $('.slick-dots-mobile #current').html(currentSlide + 1);
  });
  $('.questions__item').click(function() {
    $(this).toggleClass('questions__item--open');
    $(this).children('p').slideToggle();
    return false;
  }).children('p').hide();
  $('.filters h2').click(function() {
    $(this).parent().toggleClass('filters__box--open');
    $(this).next('.filters__list').slideToggle();
    return false;
  }).next('.filters__list').hide();
  $('.filters__box--product .filters__list').show();
  $('.filters__box--price .filters__slider').show();
  $('.main-header__button-burger').click(function () {
    $('.main-header').toggleClass('main-header--open');
    $('.main-header').toggleClass('main-header--js');
    $('body').toggleClass('overflow-hidden');
  });
});
