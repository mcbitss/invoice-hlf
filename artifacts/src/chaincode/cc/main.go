package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

const prefixUser = "USER"
const prefixInvoice = "INVOICE"

var projectName = "invoice-app"
var version = "v1"

var logger = shim.NewLogger("invoice-app:")

type SmartContract struct {
}

func (s *SmartContract) Init(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("###" + projectName + "###" + version + "Init ###")
	return shim.Success(nil)
}

func (s *SmartContract) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("###" + projectName + "###" + version + "Invoke ###")
	function, args := stub.GetFunctionAndParameters()
	user := User{}
	logger.Info(function)
	logger.Info(args)
	if len(args[0]) == 0 {
		logger.Error("login can't be null")
		jsonResp := "{\"login\":\"" + args[0] + "\",\"status\":false,\"description\":\"login can't be null\"}"
		return shim.Error(jsonResp)
	}
	if function != "createUser" {
		compositeKey, err := stub.CreateCompositeKey(prefixUser, []string{args[0]})
		if err != nil {
			logger.Error("Can't create composite key login=" + args[0])
			return shim.Error("{\"login\":\"" + args[0] + "\",\"status\":false,\"description\":\"Can't create composite key for login=" + args[0] + "\"}")
		}
		userAsBytes, err := stub.GetState(compositeKey)
		if userAsBytes == nil {
			logger.Error("Can't get user with login=" + args[0])
			jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"Can't get user with login=" + args[0] + "\"}"
			return shim.Success([]byte(jsonResp))
		}
		err = json.Unmarshal(userAsBytes, &user)
		if err != nil {
			logger.Error("[" + string(userAsBytes) + "] Failed to decode JSON: " + args[0])
			jsonResp := "{\"User\":\"" + args[0] + "\",\"success\":false,\"category\":\"\",\"message\":\"Can't get user with login=" + args[0] + "\"}"
			return shim.Success([]byte(jsonResp))
		}
	}

	switch function {
	case "createUser":
		return s.createUser(stub, args)
	case "authUser":
		return s.authUser(stub, user, args)
	case "queryUser":
		return s.queryUser(stub, user, args)
	case "queryAllBuyer":
		return s.queryAllBuyer(stub)
	case "addInvoice":
		return s.addInvoice(stub,user, args)
	case "acceptInvoice":
		return s.acceptInvoice(stub, user, args)
	case "rejectInvoice":
		return s.rejectInvoice(stub, user, args)
	case "listBuyersInvoiceAmounts":
		return s.listBuyersInvoiceAmounts(stub)
	case "listAllInvoices":
		return s.listAllInvoices(stub)
	case "listBuyersInvoices":
		return s.listBuyersInvoices(stub, user)
	case "getInvoice":
		return s.getInvoice(stub, user, args)
	case "getHistoryTxJson":
		return s.getHistoryTxJson(stub, args)
	default:
		jsonResp := "{\"status\":false,\"description\":\"Invalid Smart Contract operation name.\"}"
		return shim.Error(jsonResp)
	}
}

func main() {
	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}
