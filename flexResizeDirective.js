'use strict';

angular.module('flexResize')

	.controller('flexResizeController', [ '$scope', '$element', '$log', '$rootScope', function($scope, $element, $log, $rootScope) {
		var control = this;
		this.activeResize = null;
		this.init = true;
		this.snapDistance = 20;
		this.dividerSize = 6;
		this.setSize = null;
		this.activePane = null;
		this.type = 'horizontal';
		this.outerContainer = {};
		this.containers = [];

		$log.debug($element);

		this.flex_resize_position = $element.attr('resize');

		if(this.flex_resize_position === 'top') {
			this.sizeProperties = { sizeProperty: 'height', offsetSize: 'offsetHeight', offsetPos: 'top', direction:'top', mouseProperty: 'clientY'};
		}

		if(this.flex_resize_position === 'right') {
			this.sizeProperties = { sizeProperty: 'width', offsetSize: 'offsetWidth', offsetPos: 'left', direction:'left', mouseProperty: 'clientX'};
		}

		if(this.flex_resize_position === 'left') {
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
			this.containers.push(container);
			$log.debug(this.containers);
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

				_.each(control.containers, function(container) { container.element.addClass('animate') });

				//control.containers[0].element.addClass('animate');
			} else {

				_.each(control.containers, function(container) { container.element.removeClass('animate') });
				//control.containers[0].element.removeClass('animate')
			}


			if(control.init) {

				if(control.type === 'horizontal') {

					_.each(control.containers, function(container) { container.initialSize = container.element.width(); });

					//control.containers[0].initialSize = control.containers[0].element.width();
				}
				if(control.type === 'vertical') {

					_.each(control.containers, function(container) { container.initialSize = container.element.height(); });

					//control.containers[0].initialSize = control.containers[0].element.height();
				}

				control.init = false;
			}

			if(direction === 'top') {
				$log.debug('top');


				var availableheight = control.outerContainer.height();

				var percentage = control.lastPos / availableheight * 100;

				$log.debug(percentage);

				// check for max window size
				if(control.lastPos >= window.innerHeight - control.dividerSize) {
					control.containers[0].element.css('height','100%');
				} else {
					control.containers[0].element.css('height', percentage + '%');
					control.containers[1].element.css('height', (100 - percentage) + '%');
				}

				control.containers[0].collapsed = false;


				// snap closed when its close
				/*if((control.lastPos - control.containers[0].initialSize) < control.snapDistance) {
					control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
					control.containers[0].collapsed = true;
				}*/

			}


			if(direction === 'left') {
				if(control.lastPos > control.containers[0].initialSize) {

					// check for max window size
					if(control.lastPos >= window.innerWidth - control.dividerSize) {
						control.containers[0].element.css('flex-basis', window.innerWidth + 'px');
					} else {
						control.containers[0].element.css('flex-basis', control.lastPos + 'px');
					}

					control.containers[0].collapsed = false;
				}

				// snap closed when its close
				if((control.lastPos - control.containers[0].initialSize) < control.snapDistance) {
					control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
					control.containers[0].collapsed = true;
				}
			}

			if(direction === 'right') {

				if(control.lastPos < window.innerWidth - control.containers[0].initialSize) {

					// check for max window size
					if((control.lastPos >= window.innerWidth - control.dividerSize) && (control.lastPos > 54)) {
						control.containers[0].element.css('flex-basis', window.innerWidth + 'px');
					} else {
						control.containers[0].element.css('flex-basis', ((window.innerWidth - control.lastPos) - control.containers[0].initialSize) + 'px');
					}

					control.containers[0].collapsed = false;
				}

				// snap closed when its close and fix minimum size
				if(((window.innerWidth - control.lastPos) - control.containers[0].initialSize) < control.snapDistance + control.containers[0].initialSize) {
					control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
					control.containers[0].collapsed = true;
				}
			}

			control.setSize = null;
			animationFrameRequested = null;

			$rootScope.redrawCalendar();
		}


		$scope.togglePane = function(pane) {

			var direction = control.sizeProperties.direction;

			if(control.activePane === null) {
				control.activePane = pane;
			}

			if(control.containers[0].collapsed && direction === 'left') {
				control.setSize = 384;
				control.activePane = pane;
				resize();
				return;
			}

			if(control.containers[0].collapsed && direction === 'right') {
				control.setSize = 512;
				control.activePane = pane;
				resize();
				return;
			}

			if (!control.containers[0].collapsed && control.activePane === pane) {
				control.activePane = null;
				control.setSize = 0;
				control.containers[0].collapsed = true;
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

				if(attrs.resize === 'top') {
					element.addClass('flex-rows');
					control.type = 'vertical';
				} else {
					element.addClass('flex-columns');
				}

				control.outerContainer = element;
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
				}

				if(attrs.resize === 'right') {
					element.addClass('flex-resize-bar-right');
					element.append(resizeBar);
				}

				if(attrs.resize === 'top') {
					element.addClass('flex-resize-bar-bottom');
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

						if (attrs.resize === 'top') {
							control.type = 'vertical';
						}

						control.addContainer(container);

					},
					post: function($scope, element, attrs, control) {

						if(control.type === 'horiztonal') {
							$scope.$watch('container.width', function(newValue) {
								element.css('flex-basis', newValue + 'px');
								$scope.container = element;
							});
							$scope.$watch('container.collapsed', function(newValue) {
								$scope.collapsed = element.collapsed;
							});
						}

						if(control.type === 'vertical') {
							$scope.$watch('container.height', function(newValue) {
								element.css('height', newValue + 'px');
								$scope.container = element;
							});
							$scope.$watch('container.collapsed', function(newValue) {
								$scope.collapsed = element.collapsed;
							});
						}


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