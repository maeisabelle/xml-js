var helper = require('./options-helper');
var isArray = require('./array-helper').isArray;

var currentElement, currentElementName, optionsKeys;

function validateOptions(userOptions) {
  var options = helper.copyOptions(userOptions);
  helper.ensureFlagExists('ignoreDeclaration', options);
  helper.ensureFlagExists('ignoreInstruction', options);
  helper.ensureFlagExists('ignoreAttributes', options);
  helper.ensureFlagExists('ignoreText', options);
  helper.ensureFlagExists('ignoreComment', options);
  helper.ensureFlagExists('ignoreCdata', options);
  helper.ensureFlagExists('ignoreDoctype', options);
  helper.ensureFlagExists('compact', options);
  helper.ensureFlagExists('indentText', options);
  helper.ensureFlagExists('indentCdata', options);
  helper.ensureFlagExists('indentAttributes', options);
  helper.ensureFlagExists('indentInstruction', options);
  helper.ensureFlagExists('fullTagEmptyElement', options);
  helper.ensureFlagExists('noQuotesForNativeAttributes', options);
  helper.ensureSpacesExists(options);
  if (typeof options.spaces === 'number') {
    options.spaces = Array(options.spaces + 1).join(' ');
  }
  helper.ensureKeyExists('declaration', options);
  helper.ensureKeyExists('instruction', options);
  helper.ensureKeyExists('attributes', options);
  helper.ensureKeyExists('text', options);
  helper.ensureKeyExists('comment', options);
  helper.ensureKeyExists('cdata', options);
  helper.ensureKeyExists('doctype', options);
  helper.ensureKeyExists('type', options);
  helper.ensureKeyExists('name', options);
  helper.ensureKeyExists('elements', options);
  helper.checkFnExists('doctype', options);
  helper.checkFnExists('instruction', options);
  helper.checkFnExists('cdata', options);
  helper.checkFnExists('comment', options);
  helper.checkFnExists('text', options);
  helper.checkFnExists('instructionName', options);
  helper.checkFnExists('elementName', options);
  helper.checkFnExists('attributeName', options);
  helper.checkFnExists('attributeValue', options);
  helper.checkFnExists('attributes', options);
  helper.checkFnExists('fullTagEmptyElement', options);
  return options;
}

function writeIndentation(options, depth, firstLine) {
  return (!firstLine && options.spaces ? '\n' : '') + Array(depth + 1).join(options.spaces);
}

function writeAttributes(attributes, options, depth) {
  if (options.ignoreAttributes) {
    return '';
  }
  if ('attributesFn' in options) {
    attributes = options.attributesFn(attributes, currentElementName, currentElement);
  }
  var key, attr, attrName, quote, result = [];
  for (key in attributes) {
    if (attributes.hasOwnProperty(key) && attributes[key] !== null && attributes[key] !== undefined) {
      quote = options.noQuotesForNativeAttributes && typeof attributes[key] !== 'string' ? '' : '"';
      attr = '' + attributes[key]; // ensure number and boolean are converted to String
      attr = attr.replace(/"/g, '&quot;');
      attrName = 'attributeNameFn' in options ? options.attributeNameFn(key, attr, currentElementName, currentElement) : key;
      result.push((options.spaces && options.indentAttributes? writeIndentation(options, depth+1, false) : ' '));
      result.push(attrName + '=' + quote + ('attributeValueFn' in options ? options.attributeValueFn(attr, key, currentElementName, currentElement) : attr) + quote);
    }
  }
  if (attributes && Object.keys(attributes).length && options.spaces && options.indentAttributes) {
    result.push(writeIndentation(options, depth, false));
  }
  return result.join('');
}

function writeDeclaration(declaration, options, depth) {
  currentElement = declaration;
  currentElementName = 'xml';
  return options.ignoreDeclaration ? '' :  '<?' + 'xml' + writeAttributes(declaration[options.attributesKey], options, depth) + '?>';
}

function writeInstruction(instruction, options, depth) {
  if (options.ignoreInstruction) {
    return '';
  }
  var key;
  for (key in instruction) {
    if (instruction.hasOwnProperty(key)) {
      break;
    }
  }
  var instructionName = 'instructionNameFn' in options ? options.instructionNameFn(key, instruction[key], currentElementName, currentElement) : key;
  if (typeof instruction[key] === 'object') {
    currentElement = instruction;
    currentElementName = instructionName;
    return '<?' + instructionName + writeAttributes(instruction[key][options.attributesKey], options, depth) + '?>';
  } else {
    var instructionValue = instruction[key] ? instruction[key] : '';
    if ('instructionFn' in options) instructionValue = options.instructionFn(instructionValue, key, currentElementName, currentElement);
    return '<?' + instructionName + (instructionValue ? ' ' + instructionValue : '') + '?>';
  }
}

function writeComment(comment, options) {
  return options.ignoreComment ? '' : '<!--' + ('commentFn' in options ? options.commentFn(comment, currentElementName, currentElement) : comment) + '-->';
}

function writeCdata(cdata, options) {
  return options.ignoreCdata ? '' : '<![CDATA[' + ('cdataFn' in options ? options.cdataFn(cdata, currentElementName, currentElement) : cdata.replace(']]>', ']]]]><![CDATA[>')) + ']]>';
}

function writeDoctype(doctype, options) {
  return options.ignoreDoctype ? '' : '<!DOCTYPE ' + ('doctypeFn' in options ? options.doctypeFn(doctype, currentElementName, currentElement) : doctype) + '>';
}

function writeText(text, options) {
  if (options.ignoreText) return '';
  text = '' + text; // ensure Number and Boolean are converted to String
  text = text.replace(/&amp;/g, '&'); // desanitize to avoid double sanitization
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return 'textFn' in options ? options.textFn(text, currentElementName, currentElement) : text;
}

function hasContent(element, options) {
  var i;
  if (element.elements && element.elements.length) {
    for (i = 0; i < element.elements.length; ++i) {
      switch (element.elements[i][options.typeKey]) {
      case 'text':
        if (options.indentText) {
          return true;
        }
        break; // skip to next key
      case 'cdata':
        if (options.indentCdata) {
          return true;
        }
        break; // skip to next key
      case 'instruction':
        if (options.indentInstruction) {
          return true;
        }
        break; // skip to next key
      case 'doctype':
      case 'comment':
      case 'element':
        return true;
      default:
        return true;
      }
    }
  }
  return false;
}

function writeElement(element, options, depth) {
  currentElement = element;
  currentElementName = element.name;
  var xml = [], elementName = 'elementNameFn' in options ? options.elementNameFn(element.name, element) : element.name;
  xml.push('<' + elementName);
  if (element[options.attributesKey]) {
    xml.push(writeAttributes(element[options.attributesKey], options, depth));
  }
  var withClosingTag = element[options.elementsKey] && element[options.elementsKey].length || element[options.attributesKey] && element[options.attributesKey]['xml:space'] === 'preserve';
  if (!withClosingTag) {
    if ('fullTagEmptyElementFn' in options) {
      withClosingTag = options.fullTagEmptyElementFn(element.name, element);
    } else {
      withClosingTag = options.fullTagEmptyElement;
    }
  }
  if (withClosingTag) {
    xml.push('>');
    if (element[options.elementsKey] && element[options.elementsKey].length) {
      xml.push(writeElements(element[options.elementsKey], options, depth + 1));
      currentElement = element;
      currentElementName = element.name;
    }
    xml.push(options.spaces && hasContent(element, options) ? '\n' + Array(depth + 1).join(options.spaces) : '');
    xml.push('</' + elementName + '>');
  } else {
    xml.push('/>');
  }
  return xml.join('');
}

function writeElements(elements, options, depth, firstLine) {
  return elements.reduce(function (xml, element) {
    var indent = writeIndentation(options, depth, firstLine && !xml);
    switch (element.type) {
    case 'element': return xml + indent + writeElement(element, options, depth);
    case 'comment': return xml + indent + writeComment(element[options.commentKey], options);
    case 'doctype': return xml + indent + writeDoctype(element[options.doctypeKey], options);
    case 'cdata': return xml + (options.indentCdata ? indent : '') + writeCdata(element[options.cdataKey], options);
    case 'text': return xml + (options.indentText ? indent : '') + writeText(element[options.textKey], options);
    case 'instruction':
      var instruction = {};
      instruction[element[options.nameKey]] = element[options.attributesKey] ? element : element[options.instructionKey];
      return xml + (options.indentInstruction ? indent : '') + writeInstruction(instruction, options, depth);
    }
  }, '');
}

function hasContentCompact(element, options, anyContent) {
  var key;
  for (key in element) {
    if (element.hasOwnProperty(key)) {
      switch (key) {
      case options.parentKey:
      case options.attributesKey:
        return false;
        //break; // skip to next key
      case options.textKey:
        if (options.indentText || anyContent) {
          return true;
        }
        break; // skip to next key
      case options.cdataKey:
        if (options.indentCdata || anyContent) {
          return true;
        }
        break; // skip to next key
      case options.instructionKey:
        if (options.indentInstruction || anyContent) {
          return true;
        }
        break; // skip to next key
      case options.doctypeKey:
      case options.commentKey:
        return true;
      default:
        return true;
      }
    }
  }
  return false;
}

function writeElementCompact(element, options, depth, currentElementIndex) {
  var elementName = 'elementNameFn' in options ? options.elementNameFn(currentElementName, currentElement) : currentElementName;
  var xml = [];

  if(currentElementIndex == 0) {
    //add if it's the first time to write the current element 
    xml.push('<' + elementName);
    if (element[options.attributesKey]) {
      xml.push(writeAttributes(element[options.attributesKey], options, depth));
    }
    var withClosingTag = hasClosingTag(currentElement, options, currentElementName);
    if (!withClosingTag) {
      if ('fullTagEmptyElementFn' in options) {
        withClosingTag = options.fullTagEmptyElementFn(currentElementName, currentElement);
      } else {
        withClosingTag = options.fullTagEmptyElement;
      }
      if (withClosingTag) {
        xml.push('></'+elementName+'>');
        return xml.join('');
      } else {
        xml.push('/>');
        return xml.join('');
      }
    } else {
      xml.push('>');
      
    }
  }
  var parentElement = currentElement;
  var parentElementName = currentElementName;
  //add child elements
  if(!element.hasOwnProperty(options.attributesKey)) {
    xml.push(writeElementsCompact(element, options, depth + 1, currentElementIndex > 0));
    if((parentElement[parentElementName].length - 1) == currentElementIndex) { //last child element
      var output = writeElementEndTag(parentElement, parentElementName, 
        options, depth, hasContentCompact(element, options));
      xml.push(output);
    }
  }
  return xml.join('');
}

function hasClosingTag(element, options, elementName) {
  var withClosingTag = false;
  var foundOne = null;
  if(Array.isArray(element[elementName])) {
    foundOne = element[elementName].find(child => {
      return hasContentCompact(child, options, true);
    });
  }
  if(foundOne) {
    withClosingTag = true;
  }
  return withClosingTag;
}

function writeElementEndTag(element, name, options, depth, indent) {
  var elementName = 'elementNameFn' in options ? options.elementNameFn(name, element) : name;
  return ((indent ? writeIndentation(options, depth, false) : '') + '</' + elementName + '>');
}

function writeElementsCompact(element, options, depth, firstLine) {
  var elementIndex, i, key, nodes, xml = [], currentElementRow = 0;
  currentElement = element;
  var elementKeys = Object.keys(element);
  var numberOfKeys = elementKeys.length;
  for (elementIndex=0; elementIndex<numberOfKeys; elementIndex++) {
    key = elementKeys[elementIndex];
    currentElementName = key;
    if (element.hasOwnProperty(key)) {
      nodes = isArray(element[key]) ? element[key] : [element[key]];
      if(nodes.length == 0) {
        if(!optionsKeys.includes(key)) {
          currentElementRow++;
        }
        //add empty element
        firstLine = depth == 0 && currentElementRow == 1;//(elementIndex == 0 || options.spaces.length == 0);
        depth = firstLine ? 0 : depth;
        var output = writeIndentation(options, depth, firstLine);
        output += 'fullTagEmptyElementFn' in options && options.fullTagEmptyElementFn(currentElementName, currentElement) || 
          options.fullTagEmptyElement ? '<' + currentElementName + '></' + currentElementName + '>' : '<' + currentElementName + '/>';
        xml.push(output);
      }
      var childElementIndex = 0;
      for (i = 0; i < nodes.length; ++i) {
        currentElement = element;
        currentElementName = key;
        switch (key) {
        case options.declarationKey: 
          var output = writeDeclaration(nodes[i], options, depth) + getNewLineIfApplicable(options.spaces, elementIndex == (numberOfKeys - 1));
          xml.push(output);
          break;
        case options.instructionKey: 
          var output = (options.indentInstruction ? writeIndentation(options, depth, firstLine) : '') + 
            writeInstruction(nodes[i], options, depth) + getNewLineIfApplicable(options.spaces, elementIndex == (numberOfKeys - 1));
          xml.push(output); 
          break;
        case options.attributesKey: case options.parentKey: break; // skip
        case options.textKey: 
          var output = (options.indentText ? writeIndentation(options, depth, firstLine) : '') + writeText(nodes[i], options);
          xml.push(output);
          break;
        case options.cdataKey: 
          var output = (options.indentCdata ? writeIndentation(options, depth, firstLine) : '') + writeCdata(nodes[i], options);
          xml.push(output); 
          break;
        case options.doctypeKey:
          var output = writeIndentation(options, depth, firstLine && depth == 0) + writeDoctype(nodes[i], options);
          xml.push(output);
          break;
        case options.commentKey: 
          var output = writeIndentation(options, depth, firstLine) + 
            writeComment(nodes[i], options) + getNewLineIfApplicable(options.spaces, elementIndex == (numberOfKeys - 1));
          xml.push(output); 
          break;
        default: 
          firstLine = depth == 0 || childElementIndex > 0;
          indentDepth = firstLine ? 0 : depth;
          var output = writeIndentation(options, indentDepth, firstLine);
          xml.push(output);
          childElementIndex++;
          output = writeElementCompact(nodes[i], options, depth, i);
          xml.push(output);
        }
        firstLine = !xml.length;
      }
    }
  }
  return xml.join('');
}

function getNewLineIfApplicable(spaces, isLastChild) {
  return !isLastChild && spaces ? '\n' : '';
}

module.exports = function (js, options) {
  options = validateOptions(options);
  optionsKeys = [options.declarationKey,
    options.instructionKey,
    options.attributesKey,
    options.textKey,
    options.cdataKey,
    options.doctypeKey,
    options.commentKey];
  var xml = [];
  currentElement = js;
  currentElementName = '_root_';
  if (options.compact) {
    xml.push(writeElementsCompact(js, options, 0, true));
  } else {
    if (js[options.declarationKey]) {
      xml.push(writeDeclaration(js[options.declarationKey], options, 0));
    }
    if (js[options.elementsKey] && js[options.elementsKey].length) {
      xml.push(writeElements(js[options.elementsKey], options, 0, !xml.length));
    }
  }
  return xml.join('');
};
