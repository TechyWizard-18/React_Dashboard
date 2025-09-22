// // This lets us create a callable function and handle errors
// const { onCall, HttpsError } = require("firebase-functions/v2/https");
//
// // These are the tools from the Firebase Admin SDK, which has full privileges
// const { initializeApp } = require("firebase-admin/app");
// const { getAuth } = require("firebase-admin/auth");
// const { getFirestore } = require("firebase-admin/firestore");
// const {https} = require("firebase/compat");
//
// // Initialize the Admin SDK
// initializeApp();
//
// /**
//  * Creates a new user in Firebase Authentication and a corresponding
//  * document in the 'users' collection in Firestore.
//  */
// exports.createNewUser = onCall(async (request) => {
//     // 1. Get the data from the React app
//     const { email, password, role } = request.data;
//
//     // 2. Validate the incoming data
//     if (!email || !password || !role) {
//         throw new HttpsError(
//             "invalid-argument",
//             "The function must be called with 'email', 'password', and 'role' arguments."
//         );
//     }
//
//     if (password.length < 6) {
//         throw new HttpsError(
//             "invalid-argument",
//             "Password must be at least 6 characters long."
//         );
//     }
//
//     // 3. Run the main logic inside a try...catch block to handle errors
//     try {
//         const adminAuth = getAuth();
//         const adminFirestore = getFirestore();
//
//         // Create the user in Firebase Authentication
//         const userRecord = await adminAuth.createUser({
//             email: email,
//             password: password,
//             emailVerified: true, // Optional: you can set this to false
//         });
//
//         // Create the user document in the 'users' collection in Firestore
//         await adminFirestore.collection("users").doc(userRecord.uid).set({
//             email: email,
//             role: role,
//         });
//
//         // 4. Send a success response back to the React app
//         return {
//             status: "success",
//             message: `Successfully created user ${email} with role ${role}.`,
//             uid: userRecord.uid,
//         };
//
//     } catch (error) {
//         // 5. Handle any errors that occurred
//         console.error("Error creating new user:", error);
//
//         if (error.code === "auth/email-already-exists") {
//             throw new HttpsError("already-exists", "This email address is already in use.");
//         }
//
//         throw new HttpsError("internal", "An unexpected error occurred.");
//     }
// });
//
//
//
// exports.deleteUser = https.onCall(async (data, context) => {
//     // 1. Authentication Check: Ensure the user calling this function is an admin.
//     // This is a crucial security step. You should have a custom claim 'admin'
//     // set to true on your admin users' accounts.
//     if (context.auth.token.admin !== true) {
//         throw new https.HttpsError(
//             "permission-denied",
//             "Only admins can delete users."
//         );
//     }
//
//     const uid = data.uid;
//     if (!uid) {
//         throw new https.HttpsError(
//             "invalid-argument",
//             "The function must be called with a 'uid' argument."
//         );
//     }
//
//     try {
//         // 2. Delete from Firebase Authentication
//         await admin.auth().deleteUser(uid);
//
//         // 3. Delete from 'users' collection in Firestore
//         await admin.firestore().collection("users").doc(uid).delete();
//
//         return { message: `Successfully deleted user ${uid}` };
//     } catch (error) {
//         console.error("Error deleting user:", error);
//         throw new https.HttpsError(
//             "internal",
//             "An error occurred while trying to delete the user."
//         );
//     }
// });


// This lets us create a callable function and handle errors
const { onCall, HttpsError } = require("firebase-functions/v2/https");

// These are the tools from the Firebase Admin SDK, which has full privileges
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize the Admin SDK
initializeApp();

/**
 * Creates a new user in Firebase Authentication and a corresponding
 * document in the 'users' collection in Firestore.
 */
exports.createNewUser = onCall(async (request) => {
    // 1. Get the data from the React app
    const { email, password, role } = request.data;

    // 2. Validate the incoming data
    if (!email || !password || !role) {
        throw new HttpsError(
            "invalid-argument",
            "The function must be called with 'email', 'password', and 'role' arguments."
        );
    }

    if (password.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "Password must be at least 6 characters long."
        );
    }

    // 3. Run the main logic inside a try...catch block to handle errors
    try {
        const adminAuth = getAuth();
        const adminFirestore = getFirestore();

        // Create the user in Firebase Authentication
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            emailVerified: true, // Optional: you can set this to false
        });

        // Create the user document in the 'users' collection in Firestore
        await adminFirestore.collection("users").doc(userRecord.uid).set({
            email: email,
            role: role,
        });

        // 4. Send a success response back to the React app
        return {
            status: "success",
            message: `Successfully created user ${email} with role ${role}.`,
            uid: userRecord.uid,
        };

    } catch (error) {
        // 5. Handle any errors that occurred
        console.error("Error creating new user:", error);

        if (error.code === "auth/email-already-exists") {
            throw new HttpsError("already-exists", "This email address is already in use.");
        }

        throw new HttpsError("internal", "An unexpected error occurred.");
    }
});



/**
 * Deletes a user by their email address.
 * This function can be called by ANY authenticated user.
 */
/**
 * Deletes a user by their email address, with added debugging logs.
 */
/**
 * Deletes a user by their email address.
 * Finds the Firestore document via a query on the email field.
 */
exports.deleteUser = onCall(async (request) => {
    console.log("--- deleteUser function (email query version) triggered ---");

    if (!request.auth) {
        throw new HttpsError("unauthenticated", "You must be logged in.");
    }

    const emailToDelete = request.data.email;
    if (!emailToDelete) {
        throw new HttpsError("invalid-argument", "Email is required.");
    }

    if (emailToDelete === "admin@circulyte.com") {
        throw new HttpsError("permission-denied", "The main admin account cannot be deleted.");
    }

    try {
        const adminAuth = getAuth();
        const adminFirestore = getFirestore();

        // Step 1: Delete the user from Firebase Authentication
        // We need to get their UID first to confirm they exist.
        const userRecord = await adminAuth.getUserByEmail(emailToDelete);
        await adminAuth.deleteUser(userRecord.uid);
        console.log(`Successfully deleted user '${emailToDelete}' from Authentication.`);

        // Step 2: Find and delete the user from Firestore using a query
        console.log(`Querying Firestore for document with email: '${emailToDelete}'`);
        const query = adminFirestore.collection("users").where("email", "==", emailToDelete);
        const snapshot = await query.get();

        if (snapshot.empty) {
            console.log("No matching document found in Firestore to delete. This is okay if they were already gone.");
        } else {
            // Use a batch to delete all found documents (usually just one)
            const batch = adminFirestore.batch();
            snapshot.forEach(doc => {
                console.log(`Found Firestore document to delete: ${doc.id}`);
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log("Successfully deleted document(s) from Firestore.");
        }

        return { message: `Successfully deleted user ${emailToDelete}` };

    } catch (error) {
        console.error("--- AN ERROR OCCURRED ---", error);
        if (error.code === 'auth/user-not-found') {
            throw new HttpsError("not-found", `User with email ${emailToDelete} not found in Authentication.`);
        }
        throw new HttpsError("internal", "An error occurred. Check function logs.");
    }
});