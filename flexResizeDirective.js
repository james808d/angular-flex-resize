'use strict';

angular.module('flexResize')

	.controller('flexResizeController', [ '$scope', '$element', '$log', function($scope, $element, $log) {
		var control = this;
		this.activeResize = null;
		this.init = true;
		this.snapDistance = 20;
		this.dividerSize = 6;
		this.setSize = null;
		this.activePane = null;
		this.container = {};

		$log.debug($element);

		this.flex_resize_position = $element.attr('resize');

		if(this.vertical) {
			this.sizeProperties = { sizeProperty: 'height', offsetSize: 'offsetHeight', offsetPos: 'top', mouseProperty: 'clientY'};
		}

		if(this.flex_resize_position === 'right') {
			this.sizeProperties = { sizeProperty: 'width', offsetSize: 'offsetWidth', offsetPos: 'left', direction:'left', mouseProperty: 'clientX'};
		} else {
			this.sizeProperties = { sizeProperty: 'width', offsetSize: 'offsetWidth', offsetPos: 'left', direction:'right', mouseProperty: 'clientX'};
		}

		$log.debug("this.sizeProperties: ", this.sizeProperties);

		var animationFrameRequested;
		var lastPos;

		this.mouseMoveHandler = function(mouseEvent) {

			$log.debug("##################");
			$log.debug("mousePos: ", control.mousePos);
			$log.debug("offset: ", offset($element)[this.sizeProperties.offsetPos]);
			$log.debug("lastPos: ", control.mousePos - offset($element)[this.sizeProperties.offsetPos]);
			$log.debug("##################");

			control.mousePos = mouseEvent[this.sizeProperties.mouseProperty] ||
				(mouseEvent.originalEvent && mouseEvent.originalEvent[this.sizeProperties.mouseProperty]) ||
				(mouseEvent.targetTouches ? mouseEvent.targetTouches[0][this.sizeProperties.mouseProperty] : 0);


			control.lastPos = control.mousePos - offset($element)[this.sizeProperties.offsetPos];

			//Cancel previous rAF call
			if(animationFrameRequested) {
				window.cancelAnimationFrame(animationFrameRequested);
			}

			//Animate the page outside the event
			animationFrameRequested = window.requestAnimationFrame(resize);
		};

		this.addContainer = function(container) {
			this.container = container;
			$log.debug(this.container);
		};

		function offset(element) {
			var rawDomNode = element[0];
			var body = document.documentElement || document.body;
			var scrollX = window.pageXOffset || body.scrollLeft;
			var scrollY = window.pageYOffset || body.scrollTop;
			var clientRect = rawDomNode.getBoundingClientRect();
			var x = clientRect.left + scrollX;
			var y = clientRect.top + scrollY;
			return { left: x, top: y, right: x + element.width() };
		}

		function resize() {

			var direction = control.sizeProperties.direction;

			if(control.setSize || control.setSize === 0) {

				if(direction === 'left') {
					control.lastPos = control.setSize;
				} else {
					control.lastPos = window.innerWidth - control.setSize;
				}


				control.container.element.addClass('animate');
			} else {
				control.container.element.removeClass('animate')
			}


			if(control.init) {
				control.container.initialSize = control.container.element.width();
				control.init = false;
			}


			if(direction === 'left') {
				if(control.lastPos > control.container.initialSize) {

					// check for max window size
					if(control.lastPos >= window.innerWidth - control.dividerSize) {
						control.container.element.css('flex-basis', window.innerWidth + 'px');
					} else {
						control.container.element.css('flex-basis', control.lastPos + 'px');
					}

					control.container.collapsed = false;
				}

				// snap closed when its close
				if((control.lastPos - control.container.initialSize) < control.snapDistance) {
					control.container.element.css('flex-basis', control.container.initialSize + 'px');
					control.container.collapsed = true;
				}
			}

			if(direction === 'right') {

				$log.debug("Right initial size: ", control.container.initialSize);

				if(control.lastPos < window.innerWidth - control.container.initialSize) {

					// check for max window size
					if((control.lastPos >= window.innerWidth - control.dividerSize) && (control.lastPos > 54)) {
						control.container.element.css('flex-basis', window.innerWidth + 'px');
					} else {
						control.container.element.css('flex-basis', ((window.innerWidth - control.lastPos) - control.container.initialSize) + 'px');
					}

					control.container.collapsed = false;
				}

				// snap closed when its close and fix minimum size
				if(((window.innerWidth - control.lastPos) - control.container.initialSize) < control.snapDistance + control.container.initialSize) {
					control.container.element.css('flex-basis', control.container.initialSize + 'px');
					control.container.collapsed = true;
				}
			}

			control.setSize = null;
			animationFrameRequested = null;
		}


		$scope.togglePane = function(pane) {

			var direction = control.sizeProperties.direction;

			if(control.activePane === null) {
				control.activePane = pane;
			}

			if(control.container.collapsed && direction === 'left') {
				control.setSize = 384;
				control.activePane = pane;
				resize();
				return;
			}

			if(control.container.collapsed && direction === 'right') {
				control.setSize = 512;
				control.activePane = pane;
				resize();
				return;
			}

			if (!control.container.collapsed && control.activePane === pane) {
				control.activePane = null;
				control.setSize = 0;
				control.container.collapsed = true;
				resize();
				return;
			}

			control.activePane = pane

		}

		return control;
	}])

	.directive('flexResize', [ '$log', function($log) {

		return {
			restrict: 'EA',
			controller: 'flexResizeController',
			link: function($scope, element, attrs, control) {
				$log.debug(
					"$scope: ", $scope,
					"\n element: ", element,
					"\n attrs: ", attrs,
					"\n control: ", control
				);

				element.addClass('flex-columns');

				control.flex_resize_position = attrs.position;
				control.flex_resize_type = attrs.type;


			}
		}
	}])

	.directive('flexResizeArea', [ function() {
		return {
			restrict: 'EA',
			require: '^flexResize',
			scope: {},
			compile: function(element, attrs) {

				var resizeBar = angular.element('<flex-resize-bar></flex-resize-bar>');

				if(attrs.resize === 'left') {
					element.addClass('flex-resize-bar-left');
					element.prepend(resizeBar);
				} else {
					element.addClass('flex-resize-bar-right');
					element.append(resizeBar);
				}

				return {
					pre: function($scope, element, attrs, control) {
						var container = {
							width: null,
							initialSize:  null,
							locked: null,
							collapsed: attrs.collapsed || false,
							element: element
						};

						if (attrs.collapsed) {
							$scope.collapsed = true;
						}

						control.addContainer(container);

					},
					post: function($scope, element, attrs, control) {
						$scope.$watch('container.width', function(newValue) {
							element.css('flex-basis', newValue + 'px');
							$scope.container = element;
						});
						$scope.$watch('container.collapsed', function(newValue) {
							$scope.collapsed = element.collapsed;
						});
					}
				}
			}
		}
	}])

	.directive('flexResizeBar', [ '$log', function($log) {
		return {
			restrict: 'EAC',
			require: '^flexResize',
			scope: {},
			link: function($scope, $element, attrs, control) {
				$log.debug('flexResizeBar element: ', $element);
				$log.debug('flexResizeBar element.children(): ', $element.children());

				var root = angular.element(document.body.parentElement);


				$element.on('mousedown touchstart', function(event) {
					control.activeResize = $element;
					event.preventDefault();
					event.stopPropagation();

					root.on('mousemove touchmove', function(event) {
						$scope.$apply(angular.bind(control, control.mouseMoveHandler, event));
					});
					return false;
				});

				root.on('mouseup touchend', function(event) {
					$scope.$apply(angular.bind(control, control.mouseUpHandler, event));
					root.off('mousemove touchmove');
				});
			}
		}
	}]);