/**
 * Main JS file for Scriptor behaviours
 */

/*globals jQuery, document */
(function ($) {
	"use strict";

	var $body = $('body'),
		$searchField = $('#search-field'),
		$searchResults = $('#search-results'),
		$searchCount = $('.results-count');

	$(document).ready(function(){

		// Responsive video embeds
		$('.post-content').fitVids();

		// Scroll to content
		$('.scroll-down').on('click', function(e) {
			var $cover = $(this).closest('.cover');
			$('html, body').animate({
				scrollTop: $cover.position().top + $cover.height()
			}, 800 );
			e.preventDefault();
		});

		// Scroll to top
		$('.top-link').on('click', function(e) {
			$('html, body').animate({
				'scrollTop': 0
			});
			e.preventDefault();
		});

		// Header adjustments
		adjustCover();
		var lazyResize = debounce(adjustCover, 200, false);
		$(window).resize(lazyResize);

		// Initialize featured posts slider
		var $featSlider = $('#featured-slider'),
			$featCounter = $featSlider.next('.featured-counter');

		$featSlider.on('init reInit', function(event, slick, currentSlide, nextSlide){
			var current = (currentSlide ? currentSlide : 0) + 1;
			$featCounter.find('.total').text(slick.slideCount);
			$featCounter.find('.current').text(current);
		});

		$featSlider.on('beforeChange', function(event, slick, currentSlide, nextSlide){
			$featCounter.find('.current').text(nextSlide + 1);
		});

		$featSlider.slick({
			autoplay: true,
			arrows : true,
			dots : false,
			fade : true,
			prevArrow : '<button type="button" class="slick-prev square"><span class="icon-left-custom" aria-hidden="true"></span><span class="screen-reader-text">Previous</span></button>',
			nextArrow : '<button type="button" class="slick-next square"><span class="icon-right-custom" aria-hidden="true"></span><span class="screen-reader-text">Next</span></button>',
		});

		$featSlider.fadeIn(600, function(){
			$(this).parent().removeClass('slider-loading');
		});

		// Gallery adjustments
		$('.kg-gallery-image > img').each( function() {
			var _this = $(this),
				$container = _this.closest('.kg-gallery-image'),
				width = _this.attr('width'),
				height = _this.attr('height'),
				ratio = width / height;
			_this.wrap("<a href='" + _this.attr("src") + "' />");
			$container.css({'flex' : ratio + ' 1 0%' });
		});

		$('.kg-gallery-card').each( function() {
			var _this = $(this);
			_this.find('a').simpleLightbox({
				captions: false,
				closeText: '<span aria-hidden="true" class="icon-close-custom"></span>',
				navText: ['<span class="icon-left-custom" aria-hidden="true"></span>','<span class="icon-right-custom" aria-hidden="true"></span>']
			});
		});

		// Hidden sections
		$('.sidebar-toggle').on('click', function(e){
			$body.toggleClass('sidebar-opened');
			e.preventDefault();
		});
		$('.search-toggle').on('click', function(e){
			if ( $body.hasClass('search-opened') ) {
				$body.removeClass('search-opened');
				$searchField.val('');
				$searchResults.html('');
				$searchCount.text('0');
			} else {
				$body.addClass('search-opened');
				setTimeout(function() {
					$searchField.focus();
				}, 300);
			}
			e.preventDefault();
		});
		$('.overlay').on('click', function(e){
			$body.removeClass('sidebar-opened search-opened');
			searchField.clear();
			e.preventDefault();
		});

		// Site search
		let ghostSearch = new JustGoodSearch({
			key: search_key,
			host: search_host,
			input: '#search-field',
			results: '#search-results',
			template: function(result) {
				let url = [location.protocol, '//', location.host].join('');
				let pubDate = new Date(result.published_at).toLocaleDateString(document.documentElement.lang, {year: "numeric",month: "long",day: "numeric"});
				return '<div class="result-item"><a href="' + url + '/' + result.slug + '/"><div class="result-title">' + result.title + '</div><div class="result-date">' + pubDate + '</div></a>';
			},
			options: {
				keys: [
					'title',
					'plaintext'
				],
			},
			api: {
				resource: 'posts',
				parameters: {
					fields: ['title', 'slug', 'plaintext', 'published_at'],
					formats: 'plaintext',
				},
			},
			on: {
				afterDisplay: function(results){
					$searchCount.text(results.length);
				},
			}
		});

		// Show comments
		if ( typeof disqus_shortname !== 'undefined' ) {
			var disqus_loaded = false;
			$('.comments-title').on('click', function() {
				var _this = $(this);
				if ( ! disqus_loaded ) {
					$.ajax({
						type: "GET",
						url: "//" + disqus_shortname + ".disqus.com/embed.js",
						dataType: "script",
						cache: true
					});
					_this.addClass('toggled-on');
					disqus_loaded = true;
				} else {
					$('#disqus_thread').slideToggle();
					if ( _this.hasClass('toggled-on') ) {
						_this.removeClass('toggled-on');
					} else {
						_this.addClass('toggled-on');
					}
				}
			});
		}

		// Display Instagram feed
		if ( typeof instagram_user_id !== 'undefined' && typeof instagram_access_token !== 'undefined' ) {
			if ( $('#instafeed').length ) {
				var userFeed = new Instafeed({
					get: 'user',
					userId: instagram_user_id,
					accessToken: instagram_access_token,
					limit: 6,
					resolution: 'low_resolution',
					template: '<div class="instagram-item"><div class="instagram-item-inside"><a target="_blank" href="{{link}}"><img src="{{image}}" alt="{{caption}}" /></a></div></div>'
				});
				userFeed.run();
			}
		}
	});

	function adjustCover() {
		setElementHeight('.post-header.cover');
	}

	// Set the new height of an element
	function setElementHeight(element){
		var windowHeight = ( true===isiPod() && true===isSafari() ) ? window.screen.availHeight : $(window).height();
		var offsetHeight = $('.site-header').outerHeight();
		var newHeight = windowHeight;
		if ( $(element).find('.scroll-down').is(':hidden') ) {
			$(element).removeAttr('style');
			$(element).find('.cover-bg').css('top','');
		}
		else {
			$(element).outerHeight(newHeight);
			$(element).find('.cover-bg').css('top',offsetHeight);
		}
	}

	// Throttles an action.
	// Taken from Underscore.js.
	function debounce (func, wait, immediate) {
		var timeout, args, context, timestamp, result;
		return function() {
			context = this;
			args = arguments;
			timestamp = new Date();
			var later = function() {
				var last = (new Date()) - timestamp;
				if (last < wait) {
					timeout = setTimeout(later, wait - last);
				} else {
					timeout = null;
					if (!immediate) {
						result = func.apply(context, args);
					}
				}
			};
			var callNow = immediate && !timeout;
			if (!timeout) {
				timeout = setTimeout(later, wait);
			}
			if (callNow) {
				result = func.apply(context, args);
			}
			return result;
		};
	}

	// Check if device is an iPhone or iPod
	function isiPod(){
		return(/(iPhone|iPod)/g).test(navigator.userAgent);
	}

	// Check if browser is Safari
	function isSafari(){
		return(-1!==navigator.userAgent.indexOf('Safari')&&-1===navigator.userAgent.indexOf('Chrome'));
	}

}(jQuery));
