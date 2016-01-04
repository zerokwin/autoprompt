'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

;(function ($) {

	if (typeof $ === 'undefined') {
		throw new Error('Autoprompt requires jQuery!');
	}

	// String对象includes方法兼容处理
	// Array对象filter方法兼容处理
	(function () {
		if (!String.prototype.includes) {
			String.prototype.includes = function () {
				'use strict';

				return String.prototype.indexOf.apply(this, arguments) !== -1;
			};
		}

		if (!Array.prototype.filter) {
			Array.prototype.filter = function (fun) {
				var len = this.length;
				if (typeof fun != "function") throw new TypeError();
				var res = [];
				var thisp = arguments[1];
				for (var i = 0; i < len; i++) {
					if (i in this) {
						var val = this[i];
						if (fun.call(thisp, val, i, this)) res.push(val);
					}
				}
				return res;
			};
		}
	})();

	var defaults = {
		minLength: 1,
		itemLength: 8,
		timeout: 100,
		appendTo: 'body'
	};

	var Autoprompt = function Autoprompt($elem, src, opts) {
		this.$elem = $elem;
		this.init(src, opts);
	};

	$.fn.autoprompt = function (src, opts) {
		return new Autoprompt($(this), src, opts);
	};

	Autoprompt.prototype = {
		init: function init(src, opts) {
			this.opts = $.extend({}, defaults, opts);
			this.$appendTo = $(this.opts.appendTo);
			this.src = src;
			this.css = 'position: absolute;z-index: 99999;top: ' + (this.$elem.offset().top + this.$elem.height() + parseInt(this.$elem.css('paddingTop')) * 2 - this.$appendTo.offset().top) + 'px;left: ' + (this.$elem.offset().left - this.$appendTo.offset().left) + 'px;width: ' + (this.$elem.width() + parseInt(this.$elem.css('paddingLeft')) + parseInt(this.$elem.css('paddingRight')) + 2) + 'px;';
			this.index = -1;
			this.getData(this.src);
			this.create();
			this.changeListener();
		},
		create: function create() {
			this.$appendTo.css('position', 'relative').append('<div class="autoprompt" style="' + this.css + 'display: none;"><ul></ul></div>');
			this.$autoprompt = $('.autoprompt');
		},
		render: function render(data) {
			var li = '',
			    len = data.length > this.opts.itemLength ? this.opts.itemLength : data.length;

			for (var i = 0; i < len; i++) {
				data[i] = _typeof(data[i]) === 'object' ? data[i].value : data[i];
				li += '<li data-model="' + data[i] + '">' + data[i] + '</li>';
			}

			if (li === '') {
				this.clean();
			} else {
				this.$autoprompt.css('display', 'block').find('ul').empty().append('' + li);
			}

			this.removeEvent();
			this.bindEvent(len);
		},
		clean: function clean() {
			this.$autoprompt.css('display', 'none');
		},
		filter: function filter(kw) {
			var data = [];

			if (!kw) {
				this.clean();
				return;
			}

			data = this.data.filter(function (item) {
				return item.value.toLowerCase().includes(kw);
			});

			if (data.length === 0) {
				var kw = kw.match(/\d+/);

				if (!kw) return;
				data = this.data.filter(function (item) {
					return item.value.includes(kw);
				});
			}

			this.render(data);
		},
		getData: function getData(src) {
			var that = this;

			if (typeof src === 'string' && src.length > 0) {
				$.ajax({
					url: src,
					type: 'get',
					dataType: 'json',
					success: function success(data) {
						that.data = data;
					}
				});
			}
		},
		changeListener: function changeListener() {
			var that = this,
			    userAgent = navigator.userAgent.toLowerCase();

			if (userAgent.includes("ie 8.0") || userAgent.includes("ie 9.0")) {
				that.$elem.on('keyup', function () {
					var kw = $(this).val().toLowerCase();

					that.index = -1;
					that.filter(kw);
				});
			} else {
				that.$elem.on('input', function () {
					var kw = $(this).val().toLowerCase();

					that.index = -1;
					that.filter(kw);
				});
			}
		},
		bindEvent: function bindEvent(length) {
			var that = this,
			    userAgent = navigator.userAgent.toLowerCase();

			if (userAgent.includes("ie 8.0") || userAgent.includes("ie 9.0")) {
				that.$elem.on('keydown keyup', function (e) {
					switch (e.keyCode) {
						case 40:
							if (e.type === 'keydown') {
								e.preventDefault();
							} else if (e.type === 'keyup') {
								that.index = that.index === length - 1 ? 0 : that.index + 1;
								turnTo(that.index);
							}

							break;
						case 38:
							if (e.type === 'keydown') {
								e.preventDefault();
							} else if (e.type === 'keyup') {
								that.index = that.index === 0 ? length - 1 : that.index - 1;
								turnTo(that.index);
							}

							break;
						case 13:
							if (e.type === 'keydown') {
								if (that.$autoprompt.css('display') !== 'none') {
									e.preventDefault();
								}
							} else if (e.type === 'keyup') {
								if (that.$autoprompt.css('display') !== 'none') {
									e.preventDefault();

									var value = $('.autoprompt li:eq(' + that.index + ')').data('model');

									$(this).val(value);
									that.$autoprompt.css('display', 'none');
								}
							}
							break;
					}
				});
			} else {
				that.$elem.on('keydown', function (e) {
					switch (e.keyCode) {
						case 40:
							e.preventDefault();

							that.index = that.index === length - 1 ? 0 : that.index + 1;
							turnTo(that.index);
							break;
						case 38:
							e.preventDefault();

							that.index = that.index === 0 ? length - 1 : that.index - 1;
							turnTo(that.index);
							break;
						case 13:
							if (that.$autoprompt.css('display') !== 'none' && $('.autoprompt li').hasClass('hover')) {
								e.preventDefault();

								var value = $('.autoprompt li:eq(' + that.index + ')').data('model');

								$(this).val(value);
								that.$autoprompt.css('display', 'none');
							}
							break;
					}
				});
			}

			that.$autoprompt.on('click', 'li', function () {
				var value = $(this).data('model');

				that.$elem.val(value);
				that.$autoprompt.css('display', 'none');
			}).on('hover', 'li', function () {
				$('.autoprompt li').removeClass('hover');
				$(this).addClass('hover');

				that.index = $(this).index();
			});
		},
		removeEvent: function removeEvent() {
			this.$elem.off('keyup');
			this.$elem.off('keydown');
		}
	};

	function turnTo(index) {
		$('.autoprompt li').removeClass('hover').eq(index).addClass('hover');
	}
})(jQuery);