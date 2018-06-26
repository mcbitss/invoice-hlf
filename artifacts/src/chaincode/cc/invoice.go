package main

import (
	"bytes"
	"encoding/json"
	"strconv"
	"time"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

func (s *SmartContract) createUser(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("###" + projectName + "###" + version + "CreateUser ###")
	// 0  - Email
	// 1 - Seller or Buyer
	// 2  - Name
	// 3  - Phone
	// 4  - Password
	// 5 - AccountReference
	// "args":["email","name","phone","password","AccountReference","Category"]
	if args[1] == "Seller" {
		if len(args) != 5 {
			logger.Error("Incorrect number of arguments. Expecting 5")
			jsonResp := "{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"Incorrect number of arguments. Expecting 6\"}"
			return shim.Error(jsonResp)
		}

	}
	if args[1] == "Buyer" {
		if len(args) != 6 {
			logger.Error("Incorrect number of arguments. Expecting 6")
			jsonResp := "{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"Incorrect number of arguments. Expecting 6\"}"
			return shim.Error(jsonResp)
		}

	}
	if args[1] != "Seller" && args[1] != "Buyer" {
		logger.Error("Invalid user Category, Category either be Seller or Buyer")
		jsonResp := "{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"Invalid user Category, Category either be Seller or Buyer\"}"
		return shim.Error(jsonResp)
	}
	if len(args[0]) == 0 || len(args[3]) == 0 || len(args[4]) == 0 {
		logger.Error("emailid or password or AccountReference can't be null")
		jsonResp := "{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"emailid or password or AccountReference can't be null\"}"
		return shim.Error(jsonResp)
	}
	key, err := stub.CreateCompositeKey(prefixUser, []string{args[0]})
	if err != nil {
		jsonResp := "{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"" + err.Error() + "\"}"
		return shim.Error(jsonResp)
	}
	// Check if the buyer already exists
	// Customer does not exist, attempting creation
	user := User{}
	userAsBytes, _ := stub.GetState(key)
	if userAsBytes != nil {
		return shim.Error("{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"User Already Exist , Please provide another Username \"}")
	}
	if args[1] == "Seller" {
		user.UserName = args[0]
		user.Category = args[1]
		user.Name = args[2]
		user.Phone = args[3]
		user.Email = args[0]
		user.Password = args[4]
		user.Status = "ACTIVE"

	}
	if args[1] == "Buyer" {
		user.UserName = args[0]
		user.Category = args[1]
		user.Name = args[2]
		user.Phone = args[3]
		user.Email = args[0]
		user.Password = args[4]
		user.AccountReference = args[5]
		user.Status = "ACTIVE"

	}
	userAsBytes, err = json.Marshal(user)
	if err != nil {
		jsonResp := "{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"" + err.Error() + "\"}"
		return shim.Error(jsonResp)
	}
	err = stub.PutState(key, userAsBytes)
	if err != nil {
		jsonResp := "{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"" + err.Error() + "\"}"
		return shim.Error(jsonResp)
	}

	return shim.Success([]byte("{\"User\":\"" + args[0] + "\",\"status\":true,\"description\":\"User is successfully Registered\"}"))

}

func (s *SmartContract) authUser(stub shim.ChaincodeStubInterface, user User, args []string) pb.Response {
	logger.Info("### " + projectName + " " + version + " login (" + args[0] + ") ###")
	// 1 - username
	// 2 - Password
	// 3 - Category
	logger.Info("args-0" + args[0])
	logger.Info("args-0" + args[1])
	logger.Info("username" + user.Name)
	logger.Info("Password" + user.Password)
	if len(args) != 3 {
		logger.Error("Incorrect number of arguments. Expecting 3")
		jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"User Already Exist , Please provide another Username\"}"
		return shim.Success([]byte(jsonResp))
	}
	if user.Password != args[1] {
		logger.Info("Incorrect password")
		jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"Invalid password\"}"
		return shim.Success([]byte(jsonResp))
	}
	if user.Status == "DEACTIVATED" {
		logger.Info("Account deactivated")
		jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"Account deactivated\"}"
		return shim.Success([]byte(jsonResp))
	}
	if user.Category != args[2] {
		logger.Info("Not a user in this Category")
		jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"Not a user in this Category\"}"
		return shim.Success([]byte(jsonResp))
	}
	logger.Info("Login successfull")
	jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":true,\"category\":\"" + args[2] + "\",\"message\":\"Login successful\"}"
	return shim.Success([]byte(jsonResp))
}

func (s *SmartContract) queryUser(stub shim.ChaincodeStubInterface, user User, args []string) pb.Response {
	if user.UserName == args[1] {
		user.Password = "*** SECURED ***"
		usr, _ := json.Marshal(user)
		return shim.Success(usr)
	}
	key, err := stub.CreateCompositeKey(prefixUser, []string{args[1]})
	if err != nil {
		return shim.Error(err.Error())
	}
	userBytes, _ := stub.GetState(key)
	if len(userBytes) == 0 {
		return shim.Success([]byte("{\"error\":\"Invalid User\"}"))
	}
	err = json.Unmarshal(userBytes, &user)
	user.Password = "*** SECURED ***"
	userBytes, _ = json.Marshal(user)
	return shim.Success(userBytes)
}

func (s *SmartContract) queryAllBuyer(stub shim.ChaincodeStubInterface) pb.Response {
	results := []interface{}{}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixUser, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		user := User{}
		err = json.Unmarshal(kvResult.Value, &user)
		if err != nil {
			return shim.Error(err.Error())
		}
		if user.Category == "Buyer" {
			user.Password = "***SECURED***"
			results = append(results, user)
		}
	}
	userAsBytes, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(userAsBytes)

}

func (s *SmartContract) addInvoice(stub shim.ChaincodeStubInterface, user User, args []string) pb.Response {
	logger.Info("###" + projectName + "###" + version + "Add data ###")

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}
	logger.Info("args[0]--username", args[0])
	logger.Info("arg[2]--xml data", args[1])
	if user.Category != "Seller" {
		return shim.Error("{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"Only Seller/manufacturer have the permission to add new invoice \"}")
	}
	invoiceData := InvoiceData{}
	err := json.Unmarshal([]byte(args[1]), &invoiceData)
	logger.Info("invoice DETAILS***********------------", invoiceData)
	accountReference := invoiceData.Invoices[0].Invoice[0].AccountReference[0]
	invoiceNumber := invoiceData.Invoices[0].Invoice[0].InvoiceNumber[0]
	customerOrderNumber := invoiceData.Invoices[0].Invoice[0].CustomerOrderNumber[0]
	invoiceDate := invoiceData.Invoices[0].Invoice[0].InvoiceDate[0]
	foreignRate := invoiceData.Invoices[0].Invoice[0].ForeignRate[0]
	if accountReference == "" {
		return shim.Error("Account number can't be empty")
	}
	if len(accountReference) != 8 {
		return shim.Error("Incorrect account number length")

	}
	if invoiceNumber == "" {
		return shim.Error("Invoice number can't be empty")
	}
	if customerOrderNumber == "" {
		return shim.Error("Customer order number can't be empty")
	}
	if invoiceDate == "" {
		return shim.Error("Invoice date can't be empty")
	}
	if foreignRate == "" {
		return shim.Error("Foreign rate can't be empty")
	}
	logger.Info("AccountReference***********------------", accountReference)
	key, err := stub.CreateCompositeKey(prefixInvoice, []string{accountReference, invoiceNumber})
	if err != nil {
		return shim.Error(err.Error())
	}
	// Check if the invoice already exist
	invoiceAsBytes, _ := stub.GetState(key)
	if invoiceAsBytes != nil {
		return shim.Error("{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"Data with this id  Already Exist , Please provide another id \"}")
	}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixUser, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		user := User{}
		err = json.Unmarshal(kvResult.Value, &user)
		if err != nil {
			return shim.Error(err.Error())
		}
		if user.AccountReference == accountReference && user.Status == "ACTIVE" {
			invoiceAsBytes, err := json.Marshal(invoiceData)
			if err != nil {
				return shim.Error(err.Error())
			}
			err = stub.PutState(key, invoiceAsBytes)
			if err != nil {
				return shim.Error(err.Error())
			}
			return shim.Success([]byte("{\"User\":\"" + args[0] + "\",\"status\":true,\"description\":\"Invoice added  successfully \"}"))
		}

	}
	return shim.Error("{\"User\":\"" + args[0] + "\",\"status\":false,\"description\":\"Invalid AccountReference ,Can't find a valid user associated with invoice AccountReference \"}")

}

func (s *SmartContract) acceptInvoice(stub shim.ChaincodeStubInterface, user User, args []string) pb.Response {
	logger.Info("###" + projectName + "###" + version + "Add data ###")

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}
	logger.Info("args[0]--username", args[0])
	logger.Info("args[1]--id", args[1])

	key, err := stub.CreateCompositeKey(prefixInvoice, []string{user.AccountReference, args[1]})
	if err != nil {
		return shim.Error(err.Error())
	}
	// Check if the invoice already exist
	invoiceAsBytes, _ := stub.GetState(key)
	if invoiceAsBytes == nil {
		return shim.Error("Invalid Invoice ID")
	}
	invoiceData := InvoiceData{}
	err = json.Unmarshal(invoiceAsBytes, &invoiceData)
	invoiceAsBytes, err = json.Marshal(invoiceData)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(key, invoiceAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte("{\"User\":\"" + args[0] + "\",\"status\":true,\"description\":\"Invoice Accepted \"}"))

}

func (s *SmartContract) rejectInvoice(stub shim.ChaincodeStubInterface, user User, args []string) pb.Response {
	logger.Info("###" + projectName + "###" + version + "Add data ###")
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}
	logger.Info("args[0]--username", args[0])
	logger.Info("args[1]--id", args[1])

	key, err := stub.CreateCompositeKey(prefixInvoice, []string{user.AccountReference, args[1]})
	if err != nil {
		return shim.Error(err.Error())
	}
	// Check if the invoice already exist
	invoiceAsBytes, _ := stub.GetState(key)
	if invoiceAsBytes == nil {
		return shim.Error("Invalid Invoice ID")
	}
	invoiceData := InvoiceData{}
	err = json.Unmarshal(invoiceAsBytes, &invoiceData)
	invoiceAsBytes, err = json.Marshal(invoiceData)
	if err != nil {
		return shim.Error(err.Error())
	}
	err = stub.PutState(key, invoiceAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success([]byte("{\"User\":\"" + args[0] + "\",\"status\":true,\"description\":\"Invoice Accepted \"}"))
}

func (s *SmartContract) listBuyersInvoiceAmounts(stub shim.ChaincodeStubInterface) pb.Response {
	results := []interface{}{}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixUser, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		user := User{}
		err = json.Unmarshal(kvResult.Value, &user)
		if err != nil {
			return shim.Error(err.Error())
		}
		if user.Category == "Buyer" {
			results = append(results, user)
		}
	}
	userAsBytes, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(userAsBytes)

}

func (s *SmartContract) listAllInvoices(stub shim.ChaincodeStubInterface) pb.Response {
	results := []interface{}{}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixInvoice, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		buyerInvoiceList := BuyerInvoiceList{}
		invoiceData := InvoiceData{}
		err = json.Unmarshal(kvResult.Value, &invoiceData)
		if err != nil {
			return shim.Error(err.Error())
		}
		buyerInvoiceList.AccountReference = invoiceData.Invoices[0].Invoice[0].AccountReference[0]
		buyerInvoiceList.CustomerOrderNumber = invoiceData.Invoices[0].Invoice[0].CustomerOrderNumber[0]
		buyerInvoiceList.InvoiceNumber = invoiceData.Invoices[0].Invoice[0].InvoiceNumber[0]
		buyerInvoiceList.InvoiceDate = invoiceData.Invoices[0].Invoice[0].InvoiceDate[0]

		results = append(results, buyerInvoiceList)
	}
	invoiceAsBytes, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(invoiceAsBytes)

}

func (s *SmartContract) listBuyersInvoices(stub shim.ChaincodeStubInterface, user User) pb.Response {
	results := []interface{}{}
	resultsIterator, err := stub.GetStateByPartialCompositeKey(prefixInvoice, []string{})
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()
	for resultsIterator.HasNext() {
		kvResult, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		buyerInvoiceList := BuyerInvoiceList{}
		invoiceData := InvoiceData{}
		err = json.Unmarshal(kvResult.Value, &invoiceData)
		if err != nil {
			return shim.Error(err.Error())
		}
		if invoiceData.Invoices[0].Invoice[0].AccountReference[0] == user.AccountReference {
			buyerInvoiceList.AccountReference = invoiceData.Invoices[0].Invoice[0].AccountReference[0]
			buyerInvoiceList.CustomerOrderNumber = invoiceData.Invoices[0].Invoice[0].CustomerOrderNumber[0]
			buyerInvoiceList.InvoiceNumber = invoiceData.Invoices[0].Invoice[0].InvoiceNumber[0]
			buyerInvoiceList.InvoiceDate = invoiceData.Invoices[0].Invoice[0].InvoiceDate[0]

			results = append(results, buyerInvoiceList)
		}
	}
	invoiceAsBytes, err := json.Marshal(results)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(invoiceAsBytes)

}

func (s *SmartContract) getInvoice(stub shim.ChaincodeStubInterface, user User, args []string) pb.Response {
	if user.Category == "Buyer" {
		key, err := stub.CreateCompositeKey(prefixInvoice, []string{user.AccountReference, args[2]})
		if err != nil {
			return shim.Error(err.Error())
		}
		invoiceBytes, _ := stub.GetState(key)
		if len(invoiceBytes) == 0 {
			return shim.Error("{\"error\":\"Invalid Invoice Number\"}")
		}
		return shim.Success(invoiceBytes)
	}
	if user.Category == "Seller" {
		key, err := stub.CreateCompositeKey(prefixInvoice, []string{args[1], args[2]})
		if err != nil {
			return shim.Error(err.Error())
		}
		invoiceBytes, _ := stub.GetState(key)
		if len(invoiceBytes) == 0 {
			return shim.Success([]byte("{\"error\":\"Invalid Invoice Number\"}"))
		}
		return shim.Success(invoiceBytes)
	}
	return shim.Error("Invalid user category")
}

func (s *SmartContract) getHistoryTxJson(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	resultsIterator, err := stub.GetHistoryForKey(args[1])
	if err != nil {
		return shim.Error("{\"status\":false,\"description\":\"" + err.Error() + "\"}")
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error("{\"status\":false,\"description\":\"" + err.Error() + "\"}")
		}
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"value\":")
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"isDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	logger.Info("History: \n" + buffer.String())
	return shim.Success(nil)
}
