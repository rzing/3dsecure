# 3dsecure
Multi Dimensional Security Model using AWS. 
### Details
Facial Recognition

`facial-recognition`: Contains source code for Kinesis Video Stream Producer and Cloudformation Template to spin up the infrastructure. Refer `facial-recognition\readme.md` for detailed explanation.

Voice-Authentication 

`voice-Authentication\Connect`: Contains AWS Connect contact flow json file, used to connect to customer once the facial recognition is done.
`voice-Authentication\Lex`: Contains all AWS Lex details and code for Slot Type, Intents and Bots.
`voice-Authentication\Lambda`: Contains AWS lambda function used in voice recognition which connects to DynamoDB and validates user details.  
