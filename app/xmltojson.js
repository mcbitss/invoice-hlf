'use strict';
var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var log4js = require('log4js');
var logger = log4js.getLogger();
log4js.configure({
	appenders: { file: { type: 'file', filename: 'logs/invoice-app.log' } },
	categories: { default: { appenders: ['file'], level: 'error' } }
  });
function xmlTojson(fname) {
  console.log("xml converter");
 var xmlout= "";
  var xmlfile = fname;
  console.log(xmlfile);
  fs.readFile(xmlfile, "utf-8", function (error, text) {
    console.log("*xml*");
    if (error) {
      throw error;

    } else {
      console.log("*1*");
      parser.parseString(text, function (err, result) {
        xmlout = result['Company'];
        console.log(xmlout.Invoices[0].Invoice[0].InvoiceNumber);
      });
    }
    console.log("return");
    console.log(xmlout.Invoices[0].Invoice[0].InvoiceNumber);
    return xmlout;
  });

};

exports.xmlTojson = xmlTojson;