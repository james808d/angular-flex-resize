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
		this.option = null;
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
		var position;

		this.mouseMoveHandler = function(mouseEvent) {
			control.position = mouseEvent[this.sizeProperties.mouseProperty] ||
				(mouseEvent.originalEvent && mouseEvent.originalEvent[this.sizeProperties.mouseProperty]) ||
				(mouseEvent.targetTouches ? mouseEvent.targetTouches[0][this.sizeProperties.mouseProperty] : 0);

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
			var percentage;
			var offset = 0;
			var direction = control.sizeProperties.direction;

			if(control.option === 'nav-panel') {
				offset = '54';
			}

			if(control.setSize || control.setSize === 0) {

				if(direction === 'left') {
					control.position = control.setSize;
				} else {
					control.position = window.innerWidth - control.setSize;
				}
				_.each(control.containers, function(container) { container.element.addClass('animate') });
			} else {
				_.each(control.containers, function(container) { container.element.removeClass('animate') });
			}


			if(control.init) {

				if(control.type === 'horizontal') {
					_.each(control.containers, function(container) { container.initialSize = container.element.width(); });
				}
				if(control.type === 'vertical') {
					_.each(control.containers, function(container) { container.initialSize = container.element.height(); });
				}

				control.init = false;
			}

			if(direction === 'top') {
				$log.debug('top');


				var availableheight = control.outerContainer.height();

				percentage = (control.position - control.outerContainer.offset().top) / availableheight * 100;

				$log.debug("availableheight: ", availableheight);
				$log.debug("control.position: ", control.position);
				$log.debug("percentage: ", percentage);

				// check for max window size
				if(control.position >= (control.outerContainer.height() - control.dividerSize)) {
					control.containers[0].element.css('height','100%');
				} else {
					control.containers[0].element.css('height', percentage + '%');
					control.containers[1].element.css('height', (100 - percentage) + '%');
					$log.debug("percentage: ", percentage);
				}

				control.containers[0].collapsed = false;
				$log.debug("----------------");

				// snap closed when its close
				/*if((control.position - control.containers[0].initialSize) < control.snapDistance) {
					control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
					control.containers[0].collapsed = true;
				}*/

			}


			if(direction === 'left') {

				if(control.option === 'nav-panel') {

					// set size directly
					if(control.position >= (control.outerContainer.width() - control.dividerSize)) {
						control.containers[0].element.css('flex-basis', window.innerWidth + 'px');
					} else {
						control.containers[0].element.css('flex-basis', control.position + 'px');
					}

					control.containers[0].collapsed = false;

					// snap closed when its close
					$log.debug("snap calculation: ", control.position + control.outerContainer.offset().left - offset);
					if((control.position + control.outerContainer.offset().left - offset ) < control.snapDistance) {
						control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
						control.containers[0].collapsed = true;
					}

				} else {

					// set size in percents

					var availableWidth = control.outerContainer.width();

					percentage = (control.position - control.outerContainer.offset().left ) / availableWidth * 100;

					$log.debug("percentage: ", percentage, "offsetLeft: ", control.outerContainer.offset().left, "position: ", control.position, "total width: ",availableWidth );

					// check for max window size
					if(control.position >= (control.outerContainer.width() - control.dividerSize)) {
						control.containers[0].element.css('flex-basis','100%');
					} else {
						control.containers[0].element.css('flex-basis', percentage + '%');
						control.containers[1].element.css('flex-basis', (100 - percentage) + '%');
					}

					control.containers[0].collapsed = false;
				}


			}

			if(direction === 'right') {


				// check for max window size
				if((control.position >= (control.outerContainer.width() - control.dividerSize))) {
					control.containers[0].element.css('flex-basis', window.innerWidth + 'px');
				} else {
					control.containers[0].element.css('flex-basis', (window.innerWidth - control.position) + 'px');
				}

				control.containers[0].collapsed = false;


				// snap closed when its close and fix minimum size
				if(((window.innerWidth - control.position) - control.containers[0].initialSize) < control.snapDistance ) {
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
				$scope.collapsed = control.containers[0].collapsed;
				$scope.showOptions = false;
				$log.debug("$scope.collapsed: ",$scope.collapsed);
				return;
			}

			if(control.containers[0].collapsed && direction === 'right') {
				control.setSize = 512;
				control.activePane = pane;
				resize();
				$scope.collapsed = control.containers[0].collapsed;
				$scope.showOptions = false;
				$log.debug("$scope.collapsed: ",$scope.collapsed);
				return;
			}

			if (!control.containers[0].collapsed && control.activePane === pane) {
				control.activePane = null;
				control.setSize = 0;
				control.containers[0].collapsed = true;
				resize();
				$scope.collapsed = control.containers[0].collapsed;
				$scope.showOptions = false;
				$log.debug("$scope.collapsed: ",$scope.collapsed);
				return;
			}

			control.activePane = pane
			$scope.collapsed = control.containers[0].collapsed;
			$scope.showOptions = false;
			$log.debug("$scope.collapsed: ",$scope.collapsed);
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

				if(attrs.option){
					control.option = attrs.option;
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