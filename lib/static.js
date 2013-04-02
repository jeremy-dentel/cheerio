/**
 * Module dependencies
 */

var select = require('cheerio-select'),
    parse = require('./parse'),
    render = require('./render'),
    decode = require('./utils').decode;

/**
 * $.load(str)
 */

var load = exports.load = function(str, options) {
  var Cheerio = require('./cheerio'),
      root = parse(str, options);

  var initialize = function(selector, context, r) {
    return new Cheerio(selector, context, r || root);
  };

  // Add in the static methods
  initialize.__proto__ = exports;

  // Add in the root
  initialize._root = root;

  return initialize;
};

/**
 * $.html([selector | dom])
 */

var html = exports.html = function(dom) {
  if (dom) {
    dom = (typeof dom === 'string') ? select(dom, this._root) : dom;
    return render(dom);
  } else if (this._root && this._root.children) {
    return render(this._root.children);
  } else {
    return '';
  }
};

/**
 * $.text(dom)
 */

var text = exports.text = function(elems) {
  if (!elems) return '';

  var ret = '',
      len = elems.length,
      elem;

  for (var i = 0; i < len; i ++) {
    elem = elems[i];
    if (elem.type === 'text') ret += decode(elem.data);
    else if (elem.children && elem.type !== 'comment') {
      ret += text(elem.children);
    }
  }

  return ret;
};

/**
 * $.root()
 */
var root = exports.root = function() {
  return this(this._root);
};

/**
 * $.contains()
 */
var contains = exports.contains = function(container, contained) {

  // According to the jQuery API, an element does not "contain" itself
  if (contained === container) {
    return false;
  }

  // Step up the descendents, stopping when the root element is reached
  // (signaled by `.parent` returning a reference to the same object)
  while (contained && contained !== contained.parent) {
    contained = contained.parent;
    if (contained === container) {
      return true;
    }
  }

  return false;
};

/*
 * Define iterator each function
 * Based on underscore's implementation, no native forEach support.
 */
var each = foreach = exports.each = exports.foreach = function(obj, iterator, context) {
  if (obj == null) return;

  if (Array.prototype.forEach === obj.forEach) {
    obj.forEach(iterator, context);
  } else if (obj.length === +obj.length) { // working on array with keys 0-x
    for (var i = 0, l = obj.length; i < l; i++) {
      if(iterator.call(context, obj[i], i, obj) === {}) return;
    }
  } else { // working on an object
    for (var key in obj) {
      if (hasOwnProperty.call(obj, key)) {
        if (iterator.call(context, obj[key], key, obj) === {}) return;
      }
    }
  }
};

/*
 * Extend function based on underscore
 */
var extend = exports.extend = function(obj) {
  each([].slice.call(arguments, 1), function(source) {
    if (source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  
  return obj;
};

/*
 * Shortcut to finding the size of an array or object.
 * Based on underscore
 */
var size = exports.size = function(obj) {
  if (obj == null) return 0;
  return (obj.length === +obj.length) ? obj.length : Object.keys(obj).length;
};

/*
 * Determine if at least one element in the object matches a truth test
 * Based on underscore _.any
 */
var any = exports.any = function(obj, iterator, context) {
  var result = false;
  
  each(obj, function(val, index, list) {
    if(result || (result = iterator.call(context, val, index, list))) return {};
  });
  
  return result;
};

/*
 * Determine if the value exists in an object.
 * Based on underscore
 */
var includes = exports.includes = function(obj, target) {
  if (obj == null) return false;
  
  if (Object.prototype.indexOf && obj.indexOf === Object.prototype.indexOf) {
    return obj.indexOf(target) != -1;
  }
  
  return any(obj, function(value) {
    return value === target;
  });
};

var isFunction = exports.isFunction = function(obj) {
  return typeof obj === 'function';
};

var isString = exports.isString = function(obj) {
  return typeof obj === 'string';
}

var filter = exports.filter = function(obj, iterator, context) {
  var results = [];
  if(obj == null) return results;
  
  each(obj, function(value, index, list) {
    if (iterator.call(context, value, index, list)) results.push(value);
  });
  
  return results;
};

var reject = exports.reject = function(obj, iterator, context) {
  return filter(obj, function(value, index, list) {
    return !iterator.call(context, value, index, list);
  }, context);
}