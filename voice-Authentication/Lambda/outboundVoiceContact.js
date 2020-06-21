            
                const AWS = require('aws-sdk');
                var docClient = new AWS.DynamoDB.DocumentClient();
            
                var connect = new AWS.Connect();
                // main entry to the flow
                
                exports.handler = (event, context, callback) => {
                    //define parameter values to use in initiating the outbound call
                    console.log("Event details: "+event);
                    console.log("customerId from event : "+event.customerId);
                    var customerId = event.customerId;
    
    				var param = {
    				TableName: 'voiceInput',
    				KeyConditionExpression: "customerId = :varNumber",
      				
    
      				ExpressionAttributeValues: {
       
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
    			
    				var name =  data.Items[0].name;
    				var contactNo =  data.Items[0].contactNo;
    			
    			
    			
    		               var paramsoutbound = {
                        ContactFlowId: "2918943e-3220-4214-87a0-f513a67bf8bb",
                        DestinationPhoneNumber: contactNo ,
                        InstanceId: "81d8a31c-b4d8-45cb-a59d-a374519acf54",
                        QueueId: "1d31501f-6a4f-4521-9c9b-67bd442b5bbd",
                        Attributes: {"CustomerName": name, "CustomerId":customerId},
                         SourcePhoneNumber: "+18336150725"
                    };
                    
    				
                    const response = {
                        statusCode: 200,
                        body: JSON.stringify('Outbound Dial Invoked'),
                    };
                    
                
                    // method used to initiate the outbound call from Amazon Connect
                    connect.startOutboundVoiceContact(paramsoutbound, function(err, data) {
                        if (err) {
                            console.log("Error occured !! "+err, err.stack) ;
                            callback(null, buildResponse(true, "none"));
                        } else { 
                            console.log("Outbound call from number "+ paramsoutbound.SourcePhoneNumber +" for customer: "+paramsoutbound.Attributes.CustomerName +" completed by dialing customer number "+paramsoutbound.DestinationPhoneNumber + "for CustomerId "+paramsoutbound.Attributes.CustomerId);
                           
                            callback(null, buildResponse(true, paramsoutbound.Attributes.CustomerName,paramsoutbound.ContactFlowId,customerId));
                        }
                    });
            
                    return response;
    			
    		
    				
       			} 
    			else {
        			console.log("Required Data not found");
        			callback(null, buildResponse(true, "none"));
       			}
      		}
    		
    		
     	});
                    
    
            
                };
            
                function buildResponse(isSuccess, CustomerName,ContactFlowId,CustomerId) {
                 	if (isSuccess) {
                  		return { 
                			CustomerName: CustomerName,
    						CustomerId : CustomerId,
                			ContactFlowId: ContactFlowId,
                			lambdaResult: "Success"
                		};
                 	} 
                	else {
                  		console.log("Lambda returned error to Connect");
                  		return { lambdaResult: "Error" };
                 	}
                }   