package com.amazonaws.kinesisvideo.demoapp;

import com.amazonaws.kinesisvideo.demoapp.auth.AuthHelper;

import com.amazonaws.services.kinesisvideo.AmazonKinesisVideo;
import com.amazonaws.services.kinesisvideo.AmazonKinesisVideoAsyncClient;
import com.amazonaws.services.kinesisvideo.AmazonKinesisVideoPutMedia;
import com.amazonaws.services.kinesisvideo.AmazonKinesisVideoPutMediaClient;
import com.amazonaws.services.kinesisvideo.PutMediaAckResponseHandler;
import com.amazonaws.services.kinesisvideo.model.AckEvent;
import com.amazonaws.services.kinesisvideo.model.FragmentTimecodeType;
import com.amazonaws.services.kinesisvideo.model.GetDataEndpointRequest;
import com.amazonaws.services.kinesisvideo.model.PutMediaRequest;

import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URI;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CountDownLatch;

import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.AmazonSQSClientBuilder;
import com.amazonaws.services.sqs.model.AmazonSQSException;
import com.amazonaws.services.sqs.model.DeleteMessageRequest;
import com.amazonaws.services.sqs.model.Message;
import com.amazonaws.services.sqs.model.PurgeQueueRequest;
import com.amazonaws.services.sqs.model.ReceiveMessageRequest;


/**
 * An example on how to send an MKV file to Kinesis Video Streams.
 *
 * If you have other video formats, you can use ffmpeg to convert to MKV. Only H264 videos are playable in the console.
 * Steps to convert MP4 to MKV:
 *
 * 1. Install ffmpeg if not yet done so already:
 *
 *      Mac OS X:
 *          brew install ffmpeg --with-opus --with-fdk-aac --with-tools --with-freetype --with-libass --with-libvorbis
 *          --with-libvpx --with-x265 --with-libopus
 *
 *      Others:
 *          git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
 *          ./configure
 *          make
 *          make install
 *
 *  2. Convert MP4 to MKV
 *       ffmpeg -i input.mp4 -b:v 10M -minrate 10M -maxrate 10M -bufsize 10M -bf 0 input.mkv
 */
public final class PutMediaDemo {
    private static final String DEFAULT_REGION = "us-west-2";
    private static final String PUT_MEDIA_API = "/putMedia";

    /* the name of the stream */
    private static final String STREAM_NAME = "LiveRekognitionVideoAnalysisBlog";
    private static final String myQueueUrl="https://sqs.us-west-2.amazonaws.com/961853145745/rekognitionqueue";
    /* sample MKV file */
    private static final String MKV_FILE_PATH = "src/main/resources/data/mkv/bezos_vogels.mkv";
    final static AmazonSQS sqs = AmazonSQSClientBuilder.defaultClient();
    /* max upload bandwidth */
    private static final long MAX_BANDWIDTH_KBPS = 15 * 1024L;

    /* response read timeout */
    private static final int READ_TIMEOUT_IN_MILLIS = 1_000_000;

    /* connect timeout */
    private static final int CONNECTION_TIMEOUT_IN_MILLIS = 10_000;

    private PutMediaDemo() { }
    public static void main(final String[] args) throws Exception {
        final AmazonKinesisVideo frontendClient = AmazonKinesisVideoAsyncClient.builder()
                .withCredentials(AuthHelper.getSystemPropertiesCredentialsProvider())
                .withRegion(DEFAULT_REGION)
                .build();
        
        System.out.println("SENDING THE VIDEO TO KINESIS VIDEO STREAM FOR PROCESSING.........");
        
        sqs.purgeQueue(new PurgeQueueRequest(myQueueUrl));
         Thread.sleep(40000);

        /* this is the endpoint returned by GetDataEndpoint API */
        final String dataEndpoint = frontendClient.getDataEndpoint(
                new GetDataEndpointRequest()
                        .withStreamName(STREAM_NAME)
                        .withAPIName("PUT_MEDIA")).getDataEndpoint();

        /* send the same MKV file over and over */
      //this we commented     while (true) {
            /* actually URI to send PutMedia request */
            final URI uri = URI.create(dataEndpoint + PUT_MEDIA_API);

            /* input stream for sample MKV file */
            final InputStream inputStream = new FileInputStream(MKV_FILE_PATH);

            /* use a latch for main thread to wait for response to complete */
            final CountDownLatch latch = new CountDownLatch(1);

            /* PutMedia client */
            final AmazonKinesisVideoPutMedia dataClient = AmazonKinesisVideoPutMediaClient.builder()
                    .withRegion(DEFAULT_REGION)
                    .withEndpoint(URI.create(dataEndpoint))
                    .withCredentials(AuthHelper.getSystemPropertiesCredentialsProvider())
                    .withConnectionTimeoutInMillis(CONNECTION_TIMEOUT_IN_MILLIS)
                    .build();

            final PutMediaAckResponseHandler responseHandler = new PutMediaAckResponseHandler()  {
                @Override
                public void onAckEvent(AckEvent event) {
                    System.out.println("onAckEvent " + event);
                }

                @Override
                public void onFailure(Throwable t) {
                    latch.countDown();
                    System.out.println("onFailure: " + t.getMessage());
                    // TODO: Add your failure handling logic here
                }

                @Override
                public void onComplete() {
                    System.out.println("onComplete");
                    //these two lines added by me
                    

                    try {
						Thread.sleep(2000);
					} catch (InterruptedException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
                    final ReceiveMessageRequest receiveMessageRequest =
                            new ReceiveMessageRequest(myQueueUrl);
                    List<Message> messages = sqs.receiveMessage(receiveMessageRequest).getMessages();
                   
                    if(messages.isEmpty())
                    {
                    	System.out.println("USER IS NOT AUTHENTICATED");
                    }else {
                    	
                    	System.out.println("USER AUTHENTICATION SUCCESSFUL");
                    }
                   
                    	
                   
                    latch.countDown();
                }
            };

            /* start streaming video in a background thread */
            dataClient.putMedia(new PutMediaRequest()
                            .withStreamName(STREAM_NAME)
                            .withFragmentTimecodeType(FragmentTimecodeType.RELATIVE)
                            .withPayload(inputStream)
                            .withProducerStartTimestamp(Date.from(Instant.now())),
                    responseHandler);

            /* wait for request/response to complete */
            latch.await();

            /* close the client */
            dataClient.close();
     //this we commented   }
    }
}
