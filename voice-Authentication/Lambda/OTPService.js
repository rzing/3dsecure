var AWS = require("aws-sdk");
var pinpoint = new AWS.Pinpoint();

//main entry 
exports.handler = (event, context, callback) => {
    console.log("Incoming Event: " + JSON.stringify(event));
    
    var otp = Math.floor(100000 + Math.random() * 9000);
    console.log(otp);
    //You must have these attributes set in your Contact Flow prior to invoking lambda function
    var destinationNumber = event.Details.ContactData.Attributes.customerNum;
    var messageContent = event.Details.ContactData.Attributes.messageContent;
    var balance = event.Details.ContactData.Attributes.balance;
    var datetime = event.Details.ContactData.Attributes.datetime;
    var message = otp;
   // var CustomerName = event.Details.ContactData.Attributes.CustomerName;
   // var address = event.Details.ContactData.Attributes.address;
    //var zipCode = event.Details.ContactData.Attributes.zipCode;
    //var branchMessage = "Your nearest branch is:";
    //var branchAddress = event.Details.ContactData.Attributes.branchAddress;
    var messageToSend = messageContent +" - " + message ;
    console.log("Message to be sent from pinpoint service is: "+messageToSend);

    var params = {
        //ApplicationId must match the ID of the application you created in AWS Mobile Hub
        ApplicationId: "d58b214e578e4b6ca14415436a1a05bc",
        MessageRequest: {
            Addresses: {
                [destinationNumber]: {
                    ChannelType: "SMS",
                },
            },
            MessageConfiguration: {
                SMSMessage: {
                    Body: messageToSend,
                    MessageType: "PROMOTIONAL",
                    SenderId: "AWS",
                }
            },
        }
    };

    // Send the SMS
    pinpoint.sendMessages(params, function(err, data) {
        if (err) {
            console.log(err);
            context.fail(buildResponse(false));
        } else {
            console.log("Great Success");
            callback(null, buildResponse(true,message,balance,datetime));
        }
    });
};

// Return Result to Connect
function buildResponse(isSuccess,message,balance,datetime) {
    if (isSuccess) {
        return {
            OTP: message,
            lambdaResult: "Success",
            balance: balance,
            datetime: datetime
            
        };
    } else {
        return {
            lambdaResult: "Error"
        };
    }
}