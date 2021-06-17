const functions = require("firebase-functions");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

//const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.myFunction = functions.firestore
    .document('CCTV_History/{docId}')
    .onCreate((snap, context) => {
        const newValue = snap.data();
        if(newValue.ei=='E' && newValue.Notofication!=1){

            const topic = 'log';
            const message = {
                notification: {
                    title: 'CCTV 알림',
                    body: newValue.comment
                },
                data: {
                    comment: newValue.comment,
                    visitorID: String(newValue.visitorID),
                    dt: newValue.dt
                },
                topic : topic
            }

            admin.messaging().send(message)
                .then((response) => {
                    return snap.ref.set({Notification: 1, response:response}, {merge: true});
                })
                .catch((error) => {
                    return snap.ref.set({Notification: 0, error:error}, {merge: true});
                });

        }
    });

exports.myStorage = functions.storage
    .object()
    .onFinalize(async (object) => {
        const fileBucket = object.bucket; // The Storage bucket that contains the file.
        const filePath = object.name; // File path in the bucket.
        const contentType = object.contentType; // File content type.
        const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.

        // Get the file name.
        const fileName = path.basename(filePath);
        const fileDir = path.dirname(filePath);

        await admin.firestore().collection(fileDir)
        .add({
            fileName: fileName,
            contentType: contentType
        });

        if(contentType.startsWith('video/')){
            
        }

        // Exit if this is triggered on a file that is not an image.
        if (!contentType.startsWith('image/')) {
            return functions.logger.log('This is not an image.');
        }
        
        // Exit if the image is already a thumbnail.
        if (fileName.startsWith('thumb_')) {
            return functions.logger.log('Already a Thumbnail.');
        }

        // Download file from bucket.
        // const bucket = admin.storage().bucket(fileBucket);
        // const tempFilePath = path.join(os.tmpdir(), fileName);
        // const metadata = {
        // contentType: contentType,
        // };
        // await bucket.file(filePath).download({destination: tempFilePath});
        // functions.logger.log('Image downloaded locally to', tempFilePath);
        // // Generate a thumbnail using ImageMagick.
        // await spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath]);
        // functions.logger.log('Thumbnail created at', tempFilePath);
        // // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
        // const thumbFileName = `thumb_${fileName}`;
        // const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
        // // Uploading the thumbnail.
        // await bucket.upload(tempFilePath, {
        // destination: thumbFilePath,
        // metadata: metadata,
        // });

        // // Once the thumbnail has been uploaded delete the local file to free up disk space.
        // return fs.unlinkSync(tempFilePath);
        
    });
