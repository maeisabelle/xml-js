var convert = require('./lib');
var xml =
'<?xml version="1.0" encoding="utf-8"?><!--Testing XML to JSON--><article type="research-article" version="1.0">Building a JSON format that can support XML inline <!--or nested--> tag. <company type="tech">ABC (<copyright>2000</copyright>)</company> and <format>XML</format> were great for this.</article>';
var json = convert.xml2json(xml, {compact: true});
console.log("---json----");
console.log(json);
var newXml = convert.json2xml(json, {compact: true});
console.log("---newXml----");
console.log(newXml);