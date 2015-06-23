'use strict';

angular.module('flexResize')

	.controller('flexResizeController', [ '$scope', '$element', '$log', '$rootScope', function($scope, $element, $log, $rootScope) {
		var control = this;
		this.init = true;
		this.snapDistance = 20;
		this.dividerSize = 4;
		this.setSize = null;
		this.activePane = null;
		this.type = 'horizontal';
		this.option = null;
		this.outerContainer = {};
		this.containers = [];



		$log.debug("$element: ", $element);


		this.setOrientation = function() {
			this.flex_resize_position = $element.attr('resize');

			if(this.flex_resize_position === 'top' || 'vertical') {
				this.sizeProperties = { sizeProperty: 'height', offsetSize: 'offsetHeight', offsetPos: 'top', direction:'top', mouseProperty: 'clientY'};
			}

			if(this.flex_resize_position === 'right') {
				this.sizeProperties = { sizeProperty: 'width', offsetSize: 'offsetWidth', offsetPos: 'left', direction:'left', mouseProperty: 'clientX'};
			}

			if(this.flex_resize_position === 'left') {
				this.sizeProperties = { sizeProperty: 'width', offsetSize: 'offsetWidth', offsetPos: 'left', direction:'right', mouseProperty: 'clientX'};
			}

			$log.debug("this.sizeProperties: ", this.sizeProperties);
		}

		this.setOrientation();

		var animationFrameRequested;
		var position;

		this.toggleDirection = function() {
			if(this.type === 'horizontal') {
				this.type = 'vertical'
			} else {
				this.type = 'horizontal'
			}
			this.setOrientation();
		}


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
				offset = '52';
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


				if(control.option === 'nav-panel') {
					_.each(control.containers, function(container) { container.initialSize = 52; });
				} else {
					if(control.type === 'horizontal') {
						_.each(control.containers, function(container) { container.initialSize = container.element.width(); });
					}
					if(control.type === 'vertical') {
						_.each(control.containers, function(container) { container.initialSize = container.element.height(); });
					}
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

				control.collapsed = false;
				$log.debug("----------------");

				// snap closed when its close
				if((control.position - control.containers[0].initialSize) < control.snapDistance) {
					control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
					control.collapsed = true;
				}

			}


			if(direction === 'left') {

				if(control.option === 'nav-panel') {

					// set size directly
					if(control.position >= (control.outerContainer.width() - control.dividerSize)) {
						control.containers[0].element.css('flex-basis', window.innerWidth + 'px');
					} else {
						control.containers[0].element.css('flex-basis', control.position + 'px');
					}

					control.collapsed = false;

					// snap closed when its close
					$log.debug("snap calculation: ", control.position + control.outerContainer.offset().left - offset);
					$log.debug((control.position + control.outerContainer.offset().left - offset ) < control.snapDistance);
					if((control.position + control.outerContainer.offset().left - offset ) < control.snapDistance) {
						control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
						control.collapsed = true;
					} else {
						control.collapsed = false;
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

					control.collapsed = false;
				}


			}

			if(direction === 'right') {


				// check for max window size
				if((control.position >= (control.outerContainer.width() - control.dividerSize))) {
					control.containers[0].element.css('flex-basis', window.innerWidth + 'px');
				} else {
					control.containers[0].element.css('flex-basis', (window.innerWidth - control.position) + 'px');
				}

				control.collapsed = false;

				// snap closed when its close and fix minimum size
				if(((window.innerWidth - control.position) - control.containers[0].initialSize) < control.snapDistance ) {
					control.containers[0].element.css('flex-basis', control.containers[0].initialSize + 'px');
					control.collapsed = true;
				}
			}

			control.setSize = null;
			animationFrameRequested = null;

			$rootScope.redrawCalendar();
		}

		control.togglePane = function(pane) {

			var direction = control.sizeProperties.direction;

			if(control.activePane === null) {
				control.activePane = pane;
			}

			if(control.collapsed && direction === 'left') {
				control.setSize = 384;
				control.activePane = pane;
				resize();
				$scope.showOptions = false;
				return;
			}

			if(control.collapsed && direction === 'right') {
				control.setSize = 512;
				control.activePane = pane;
				resize();
				$scope.showOptions = false;
				return;
			}

			if (!control.collapsed && control.activePane === pane) {
				control.activePane = null;
				control.setSize = 0;
				control.collapsed = true;
				resize();
				$scope.showOptions = false;
				return;
			}

			control.activePane = pane
			$scope.showOptions = false;
		}

		console.log("control: ", control);

		return control;
	}])

	.directive('flexResize', [ '$log', function($log) {

		return {
			restrict: 'EA',
			controller: 'flexResizeController',
			controllerAs: 'resizeControl',
			link: function($scope, element, attrs, control) {


				if(attrs.resize === 'vertical') {
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

			compile: function(element, attrs, $log ) {

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
							element: element
						};

						if (attrs.resize === 'top') {
							control.type = 'vertical';
						}



						if(element.attr('collapsed') === 'true') {
							control.collapsed = true;
						} else {
							control.collapsed = false;
							control.activePane = 1;
						}


						control.addContainer(container);
					},
					link: function($scope, element, attrs, control, $log) {
						$scope.container = element;
						$scope.control = control;

						if(control.type === 'horizontal') {
							$scope.$watch('container.width', function(newValue) {
								element.css('flex-basis', newValue + 'px');
							});
							/*$scope.$watch('container.collapsed', function(newValue) {
								if(element.attr("collapsed")) {
									$scope.collapsed = element.attr("collapsed");
								} else {
									$scope.collapsed = false;
								}
							});*/
						}

						if(control.type === 'vertical') {
							$scope.$watch('container.height', function(newValue) {
								element.css('height', newValue + 'px');
							});
							/*$scope.$watch('container.collapsed', function(newValue) {
								if(element.attr("collapsed")) {
									$scope.collapsed = element.attr("collapsed");
								} else {
									$scope.collapsed = false;
								}
							});*/
						}

						console.log("linkFunction scope: ", $scope);
					}
				}
			}
		}
	}])

	.directive('flexResizeBar', [ '$log', function($log) {
		return {
			restrict: 'EAC',
			require: '^flexResize',
			link: function($scope, $element, attrs, control) {
				$log.debug('flexResizeBar element: ', $element);
				$log.debug('flexResizeBar element.children(): ', $element.children());

				var root = angular.element(document.body.parentElement);

				$element.on('mousedown touchstart', function(event) {
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