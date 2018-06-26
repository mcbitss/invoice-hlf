'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger();
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
var fs = require('fs');
var xml2js = require('xml2js');
var jsonxml = require('jsontoxml');
var watch = require('node-watch');
var path = require('path');
require('./config.js');
var hfc = require('fabric-client');
var helper = require('./app/helper.js');
var createChannel = require('./app/create-channel.js');
var join = require('./app/join-channel.js');
var install = require('./app/install-chaincode.js');
var instantiate = require('./app/instantiate-chaincode.js');
var invoke = require('./app/invoke-transaction.js');
var pushxml = require('./app/pushxmldata.js');
var query = require('./app/query.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');

const baseurl = "/api";
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/explorer', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
var xmljson = null;

///////////////////////////////////////////////////////////////////////////////
////////////////////////// SET TOKEN CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
// set secret
app.set('secret', 'mysecret@fejlett');
app.use(expressJWT({
	secret: 'mysecret@fejlett'
}).unless({
	path: [baseurl + '/users', baseurl + '/login', baseurl + '/register', baseurl + '/2fa']
}));

app.use(bearerToken());

app.use(function (err, req, res, next) {
	console.log("err>>>>>>>>>>>>>>>>>.." + err);
	if (err.name === 'UnauthorizedError') {
		res.status(401).send({
			"message": "Invalid Token"
		});
	}
});

app.use(function (req, res, next) {
	console.log(res.status);
	try {
		console.log('>>> New request for %s', req.originalUrl);
		if (req.originalUrl.indexOf(baseurl + '/users') >= 0) {
			return next();
		}
		if (req.originalUrl.indexOf(baseurl + '/login') >= 0) {
			return next();
		}
		if (req.originalUrl.indexOf(baseurl + '/register') >= 0) {
			return next();
		}
		if (req.originalUrl.indexOf(baseurl + '/2fa') >= 0) {
			return next();
		}

		var token = req.token;
		try {
			jwt.verify(token, app.get('secret'), function (err, decoded) {
				console.log("error-----------" + err);
				if (err) {
					res.send({
						success: false,
						message: 'Failed to authenticate token.'
					});
					return;
				} else {
					req.username = decoded.username;
					req.orgname = decoded.orgName;
					req.category = decoded.category;
					console.log(util.format('Decoded from  token: username - %s, orgname - %s , category - %s', decoded.username, decoded.orgName, decoded.category));
					try {
						var resp = helper.getRegisteredUser(decoded.username, decoded.orgName, true);
					} catch (err) {
						res.send({
							success: false,
							message: 'Invalid User'
						});
					}
					return next();
				}
			});
		} catch (err) {
			res.send({
				success: false,
				message: 'Token Expired or Invalid'
			});
		}
	} catch (err) {
		res.send({
			success: false,
			message: 'Token Expired or Invalid'
		});
	}
});
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function () {});
console.log('****************** SERVER STARTED ************************');
console.log('******************  http://%s:%s  ************************', host, port);
server.timeout = 3000000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}
logger.level = 'info';
log4js.configure({
	appenders: {
		file: {
			type: 'file',
			filename: 'logs/invoice-app.log'
		}
	},
	categories: {
		default: {
			appenders: ['file'],
			level: 'info'
		}
	}
});

/* WATCH XML FILE LOCATION FOR ADDING XML TO DLT AUTOMATIC
  watch('/home/seban/Desktop/invoice-app/invoicexml/', { recursive: true }, function (evt, name) {
    console.log('%s changed.', name);
    console.log(path.extname(name));
    if (path.extname(name) == ".xml") {
		var xmlout;
		try{
			var parser = new xml2js.Parser();
				fs.readFile(name, "utf-8", function (error, text) {
				  if (error) {
					throw error;
				  } else {
					parser.parseString(text, function (err, result) {
					  xmlout = result['Company'];
					  var accountReference =xmlout.Invoices[0].Invoice[0].AccountReference[0];
					  var invoiceNumber =xmlout.Invoices[0].Invoice[0].InvoiceNumber[0];
					  var customerOrderNumber =xmlout.Invoices[0].Invoice[0].CustomerOrderNumber[0];
					  var invoiceDate =xmlout.Invoices[0].Invoice[0].InvoiceDate[0];
					  var foreignRate =xmlout.Invoices[0].Invoice[0].ForeignRate[0];
					  console.log("accountReference---app.js"+accountReference);
					  console.log("invoiceNumber---app.js"+invoiceNumber);
					  console.log("customerOrderNumber---app.js"+customerOrderNumber);
					  console.log("foreignRate---app.js"+foreignRate);
					  if (accountReference==null){	
						return res.send("Account number can't be empty");
						
					  }
					  if (accountReference.length!=8){					
						return	res.send("Incorrect account number length");
						
					  }
					  if (invoiceNumber==null){					
						return res.send("Invoice number can't be empty");
					  }
					if (customerOrderNumber==null){					
						return res.send("Customer order number can't be empty");
					}
					if (invoiceDate==null){					
						return res.send("Invoice date can't be empty");
					}
					if (foreignRate==null){					
						return res.send("Foreign rate can't be empty");
					}
					 var xmljson = JSON.stringify(xmlout)
					 var username ="test@email.com";
					 var orgname = 'Org1';
					 var fcn="adddata";
					 var chaincodeName ="invoice";
					 var peers ="peer0.org1.fejlett.com";
					 var channelName ="fejlettchannel";
					  var arr=["test@email.com",name,xmljson,invoiceNumber];
					  console.log(arr[0]);
					  console.log(arr[1]);
					  console.log(arr[2]);
					  console.log(arr[3]);

					let message = pushxml.xmlDataToDlt(peers, channelName, chaincodeName, fcn, arr, username, orgname);
					  console.log(message);
					});
				  }
				});
		
		} 
		catch(err){
			console.log(err);
			console.log(err);
		}




    }
});
*/
///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Register and enroll user
app.post(baseurl + '/users', async function (req, res) {
	var username = req.body.username;
	var orgName = req.body.orgName;
	console.log('End point : /users');
	console.log('User name : ' + username);
	console.log('Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
	var token = jwt.sign({
		exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
		username: username,
		orgName: orgName
	}, app.get('secret'));
	let response = await helper.enrollInitUser(username, orgName, true);
	//console.log('-- returned from registering the username %s for organization %s', username, orgName);
	if (response && typeof response !== 'string') {
		//console.log('Successfully registered the username %s for organization %s', username, orgName);
		response.token = token;
		res.json(response);
	} else {
		//console.log('Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({
			success: false,
			message: response
		});
	}
});
//Registration Request
app.post(baseurl + '/register', async function (req, res) {
	console.log('============= NEW USER REGISTRATION REQUEST==================');
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	var channelName = "fejlettchannel";
	var fcn = "createUser";
	var chaincodeName = "invoice";
	var peers = "";
	var orgName = "";
	if (args[1] == "Seller") {
		peers = "peer1.org1.fejlett.com";
		orgName = "Org1";
		if (args.length != 5) {
			res.send({
				success: false,
				message: 'Incorrect argument length'
			});
		}
	}
	if (args[1] == "Buyer") {
		peers = "peer1.org2.fejlett.com";
		orgName = "Org2";
		if (args.length != 6) {
			res.send({
				success: false,
				message: 'Incorrect argument length'
			});
		}
	}
	if (!chaincodeName) {
		return res.send({
			success: false,
			message: 'Invalid chaincodeName'
		});
	}
	if (!channelName) {
		return res.send({
			success: false,
			message: 'Invalid channelName'
		});
	}
	if (!fcn) {
		return res.send({
			success: false,
			message: 'Invalid input function name'
		});
	}
	let message = await helper.registerNewUser(peers, channelName, chaincodeName, fcn, args, orgName, true);
	res.send(message);
});
//login  Request
app.post(baseurl + '/login', async function (req, res) {
	console.log('==================== QUERY BY CHAINCODE ==================');
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	if (args.length != 3) {
		res.send({
			success: false,
			message: 'Incorrect argument length'
		});
	}
	try {
		var channelName = "fejlettchannel";
		var fcn = "authUser";
		var chaincodeName = "invoice";
		console.log(args);
		var peer = "";
		var orgName = "";
		if (args[2] == "Seller") {
			peer = "peer1.org1.fejlett.com";
			orgName = "Org1";
		}
		if (args[2] == "Buyer") {
			peer = "peer1.org2.fejlett.com";
			orgName = "Org2";
		}
		var username = args[0];
		var category = args[2];
		var token = jwt.sign({
			exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
			username: username,
			orgName: orgName,
			category: category
		}, app.get('secret'));
		let response = await helper.getRegisteredUser(username, orgName, true);
		let message = await query.queryLogin(peer, channelName, chaincodeName, args, orgName, fcn);
		var auth = message.toString();
		try {
			var auth_json = JSON.parse(auth);
			if (auth_json.success == true) {
				auth_json.token = token;
				console.log(auth_json);
				logger.info("User " + username + " Sucessfully loged in as " + auth_json.category);
				return res.send(auth_json);
			} else {
				auth_json.token = null;
				return res.send(auth_json);
			}
		} catch (err) {
			return res.send(auth);
		}
	} catch (err) {
		var response = {
			user: args[0],
			success: false,
			category: null,
			message: 'Invalid User',
			token: null
		};
		return res.send(response);
	}
});

// two factor authentication
app.post(baseurl + '/2fa', async function (req, res) {
	console.log('==================== QUERY BY CHAINCODE ==================');
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	try {
		console.log(args);
		var token = args[0];
		jwt.verify(token, app.get('secret'), function (err, decoded) {
			if (err) {
				res.send({
					success: false,
					message: 'Failed to authenticate token.',
					token: null
				});
			} else {
				req.username = decoded.username;
				req.orgname = decoded.orgName;
				req.category = decoded.category;
				console.log(util.format('Decoded from token: username - %s, orgname - %s , category - %s', decoded.username, decoded.orgName, decoded.category));
				if (decoded.username != null) {
					res.send({
						success: true,
						message: 'Token successfully authenticated',
						token: token
					});
					logger.info("2fa success of the user :" + decoded.username);
				}

			}
		});

	} catch (err) {
		res.send({
			success: false,
			message: 'Failed to authenticate token.'
		});
		logger.info("2fa failed ");
	}

});
//logout 
app.post(baseurl + '/logout', function (req, res) {
	console.log('==================== logout User ==================');
	console.log(req.token);
	if (req.token != null) {
		req.token = null;
		var response = {
			success: true,
			message: 'token sucessfully invalidated',
		};
		console.log(req.token);
		return res.send(response);
	}
	var response = {
		success: false,
		message: 'failed to invalidate token',
	};
	return res.send(response);
});
// Query get customer profile
app.get(baseurl + '/customer/profile', async function (req, res) {
	console.log('==================== QUERY user profile ==================');
	var username = req.query.username;
	console.log(username);
	var channelName = "fejlettchannel";
	var chaincodeName = "invoice";
	var args = [req.username, username];
	let fcn = "queryUser";

	var peer = "peer1.org2.fejlett.com";

	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);
	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	console.log(message);
	console.log("***TEST**");
	res.send(message);
	console.log(message);
});
// List all customers
app.get(baseurl + '/customer/list_all', async function (req, res) {
	console.log('==================== QUERY user profile ==================');
	var channelName = "fejlettchannel";
	var chaincodeName = "invoice";
	var args = [req.username];
	let fcn = "queryAllBuyer";

	var peer = "peer1.org2.fejlett.com";

	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	console.log(message);
	console.log("***TEST**");
	res.send(message);
	console.log(message);
});

//add a new invoice
app.post(baseurl + '/invoice/process_invoice', async function (req, res) {
	console.log('====================PROCESSES INVOICE==================');
	if (req.category != "Seller") {
		res.send({
			success: false,
			message: 'Authentication Failure'
		});
	}
	var args = req.body.args;
	if (!args) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	var arr;
	var filename = args[0];
	var peers = "peer1.org1.fejlett.com";
	var chaincodeName = "invoice";
	var channelName = "fejlettchannel";
	var fcn = "addInvoice";
	var username = req.username;
	var orgname = 'Org1';
	var filepath = "./invoicexml/" + filename + ".xml";
	try{
	doparsing(filepath);
	}
	catch (err){
		res.send({
			success: false,
			message: 'Failed to read File'+filepath
		});
	}
	var delayInMilliseconds = 3000;
	var message;
	setTimeout(async function () {

		console.log(xmljson + "xmljson---");
		if (xmljson != null) {
			var arr = [username, xmljson];
			var message;
			try {
				message = await pushxml.processinvoice(peers, channelName, chaincodeName, fcn, arr, username, orgname);
			} catch (err) {
				res.send({
					success: false,
					message: 'Invoke request failed, Not a valid transaction ',
					trxnid: null
				});

			}
			console.log("message-------------------------" + message);
			res.send({
				success: true,
				message: 'Invoice ' + filename + ' processed sucessfully ',
				trxnid: message
			});
		}
	}, delayInMilliseconds);


});



function doparsing(filepath) {
	try {
		var xmlout;

		var parser = new xml2js.Parser();
		fs.readFile(filepath, "utf-8", function (error, text) {
			logger.info("Read from XML Files for new invoices, file name:  file path  " + filepath);
			if (error) {
				throw error;
			} else {
				parser.parseString(text, function (err, result) {
					xmlout = result['Company'];
					console.log(xmlout);
					var accountReference = xmlout.Invoices[0].Invoice[0].AccountReference[0];
					var invoiceNumber = xmlout.Invoices[0].Invoice[0].InvoiceNumber[0];
					var customerOrderNumber = xmlout.Invoices[0].Invoice[0].CustomerOrderNumber[0];
					var invoiceDate = xmlout.Invoices[0].Invoice[0].InvoiceDate[0];
					var foreignRate = xmlout.Invoices[0].Invoice[0].ForeignRate[0];
					console.log("accountReference---app.js" + accountReference);
					console.log("invoiceNumber---app.js" + invoiceNumber);
					console.log("customerOrderNumber---app.js" + customerOrderNumber);
					console.log("foreignRate---app.js" + foreignRate);
					if (accountReference == null) {
						return res.send("Account number can't be empty");

					}
					if (accountReference.length != 8) {
						return res.send("Incorrect account number length");

					}
					if (invoiceNumber == null) {
						return res.send("Invoice number can't be empty");
					}
					if (customerOrderNumber == null) {
						return res.send("Customer order number can't be empty");
					}
					if (invoiceDate == null) {
						return res.send("Invoice date can't be empty");
					}
					if (foreignRate == null) {
						return res.send("Foreign rate can't be empty");
					}
					xmljson = JSON.stringify(xmlout)
					console.log(xmljson);
				});
			}
		});

	} catch (err) {
		console.log(err);
		throw new Error(err);
	}
}

//get  invoice of a buyer
app.post(baseurl + '/invoice/buyer/get_invoice', async function (req, res) {
	console.log('==================== Buyer Invoice ==================');
	if (req.category != "Buyer") {
		res.send({
			success: false,
			message: 'Authentication Failure'
		});
	}
	var arg = req.body.args;
	if (!arg) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	if (req.body.args == null) {
		return res.send({
			success: false,
			message: 'Invalid input arguments'
		});
	}
	var channelName = "fejlettchannel";
	var chaincodeName = "invoice";
	var args = [req.username, arg[0], arg[0]];
	let fcn = "getInvoice";
	var peer = "peer1.org2.fejlett.com";
	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);
	try {
		let message = await invoke.invokeChaincode(peer, channelName, chaincodeName, fcn, args, req.username, req.orgname);
		res.send(message);
	} catch (err) {
		res.send({
			success: false,
			trnxId: null,
			response: null,
			message: "Invoke request failed, Not a valid transaction "
		});
	}

});

//get  invoice of a buyer
app.get(baseurl + '/invoice/seller/get_buyer_invoice', async function (req, res) {
	console.log('==================== seller get invoice ==================');
	if (req.category != "Seller") {
		res.send({
			success: false,
			message: 'Authentication Failure'
		});
	}
	var accountrefference = req.query.accountrefference;
	var invoicenumber = req.query.invoicenumber;
	if (accountrefference == null || invoicenumber == null) {
		res.send({
			success: false,
			message: 'Incorrect arguments'
		});
	}
	var channelName = "fejlettchannel";
	var chaincodeName = "invoice";
	var args = [req.username, accountrefference, invoicenumber];
	let fcn = "getInvoice";
	var peer = "peer1.org1.fejlett.com";
	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	console.log(message);
	var xml = jsonxml(message);
	xml = "<Company>" + xml + "</Company>";
	res.send(xml);


});

//Accept invoice
app.post(baseurl + '/invoice/manage', async function (req, res) {
	console.log('==================== Manage Invoice(Accept or Reject) ==================');
	var status = req.query.status;
	var invoiceid = req.query.invoiceid;
	var peers = "peer1.org1.fejlett.com";
	var chaincodeName = "invoice";
	var channelName = "fejlettchannel";
	if (status == "Accept") {
		var fcn = "acceptInvoice";
	}
	if (status == "Reject") {
		var fcn = "rejectInvoice";
	}
	var username = req.username;
	var orgname = 'Org1';
	try {
		var arr = [username, invoiceid];
		console.log(arr[0]);
		console.log(arr[1]);
		let message = pushxml.xmlDataToDlt(peers, channelName, chaincodeName, fcn, arr, username, orgname);
		res.send(message);
	} catch (err) {
		console.log(err);
		res.send(err);
	}
});

//get all invoices
app.get(baseurl + '/invoice/list_all', async function (req, res) {
	console.log('====================LIST ALL INVOICES==================');
	if (req.category == "Buyer") {
		res.send({
			success: false,
			message: 'Authentication Failure'
		});
	}
	var channelName = "fejlettchannel";
	var chaincodeName = "invoice";
	var args = [req.username];
	let fcn = "listAllInvoices";

	var peer = "peer1.org2.fejlett.com";

	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	console.log(message);
	console.log("***TEST**");
	res.send(message);
	console.log(message);
});

//list all invoices of a buyer
app.get(baseurl + '/invoice/list_by_buyer', async function (req, res) {
	console.log('==================== QUERY user profile ==================');
	if (req.category == "Buyer") {
		res.send({
			success: false,
			message: 'Authentication Failure'
		});
	}
	var channelName = "fejlettchannel";
	var chaincodeName = "invoice";
	let args = [req.query.username];
	let fcn = "listBuyersInvoices";
	var peer = "peer1.org2.fejlett.com";
	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	console.log(message);
	console.log("***TEST**");
	res.send(message);
	logger.info("User :  " + req.query.username + " shows the following invoices : ");

	console.log(message);
});

//list all invoices of a buyer
app.get(baseurl + '/invoice/buyer', async function (req, res) {
	console.log('==================== QUERY user profile ==================');
	if (req.category == "Seller") {
		res.send({
			success: false,
			message: 'Authentication Failure'
		});
	}
	var channelName = "fejlettchannel";
	var chaincodeName = "invoice";
	let args = [req.username];
	let fcn = "listBuyersInvoices";
	var peer = "peer1.org2.fejlett.com";
	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	console.log(message);
	console.log("***TEST**");
	res.send(message);
	logger.info("User :  " + req.query.username + " shows the following invoices : ");
	console.log(message);
});
// Query Get Transaction by Transaction ID
app.get(baseurl + '/get_transaction_details', async function (req, res) {
	console.log('================ GET TRANSACTION DETAILS BY TRANSACTION_ID ======================');
	var channelName = "fejlettchannel";
	var peer = "peer0.org1.fejlett.com";
	let trxnId = req.query.trxnId;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}
	let message = await query.getTransactionByID(peer, channelName, trxnId, req.username, req.orgname);
	console.log(message);
	res.send(message);
});
//get xml data
app.get(baseurl + '/invoice/xmldownload', async function (req, res) {
	logger.error('================XML download ======================');
	console.log('channelName : ' + req.params.channelName);
	let trxnId = req.params.trxnId;
	let peer = req.query.peer;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}
	let message = await query.getTransactionByID(peer, req.params.channelName, trxnId, req.username, req.orgname);
	console.log(message);
	var xml = jsonxml(message);
	xml = "<Company>" + xml + "</Company>";
	//xml = js2xmlparser.parse("company",message);
	console.log(xml);
	fs.writeFile("/home/seban/Desktop/invoice/download/jsontoxml.xml", xml, function (err) {
		if (err) {
			return console.log(err);
		}
		console.log("Xml created");
	});
	res.send(xml);
});
// Create Channel
app.post(baseurl + '/channels', async function (req, res) {
	console.log('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	console.log('End point : /channels');
	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	console.log('Channel name : ' + channelName);
	console.log('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!channelConfigPath) {
		res.json(getErrorMessage('\'channelConfigPath\''));
		return;
	}

	let message = await createChannel.createChannel(channelName, channelConfigPath, req.username, req.orgname);
	res.send(message);
});
// Join Channel
app.post(baseurl + '/channels/:channelName/peers', async function (req, res) {
	console.log('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
	var channelName = req.params.channelName;
	var peers = req.body.peers;
	console.log('channelName : ' + channelName);
	console.log('peers : ' + peers);
	console.log('username :' + req.username);
	console.log('orgname:' + req.orgname);

	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}

	let message = await join.joinChannel(channelName, peers, req.username, req.orgname);
	res.send(message);
});
// Install chaincode on target peers
app.post(baseurl + '/chaincodes', async function (req, res) {
	console.log('==================== INSTALL CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodePath = req.body.chaincodePath;
	var chaincodeVersion = req.body.chaincodeVersion;
	var chaincodeType = req.body.chaincodeType;
	console.log('peers : ' + peers); // target peers list
	console.log('chaincodeName : ' + chaincodeName);
	console.log('chaincodePath  : ' + chaincodePath);
	console.log('chaincodeVersion  : ' + chaincodeVersion);
	console.log('chaincodeType  : ' + chaincodeType);
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodePath) {
		res.json(getErrorMessage('\'chaincodePath\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.username, req.orgname)
	res.send(message);
});
// Instantiate chaincode on target peers
app.post(baseurl + '/channels/:channelName/chaincodes', async function (req, res) {
	console.log('==================== INSTANTIATE CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodeVersion = req.body.chaincodeVersion;
	var channelName = req.params.channelName;
	var chaincodeType = req.body.chaincodeType;
	var fcn = req.body.fcn;
	var args = req.body.args;
	console.log('peers  : ' + peers);
	console.log('channelName  : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('chaincodeVersion  : ' + chaincodeVersion);
	console.log('chaincodeType  : ' + chaincodeType);
	console.log('fcn  : ' + fcn);
	console.log('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	let message = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.username, req.orgname);
	res.send(message);
});
// Invoke transaction on chaincode on target peers
app.post(baseurl + '/channels/:channelName/chaincodes/:chaincodeName', async function (req, res) {
	console.log('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	console.log('channelName  : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn  : ' + fcn);
	console.log('args  : ' + args);

	var username = args[0];
	var orgname = 'Org1';
	try {
		let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, username, orgname);
		if (fcn == "addBankDetails") {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Account added Sucessfully"
			}
			res.send(resp);
		}
		if (fcn == "loanRequest") {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Loan Request Sucessfully Created"
			}
			res.send(resp);
		}
		if (fcn == "loanOffer") {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Loan Offer Sucessfully Created"
			}
			res.send(resp);
		}
		if (fcn == "acceptLoan") {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Loan Accepted Sucessfully"
			}
			res.send(resp);
		} else {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Chaincode Invoked Sucessfully"
			}
			res.send(resp);
		}
	} catch (err) {
		if (fcn == "addBankDetails") {
			var resp = {
				"success": "false",
				"txnId": null,
				"message": "Account Already exist"
			}
			res.send(resp);
		}
		if (fcn == "loanRequest") {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Failed to create new loan request"
			}
			res.send(resp);
		}
		if (fcn == "loanOffer") {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Failed to Offer a Loan"
			}
			res.send(resp);
		}
		if (fcn == "acceptLoan") {
			var resp = {
				"success": "true",
				"txnId": message.toString(),
				"message": "Failed to accept the Loan"
			}
			res.send(resp);
		} else {
			var resp = {
				"success": "false",
				"txnId": null,
				"message": "Chaincode Invoked failed"
			}
			res.send(resp);
		}
	}
});

// Query on chaincode on target peers
app.get(baseurl + '/channels/:channelName/chaincodes/:chaincodeName', async function (req, res) {
	console.log('==================== QUERY BY CHAINCODE ==================');
	var channelName = req.params.channelName;
	var chaincodeName = req.params.chaincodeName;
	let args = req.query.args;
	let fcn = req.query.fcn;
	let peer = req.query.peer;

	console.log('channelName : ' + channelName);
	console.log('chaincodeName : ' + chaincodeName);
	console.log('fcn : ' + fcn);
	console.log('args : ' + args);

	args = args.replace(/'/g, '"');
	args = JSON.parse(args);
	console.log(args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	console.log(message);
	console.log("***TEST**");
	res.send(message);
	console.log(message);

});
//  Query Get Block by BlockNumber
app.get(baseurl + '/channels/:channelName/blocks/:blockId', async function (req, res) {
	console.log('==================== GET BLOCK BY NUMBER ==================');
	let blockId = req.params.blockId;
	let peer = req.query.peer;
	console.log('channelName : ' + req.params.channelName);
	console.log('BlockID : ' + blockId);
	console.log('Peer : ' + peer);
	if (!blockId) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}

	let message = await query.getBlockByNumber(peer, req.params.channelName, blockId, req.username, req.orgname);
	res.send(message);
});
// Query Get Transaction by Transaction ID
app.get(baseurl + '/channels/:channelName/transactions/:trxnId', async function (req, res) {
	console.log('================ GET TRANSACTION BY TRANSACTION_ID ======================');
	console.log('channelName : ' + req.params.channelName);
	let trxnId = req.params.trxnId;
	let peer = req.query.peer;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}
	let message = await query.getTransactionByID(peer, req.params.channelName, trxnId, req.username, req.orgname);
	console.log(message);
	res.send(message);
});


// Query Get Block by Hash
app.get(baseurl + '/get_block_by_hash', async function (req, res) {
	console.log('================ GET BLOCK BY HASH ======================');
	let hash = req.query.hash;
	let peer = "peer0.org1.fejlett.com";
	let channelName = "fejlettchannel";
	if (!hash) {
		res.json(getErrorMessage('\'hash\''));
		return;
	}

	let message = await query.getBlockByHash(peer, channelName, hash, req.username, req.orgname);
	res.send(message);
});
//Query for Channel Information
app.get(baseurl + '/channels/:channelName', async function (req, res) {
	console.log('================ GET CHANNEL INFORMATION ======================');
	console.log('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	let message = await query.getChainInfo(peer, req.params.channelName, req.username, req.orgname);
	res.send(message);
});
//Query for Channel instantiated chaincodes
app.get(baseurl + '/channels/:channelName/chaincodes', async function (req, res) {
	console.log('================ GET INSTANTIATED CHAINCODES ======================');
	console.log('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	let message = await query.getInstalledChaincodes(peer, req.params.channelName, 'instantiated', req.username, req.orgname);
	res.send(message);
});
// Query to fetch all Installed/instantiated chaincodes
app.get(baseurl + '/chaincodes', async function (req, res) {
	var peer = req.query.peer;
	var installType = req.query.type;
	console.log('================ GET INSTALLED CHAINCODES ======================');

	let message = await query.getInstalledChaincodes(peer, null, 'installed', req.username, req.orgname)
	res.send(message);
});
// Query to fetch channels
app.get(baseurl + '/channels', async function (req, res) {
	console.log('================ GET CHANNELS ======================');
	var peer = "peer2.org1.fejlett.com";
	if (!peer) {
		res.json(getErrorMessage('\'peer\''));
		return;
	}
	let message = await query.getChannels(peer, req.username, req.orgname);
	res.send(message);
});