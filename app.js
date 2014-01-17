// Reduce any arraylike object.
function reduceIndexed(indexed, next, initial) {
  var accumulated = initial;

  for (var i = 0; i < indexed.length; i += 1)
    accumulated = next(accumulated, indexed[i]);

  return accumulated;
}

function callWith(v, f) {
  f(v);
  return v;
}

// Call every function in an array (or arraylike) with value.
// Returns value.
function dispatch(wire, value) {
  return reduceIndexed(wire, callWith, value);
}

function applyWith(a, f) {
  f.apply(null, a);
}

// Call every function in an array (or arraylike) with an array of values.
function dispatchN(wire, values) {
  return reduceIndexed(wire, applyWith, values);
}

// Add a value to an array, returning array.
function add(a, v) {
  a.push(v);
  return a;
}

// Remove value from array, returning array.
function remove(a, v) {
  var i = a.indexOf(v);
  if (i !== -1) a.splice(i, 1);
  return a;
}

// Just add with reverse argument order and return of value,
// for convenient reduction.
function addTo(v, a) {
  add(a, v);
  return v;
}

// Creates a new wire `b`. Whenever a new value is dispatched to `a`, callback
// `f` will be invoked with `b` and value `v`, giving `f` a chance to `dispatch`
// value to `b`.
//
// Note that wires have direction. Updates to a will be forwarded to b, but not
// the other way.
//
// @TODO I could add an "up the chain" backchannel where any `end` value
// signaled from `b` gets sent to `a`. This is essentially what accumulators
// do.
function republish(a, f) {
  var b = [];
  add(a, function listenA(v) {
    f(b, v);
  });
  return b;
}

function filter(wire, predicate) {
  return republish(wire, function republishFilter(b, v) {
    if (predicate(v)) dispatch(b, v);
  });
}

function map(wire, x) {
  return republish(wire, function republishMap(b, v) {
    dispatch(b, x(v));
  });
}

// Given wire, return a new wire that will dispatch values reduced with `next`.
function reductions(wire, next, initial) {
  // Accumulated state is kept track of via closure and is dispatched to `n`
  // listeners when updated.
  var accumulated = initial;
  return republish(wire, function republishReductions(b, v) {
    accumulated = next(accumulated, v);
    dispatch(b, accumulated);
  });
}

// Given an array of wires, "flatten" them into a single wire.
function combine(/* wires */) {
  var c = [];
  function republishToC(v) {
    dispatch(c, v);
  }
  reduceIndexed(arguments, addTo, republishToC);
  return c;
}

function asserts(wire, assert) {
  var prev = null;
  return republish(wire, function republishAsserts(b, curr) {
    if (assert(prev, curr)) dispatch(b, curr);
    prev = curr;
  });
}

function id(thing) {
  return thing;
}

function sample(wire, trigger, assemble) {
  assemble = assemble || id;
  var sampled = null;

  add(wire, function (value) {
    // Update sampled value when `wire` is updated.
    sampled = value;
  });

  return republish(trigger, function (b, v) {
    dispatch(b, assemble(sampled, v));
  });
}

// Given a wire, create a new wire that represents the previous value of
// `wire` whenever `wire` is updated.
function previously(wire) {
  var prev = null;
  return republish(wire, function (b, curr) {
    dispatch(b, prev);
    prev = curr;
  });
}

function print(wire) {
  add(wire, console.log);
}

function on(element, name, useCapture) {
  // @TODO could create backchannel by either returning 2 wires (one for
  // lifecycle events) or by creating methods on `wire` (start/stop), or by
  // dispatching signals to wire.
  //
  // The prob/advantage with dispatching signals is that the message is
  // forwarded to all 
  var wire = [];

  element.addEventListener(name, function (event) {
    dispatch(wire, event);
  }, !!useCapture);
  return wire;
}

function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

function withTarget(element) {
  function isElementTarget(event) {
    return event.target === element;
  }
  return isElementTarget;
}

function withAnimation(target, animationName) {
  function isEventForAnimation(event) {
    return event.target === target && event.animationName === animationName;
  }
  return isEventForAnimation;
}

function cloneFirstChildOf(id) {
  var tpl = document.getElementById(id);
  return tpl.firstElementChild.cloneNode(true);
}

function insertChild(parent, el, index) {
  parent.insertBefore(el, parent.childNodes[index + 1]);
  return parent;
}

function getFirstWithoutClass(elements, c) {
  for (var i = 0; i < elements.length; i += 1)
    if (!elements[i].classList.contains(c)) return elements[i];
  return null;
}

// Toast next message in toaster stack.
// Returns child element that was toasted.
function toastNext_(toastEls) {
  // Get the next message element that needs to be toasted.
  var toastEl = getFirstWithoutClass(toastEls, 'nc-toasted');
  if (toastEl) toastEl.classList.add('nc-toasted');
  return toastEl;
}

var NC = [];

function sms1() {
  // We disptach this as 2 messages due to the way we're handling
  // fade in/out as seperate toasts.
  dispatch(NC, {
    title: 'Will Grand',
    message: "Still up for lunch tomorrow?"
  });
}

function sms2() {
  // We disptach this as 2 messages due to the way we're handling
  // fade in/out as seperate toasts.
  dispatch(NC, {
    title: 'Alice Smith',
    message: "Bob's going away party at office Fri"
  });
}

var sysBottomEdge = document.getElementById("sys-gesture-panel-bottom");
var sysTopEdge = document.getElementById("sys-gesture-panel-top");
var ncTabEl = document.getElementById("nc-tab");
var ncDrawer = document.getElementById("nc-drawer");
var ncHeader = document.getElementById('nc-drawer-header');
var ncToasterEl = document.getElementById("nc-toaster");

var touchstarts = on(window, 'touchstart');
var touchmoves = on(window, 'touchmove');
var touchends = on(window, 'touchend');
var touchcancels = on(window, 'touchcancel');
var touchstops = combine(touchends, touchcancels);
var animationends = on(window, 'animationend');

var isTargetBottomEdge = withTarget(sysBottomEdge);
var isTargetTopEdge = withTarget(sysTopEdge);
var isTargetNcHeader = withTarget(ncHeader);

var bottomEdgeTouchmoves = filter(touchmoves, isTargetBottomEdge);
var bottomEdgeTouchstops = filter(touchstops, isTargetBottomEdge);
var ncHeaderTouchmoves = filter(touchmoves, isTargetNcHeader);
var ncHeaderTouchstops = filter(touchstops, isTargetNcHeader);
var yEdgeTouchmoves = combine(bottomEdgeTouchmoves, ncHeaderTouchmoves);
var yEdgePrevTouchmoves = previously(yEdgeTouchmoves);
var yEdgeTouchstops = combine(bottomEdgeTouchstops, ncHeaderTouchstops);
var yEdgeSwipeVel = sample(yEdgePrevTouchmoves, yEdgeTouchmoves, function (prev, curr) {
  if (prev === null) return 0;
  return curr.changedTouches[0].screenY - prev.changedTouches[0].screenY;
});
// Deduce swipe direction at touchend.
var yEdgeSwipeEndYVel = sample(yEdgeSwipeVel, yEdgeTouchstops);
var yEdgeSwipeMoveYCoord = map(yEdgeTouchmoves, function (event) {
  return screen.height - event.changedTouches[0].screenY;
});

var ncTabAnimationends = filter(animationends, withAnimation(ncTabEl, 'nc-tab-pulse'));
var ncToasterAnimationends = filter(animationends, withAnimation(ncToasterEl, 'nc-toaster-pop'));

// All animationend events happening on toasts.
var ncToastAnimationends = filter(animationends, function (event) {
  return event.target.classList.contains('nc-toast');
});

add(NC, function (notification) {
  // Add new message to drawer.
  var msg = cloneFirstChildOf('template-msg-sms');
  msg.querySelector('.msg-title').textContent = notification.title;
  msg.querySelector('.msg-content').textContent = notification.message;
  insertChild(ncDrawer, msg, 1);

  // Tally number of messages.
  var notificationsCount = ncDrawer.querySelectorAll('.msg-message').length;

  var nNotifications = notificationsCount + " Notifications";

  // Update notifications center header
  ncHeader.textContent = nNotifications;

  var toastTitle = cloneFirstChildOf('template-toast-sms-title');
  toastTitle.textContent = notification.title;
  ncToasterEl.appendChild(toastTitle);

  var toastMessage = cloneFirstChildOf('template-toast-sms');
  toastMessage.textContent = notification.message;
  ncToasterEl.appendChild(toastMessage);

  var toastCount = cloneFirstChildOf('template-toast-count');
  toastCount.textContent = nNotifications;
  ncToasterEl.appendChild(toastCount);

  ncToasterEl.classList.remove('nc-toaster-push');
  ncToasterEl.classList.add('nc-toaster-pop');
  ncTabEl.classList.add('nc-tab-pulse');

  // Vibrate after 1200ms, just before the toast pops.
  setTimeout(vibrate, 1200, [300, 200, 300]);
});

add(ncToasterAnimationends, function (event) {
  toastNext_(ncToasterEl.children);
});

add(ncToastAnimationends, function (event) {
  var toastedEl = toastNext_(ncToasterEl.children);
  if (toastedEl === null) {
    ncToasterEl.classList.add('nc-toaster-push');
    ncToasterEl.classList.remove('nc-toaster-pop');
  }
});

add(yEdgeSwipeMoveYCoord, function (y) {
  ncDrawer.classList.remove('nc-drawer-open');
  ncDrawer.classList.remove('nc-drawer-close');
  ncDrawer.style.transform = 'translateY(-' + y + 'px)';
});

add(yEdgeSwipeEndYVel, function (vel) {
  // Favor opening over closing, just slightly.
  var classname = vel < 2 ? 'nc-drawer-open' : 'nc-drawer-close';
  ncDrawer.classList.add(classname);
  ncDrawer.style.transform = '';
  ncTabEl.classList.remove('nc-tab-pulse');
});

