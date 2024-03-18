var convert = require('./lib');
var xml =
'<?xml version="1.0" encoding="utf-8"?><!--Testing XML to JSON--><article type="research-article" version="1.0">Building a JSON format that can support XML inline <!--or nested--> tag. <company type="tech">ABC (<copyright>2000</copyright>)</company> and <format>XML</format> were great for this.</article>';
console.log("---expected xml----");
console.log(xml);
var json = convert.xml2json(xml, {compact: true});
console.log("---json----");
console.log(json);
var newXml = convert.json2xml(json, {compact: true});
console.log("---newXml----");
console.log(newXml);
console.log("Equal? " + (newXml == xml));
var xml2 = '<?xml version="1.0" encoding="UTF-8"?>\n' +
'<note>\n' +
'\v<to>xml-js</to>\n' +
'\v<from>ACraig</from>\n' +
'\v<heading>Min Example</heading>\n' +
'\v<body>Here are some characters that get sanitized: " \'</body>\n' +
'</note>';
console.log("---expected xml----");
var expectedXml2 = xml2.replace(/\v/g, '  ');
console.log(expectedXml2);
var json2 = convert.xml2json(xml2, {compact: true});
console.log("---json----");
console.log(json2);
var newXml2 = convert.json2xml(json2, {compact: true, spaces: 2});
console.log("---newXml----");
console.log(newXml2);
console.log("Equal? " + (newXml2 == expectedXml2));
var xml3 = '<a><b><c/></b></a>';
console.log("---expected xml----");
console.log(xml3);
var json3 = convert.xml2json(xml3, {compact: true});
console.log("---json----");
console.log(json3);
var newXml3 = convert.json2xml(json3, {compact: true});
console.log("---newXml----");
console.log(newXml3);
console.log("Equal? " + (newXml3 == xml3));
var xml4 =
'<ZohoCreator>\n' +
'    <applicationslist>\n' +
'        <application name="testapp">\n' +
'            <formlist>\n' +
'                <form name="Untitled_Form">\n' +
'                    <add>\n' +
'                        <field name="Subform_Single_Line">\n' +
'                            <value>BEUHBALUGU</value>\n' +
'                        </field>\n' +
'                    </add>\n' +
'                </form>\n' +
'                <form name="Untitled_Form">\n' +
'                    <add>\n' +
'                        <field name="Subform_Single_Line">\n' +
'                            <value>IF YOU CAN SEE THIS YOU DESERVE THE SUCC</value>\n' +
'                        </field>\n' +
'                    </add>\n' +
'                </form>\n' +
'            </formlist>\n' +
'        </application>\n' +
'        <application name="derp">\n' +
'            <formlist></formlist>\n' +
'        </application>\n' +
'    </applicationslist>\n' +
'</ZohoCreator>';
console.log("---expected xml----");
console.log(xml4);
var json4 = convert.xml2json(xml4, {compact: true, spaces: 4});
console.log("---json----");
console.log(json4);
var newXml4 = convert.json2xml(json4, {compact: true, spaces: 4, fullTagEmptyElement: true});
console.log("---newXml----");
console.log(newXml4);
console.log("Equal? " + (newXml4 == xml4));
var xml5 = '<a/>';
console.log("---expected xml----");
console.log(xml5);
var json5 = convert.xml2json(xml5, {compact: true});
console.log("---json----");
console.log(json5);
var newXml5 = convert.json2xml(json5, {compact: true});
console.log("---newXml----");
console.log(newXml5);
console.log("Equal? " + (newXml5 == xml5));