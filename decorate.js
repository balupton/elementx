
var svgAttributeNamespace = require('./svg-attribute-namespace')
var isBooleanAttribute = require('./is-boolean-attribute')
var shorthands = require('hyperscript-helpers')
var isSvgElement = require('./is-svg-element')
var parse = require('parse-hyperscript')
var document = require('global-undom')
var defined = require('defined')

module.exports = decorateElement

function decorateElement (decorate) {
  decorate = defined(decorate, defaultDecorate)

  return Object.assign({}, shorthands(createElement), {
    createElement: createElement,
    h: createElement
  })

  function createElement () {
    var obj = parse(arguments)

    var el = isSvgElement(obj.node)
      ? document.createElementNS('http://www.w3.org/2000/svg', obj.node)
      : document.createElement(obj.node)

    for (var key in obj.attrs) {
      if (!obj.attrs.hasOwnProperty(key)) continue
      var attr

      // if attr is `className`, rewrite to `class` otherwise decorate as usual
      if (key === 'className') {
        key = 'class'
        attr = decorate(key, obj.attrs.className)
      } else {
        attr = decorate(key, obj.attrs[key])
      }

      if (isEventHandler(key)) {
        // add event listeners to the node directly
        el[normalizeEvent(key)] = attr
      } else if (isBooleanAttribute(key)) {
        // if it's a truthy boolean value, set the value to its own key.
        // If it's a falsy boolean value, ignore the attribute
        attr !== false && el.setAttribute(key, key)
      } else {
        // otherwise just set the attribute on the element. Set the
        // namespace if it's an svg
        var ns = svgAttributeNamespace(key)
        ns
          ? el.setAttributeNS(ns, key, attr)
          : el.setAttribute(key, attr)
      }
    }

    if (obj.children.length === 0) return el

    obj.children.forEach(function (child) {
      if (!child) return
      if (isString(child)) child = document.createTextNode(child)
      el.appendChild(child)
    })

    return el
  }
}

function normalizeEvent (ev) {
  return 'on' + ev.slice(2, ev.length).toLowerCase()
}

function isEventHandler (key) {
  return key.slice(0, 2) === 'on'
}

function defaultDecorate (attr, value) {
  return value
}

function isString (val) {
  return typeof val === 'string'
}
