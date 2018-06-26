#!/bin/bash
#

jq --version > /dev/null 2>&1
if [ $? -ne 0 ]; then
	echo "Please Install 'jq' to execute this script"
	echo
	exit 1
fi

starttime=$(date +%s)

# Print the usage message
function printHelp () {
  echo "Usage: "
  echo "  ./testAPIs.sh -l golang|node"
  echo "    -l <language> - chaincode language (defaults to \"golang\")"
}
# Language defaults to "golang"
LANGUAGE="golang"
CCNAME="invoice"
CCVERSION="v0"

# Parse commandline args
while getopts "h?l:" opt; do
  case "$opt" in
    h|\?)
      printHelp
      exit 0
    ;;
    l)  LANGUAGE=$OPTARG
    ;;
  esac
done

##set chaincode path
function setChaincodePath(){
	LANGUAGE=`echo "$LANGUAGE" | tr '[:upper:]' '[:lower:]'`
	case "$LANGUAGE" in
		"golang")
		CC_SRC_PATH="chaincode/cc"
		;;
		"node")
		CC_SRC_PATH="$PWD/artifacts/src/chaincode/cc"
		;;
		*) printf "\n ------ Language $LANGUAGE is not supported yet ------\n"$
		exit 1
	esac
}

setChaincodePath

echo "POST request Enroll on Org1  ..."
echo
ORG1_TOKEN=$(curl -s -X POST \
  http://localhost:4000/api/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Jim&orgName=Org1')
echo $ORG1_TOKEN
ORG1_TOKEN=$(echo $ORG1_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG1 token is $ORG1_TOKEN"
echo
echo "POST request Enroll on Org2 ..."
echo
ORG2_TOKEN=$(curl -s -X POST \
  http://localhost:4000/api/users \
  -H "content-type: application/x-www-form-urlencoded" \
  -d 'username=Barry&orgName=Org2')
echo $ORG2_TOKEN
ORG2_TOKEN=$(echo $ORG2_TOKEN | jq ".token" | sed "s/\"//g")
echo
echo "ORG2 token is $ORG2_TOKEN"
echo
echo
echo "POST request Create channel  ..."
echo
curl -s -X POST \
  http://localhost:4000/api/channels \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"channelName":"fejlettchannel",
	"channelConfigPath":"../artifacts/channel/fejlettchannel.tx"
}'
echo
echo
sleep 5
echo "POST request Join channel on Org1"
echo
curl -s -X POST \
  http://localhost:4000/api/channels/fejlettchannel/peers \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org1.fejlett.com","peer1.org1.fejlett.com","peer2.org1.fejlett.com"]
}'
echo
echo

echo "POST request Join channel on Org2"
echo
curl -s -X POST \
  http://localhost:4000/api/channels/fejlettchannel/peers \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d '{
	"peers": ["peer0.org2.fejlett.com","peer1.org2.fejlett.com","peer2.org2.fejlett.com"]
}'
echo
echo

echo "POST Install chaincode on Org1"
echo
curl -s -X POST \
  http://localhost:4000/api/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org1.fejlett.com\",\"peer1.org1.fejlett.com\",\"peer2.org1.fejlett.com\"],
	\"chaincodeName\":\"$CCNAME\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"$CCVERSION\"
}"
echo
echo

echo "POST Install chaincode on Org2"
echo
curl -s -X POST \
  http://localhost:4000/api/chaincodes \
  -H "authorization: Bearer $ORG2_TOKEN" \
  -H "content-type: application/json" \
  -d "{
	\"peers\": [\"peer0.org2.fejlett.com\",\"peer1.org2.fejlett.com\",\"peer2.org2.fejlett.com\"],
	\"chaincodeName\":\"$CCNAME\",
	\"chaincodePath\":\"$CC_SRC_PATH\",
	\"chaincodeType\": \"$LANGUAGE\",
	\"chaincodeVersion\":\"$CCVERSION\"
}"
echo
echo

echo "POST instantiate chaincode on peer1 of Org1"
echo
curl -s -X POST \
  http://localhost:4000/api/channels/fejlettchannel/chaincodes \
  -H "authorization: Bearer $ORG1_TOKEN" \
  -H "content-type: application/json" \
  -d "{
  \"peers\": [\"peer0.org1.fejlett.com\",\"peer1.org1.fejlett.com\",\"peer2.org1.fejlett.com\",\"peer0.org2.fejlett.com\",\"peer1.org2.fejlett.com\",\"peer2.org2.fejlett.com\"],
	\"chaincodeName\":\"$CCNAME\",
	\"chaincodeVersion\":\"$CCVERSION\",
	\"chaincodeType\": \"$LANGUAGE\",
  \"args\":[\" \"]
}"
echo
echo

echo "Register Seller"
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/api/register  \
  -H "content-type: application/json" \
  -d '{
    "peer": ["peer1.org1.fejlett.com"],
    "fcn":"createUser",
    "channelName":"fejlettchannel",
    "chaincodeName":"invoice",
    "orgName":"Org1",
    "args":["test@email.com","Seller","test","97461675","pass"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo

echo "Register Buyer"
echo
TRX_ID=$(curl -s -X POST \
  http://localhost:4000/api/register \
  -H "content-type: application/json" \
  -d '{
    "peer": ["peer1.org1.fejlett.com"],
    "fcn":"createUser",
    "channelName":"fejlettchannel",
    "chaincodeName":"invoice",
    "orgName":"Org2",
    "args":["test1@email.com","Buyer","test","97461675","pass","2INTER10"]
}')
echo "Transacton ID is $TRX_ID"
echo
echo



echo "Total execution time : $(($(date +%s)-starttime)) secs ..."
