var AWS = require("aws-sdk");
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {
	var datetime = new Date(Date.now()).toLocaleString();
    console.log("Todays data in lambda is: "+datetime);
   // var customerId = "1";
    var message;
	//var phrase_input = event['currentIntent']['slots']['Phrase'];
	var phrase_input = event.Details.ContactData.Attributes.Phrase;
	var customerId = event.Details.ContactData.Attributes.CustomerId;
	console.log("Input Details are:" + phrase_input);
	console.log("Input customerId Details are:" + customerId);
	
 	var param = {
				TableName: 'voiceInput',
				KeyConditionExpression: "customerId = :varNumber",
  				//IndexName: "customerPhone-index",

  				ExpressionAttributeValues: {
   					//":varNumber": "+13473936090"
   					":varNumber": customerId
  				}
 			};
 			
 			docClient.query(param, function(err, data) {
  		if (err) {
   			console.log(err); // an error occurred
   			context.fail(buildResponse(false));
  		} 
		else {
   			console.log("DynamoDB Query Results:" + JSON.stringify(data));
			
   			if (data.Items.length === 1) {
   			console.log("Dynamo DB Phrase value is: "+data.Items[0].phrase);	
				var phrase = data.Items[0].phrase;
				var name =  data.Items[0].name;
				var customerId =  data.Items[0].customerId;
				var balance =  data.Items[0].balance;
				if(phrase_input.toString() === phrase){
				    console.log("Matched");
				    message = "User Authenticated";
				}
				else{
				    console.log("Not Matched");
				    message = "User Authentication Failed.";
				}
				callback(null, buildResponse(true,name,phrase,customerId,message,balance,datetime))
   			} 
			else {
    			console.log("Required Data not found");
    			callback(null, buildResponse(true, "none"));
   			}
  		}
 	});

};

function buildResponse(isSuccess,name,phrase,customerId,message,balance,datetime) {
 	if (isSuccess) {
  		return { 
			name: name,
			phrase: phrase,
			customerId:customerId,
			message: message,
			balance:balance,
			datetime:datetime,
			lambdaResult: "Success"
		};
 	} 
	else {
  		console.log("Lambda returned error to Connect");
  		return { lambdaResult: "Error" };
 	}
}