# Steps to run the Facial Recognition System

1. Apply the cloudformation script file cf.template from "cloudformation-template" folder in us-west-2 region.

2. Now, using the AWS CLI on the command line, let’s create a face collection.

       
       aws rekognition create-collection --collection-id rekVideoBlog --region us-west-2
       
3. Create a bucket with unique name in region us-west-2.

4. First, upload a picture of yourself to an Amazon S3 bucket in the us-west-2 Region. Then replace the S3BUCKET, MYFACE_KEY with the bucket and location within the bucket from which it was uploaded. For YOURNAME, type your name, and it will be used as the external image ID when it finds your face.
       
        aws rekognition index-faces --image '{"S3Object":{"Bucket":"<S3BUCKET>","Name":"<MYFACE_KEY>.jpeg"}}' --collection-id "rekVideoBlog" --detection-attributes "ALL" --external-image-id "<YOURNAME>" --region us-west-2

5. Now, let’s create the Kinesis Video Stream for our application to connect to below steps to follow:
	* Create Kinesis video stream.
	* Give it the name, “LiveRekognitionVideoAnalysisBlog.”
	* Leave the defaults and create your video stream.
	* Note down the Stream ARN.
6. The stream processor contains information about the Kinesis data stream and the Kinesis video stream. It also contains the identifier for the collection that contains the faces you want to recognize in the input streaming video. Steps to follow:
	* Create a JSON file that contains the following information:

              {
                     "Name": "streamProcessorForBlog",
                     "Input": {
                            "KinesisVideoStream": {
                                   "Arn": "<ARN_VIDEO_STREAM_YOU_CREATED>"
                            }
                     },
                     "Output": {
                            "KinesisDataStream": {
                                   "Arn": "<KINESIS_DATA_STREAM IN_CLOUDFORMATION_OUTPUT>"
                            }
                     },
                     "RoleArn": "<IAM_ROLE_ARN_IN_CLOUDFORMATION_OUTPUT>",
                     "Settings": {
                            "FaceSearch": {
                                   "CollectionId": "rekVideoBlog",
                                   "FaceMatchThreshold": 85.5
                                          }
                                   }
              }


	*      aws rekognition create-stream-processor --region us-west-2 --cli-input-json file://<PATH_TO_JSON_FILE_ABOVE> 
	*      aws rekognition start-stream-processor --name streamProcessorForBlog --region us-west-2
	* You can see if the stream processor is in a running state by doing a list:

              aws rekognition list-stream-processors --region us-west-2
	
       * Output of above command: 

              {
                     "StreamProcessors": [
                            {
                            "Status": "RUNNING", 
                            "Name": "streamProcessorForBlog"
                            }
                     ]
              }

7. Create a SQS standard queue with name "rekognitionqueue".

8. Give permission full access. 

9. Go to sns open your topic. then create subscription and take protocol as Amazon SQS and put your SQS ARN. 

10. Check the stream processor status by running command:

        aws rekognition list-stream-processors --region us-west-2

11. If stopped please run this command:

        aws rekognition start-stream-processor --name streamProcessorForBlog --region us-west-2

12. Import above java project (amazon-kinesis-video-streams-producer-sdk-java-master) in IDE as a Maven project.

13. In project -> Properties -> Java Build Path -> Source, click and expand the source details.

14. You will see the Native library location, click/highlight it.

15. Then click edit on the right, click the workspace again. Then browse src/main/resources/lib/windows then apply and close.

16. In file, src/main/demo/com/amazonaws/kinesisvideo/demoapp/PutMediaDemo.java change the MKV_FILE_PATH argument with the file path that you want to push to the video stream and change the myQueueUrl with the sqs queue URL.

17. Go to "run as" then "run configurations" then in arguments give  -Daws.accessKeyId=accesskey -Daws.secretKey=secretkey

18. Apply and run
	

