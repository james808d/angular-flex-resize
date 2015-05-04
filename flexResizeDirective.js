'use strict';

angular.module('flexResize')

	.controller('flexResizeController', [ '$scope', '$element', function($scope, $element) {
		var control = this;
		this.activeResize = null;
		this.init = true;
		this.snapDistance = 20;
		this.dividerSize = 6;
		this.setSize = null;
		this.activePane = null;
		this.containers = [];
		this.sizeProperties = { sizeProperty: 'width', offsetSize: 'offsetWidth', offsetPos: 'left', flowProperty: 'left', oppositeFlowProperty: 'right', mouseProperty: 'clientX', flowPropertyPosition: 'x' };


		var animationFrameRequested;
		var lastPos;

		this.mouseMoveHandler = function(mouseEvent) {

			control.mousePos = mouseEvent[this.sizeProperties.mouseProperty] ||
				(mouseEvent.originalEvent && mouseEvent.originalEvent[this.sizeProperties.mouseProperty]) ||
				(mouseEvent.targetTouches ? mouseEvent.targetTouches[0][this.sizeProperties.mouseProperty] : 0);


			control.lastPos = control.mousePos - offset($element)[this.sizeProperties.offsetPos];

			//Cancel previous rAF call
			if(animationFrameRequested) {
				window.cancelAnimationFrame(animationFrameRequested);
			}

			//TODO: cache layout values

			//Animate the page outside the event
			animationFrameRequested = window.requestAnimationFrame(resize);
		};

		this.addContainer = function(container) {
			this.containers.push(container);
			console.info(this.containers);
		}

		function offset(element) {
			var rawDomNode = element[0];
			var body = document.documentElement || document.body;
			var scrollX = window.pageXOffset || body.scrollLeft;
			var scrollY = window.pageYOffset || body.scrollTop;
			var clientRect = rawDomNode.getBoundingClientRect();
			var x = clientRect.left + scrollX;
			var y = clientRect.top + scrollY;
			return { left: x, top: y };
		}

		function resize() {

			console.info("mousePos: ", control.mousePos);
			console.info("lastPos: ", control.lastPos);


			if(control.setSize) {
				control.lastPos = control.setSize;
			}
			if(control.setSize === 0) {
				control.lastPos = control.setSize;
			}

			if(control.init) {
				_.each(control.containers, function(c){ c.initialSize = c.element.width(); } );
				control.init = false;
			}

			// get parent element to resize ... just hacking this for now becuase i know there is only container
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

			control.setSize = null;
			animationFrameRequested = null;
		}


		$scope.togglePane = function(pane) {

			if(control.activePane === null) {
				control.activePane = pane;
			}

			if(control.containers[0].collapsed ) {
				control.setSize = 384;
				control.activePane = pane;
				resize();
				return;
			}

			if (!control.containers[0].collapsed && control.activePane === pane) {
				control.activePane = null;
				control.setSize = 0;
				resize();
				return;
			}

			control.activePane = pane

		}

		return control;
	}])

	.directive('flexResize', [ function() {

		return {
			restrict: 'EA',
			controller: 'flexResizeController',
			link: function($scope, element, attrs, control) {

			}
		}
	}])

	.directive('flexResizeArea', [ function() {
		return {
			restrict: 'EA',
			require: '^flexResize',
			scope: {},
			compile: function(element) {

				//TODO: check if element is last element

				var resizeBar = angular.element('<flex-resize-bar></flex-resize-bar>');
				element.append(resizeBar);

				return {
					pre: function($scope, element, attrs, control) {
						$scope.container = {
							width: null,
							initialSize:  null,
							locked: null,
							collapsed: attrs.collapsed || false,
							element: element
						};
						$scope.init = true;
						control.addContainer($scope.container);

					},
					post: function($scope, element, attrs, control) {
						$scope.$watch('container.width', function(newValue) {
							element.css('flex-basis', newValue + 'px');
						});
					}
				}
			}/*,
			link: function($scope, $element) {
				// set initial size here?
				console.info("width: $element.width(): ", $element.width());



				$scope.getElementDimensions = function() {
					return { 'h': $element.height(), 'w': $element.width() };
				}

				$scope.$watch($scope.getElementDimensions.w, function (newValue, oldValue) {
					console.info("newValue: ", newValue);

					if ($scope.init) {
						$scope.container.initialSize = newValue;
						$scope.init = false;
						console.info($scope.container);
					}

				}, true);

				$element.bind('resize', function () {
					$scope.$apply();
				});
			}*/
		}
	}])

	.directive('flexResizeBar', [ function() {
		return {
			restrict: 'EAC',
			require: '^flexResize',
			scope: {},
			link: function(scope, element, attrs, control) {
				console.log('flexResizeBar element: ', element);
				console.log('flexResizeBar element.children(): ', element.children());

				var root = angular.element(document.body.parentElement);


				element.on('mousedown touchstart', function(event) {
					control.activeResize = element;
					event.preventDefault();
					event.stopPropagation();

					root.on('mousemove touchmove', function(event) {
						scope.$apply(angular.bind(control, control.mouseMoveHandler, event));
					});
					return false;
				})

				root.on('mouseup touchend', function(event) {
					scope.$apply(angular.bind(control, control.mouseUpHandler, event));
					root.off('mousemove touchmove');
				});
			}
		}
	}])