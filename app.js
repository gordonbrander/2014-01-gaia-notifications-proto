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

// Just add with reverse argument order for convenient reduction.
function addTo(v, a) {
  return add(a, v);
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
function merge(wires) {
  var c = [];
  function republishToC(v) {
    dispatch(c, v);
  }
  reduceIndexed(wires, addTo, republishToC);
  return c;
}

function asserts(wire, assert) {
  var prev = null;
  return republish(wire, function republishAsserts(b, curr) {
    if (assert(prev, curr)) dispatch(b, curr);
    prev = curr;
  });
}

function sample(wire, trigger, assemble) {
  var sampled = null;

  add(wire, function (value) {
    // Update sampled value when `wire` is updated.
    sampled = value;
  });

  republish(trigger, function (b, v) {
    dispatch(b, assemble(sampled, v));
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

var ncTabEl = document.getElementById("nc-tab");
var ncToasterEl = document.getElementById("nc-toaster");
var ncToast1 = document.getElementById("nc-toast-0001");
var ncToast2 = document.getElementById("nc-toast-0002");

var beginAnimation = on(window, 'click');
var animationends = on(window, 'animationend');
var ncTabAnimationends = filter(animationends, withAnimation(ncTabEl, 'nc-tab-pulse'));
var ncToasterAnimationends = filter(animationends, withAnimation(ncToasterEl, 'nc-toaster-pop'));

// All animationend events happening on toasts.
var ncToastAnimationends = filter(animationends, function (event) {
  return event.target.classList.contains('nc-toast');
});

add(beginAnimation, function () {
  ncTabEl.classList.add('nc-tab-pulse');
});

add(ncTabAnimationends, function (event) {
  ncToasterEl.classList.add('nc-toaster-pop');
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
