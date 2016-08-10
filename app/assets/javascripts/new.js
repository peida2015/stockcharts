"use strict";

(function () {
  document.onreadystatechange = function () {
    if (document.readyState === 'complete') {

      // Initialize Firebase
      var config = {
        apiKey: "AIzaSyDcwNKGkY22_SP4PQ1tUu8xOvkrfvuywFY",
        authDomain: "voltaic-tooling-115723.firebaseapp.com",
        databaseURL: "https://voltaic-tooling-115723.firebaseio.com",
        storageBucket: "voltaic-tooling-115723.appspot.com",
      };

      firebase.initializeApp(config);

    }
  }
})();


function onSignIn (googleUser) {
  console.log('Google Auth Response', googleUser);
  // We need to register an Observer on Firebase Auth to make sure auth is initialized.
  var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
    unsubscribe();
    // Check if we are already signed-in Firebase with the correct user.
    if (!isUserEqual(googleUser, firebaseUser)) {
      // Build Firebase credential with the Google ID token.
      var credential = firebase.auth.GoogleAuthProvider.credential(
        googleUser.getAuthResponse().id_token);
        // Sign in with credential from the Google user.
        firebase.auth().signInWithCredential(credential).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          // ...
        });
      } else {
        console.log('User already signed-in Firebase.');
      }
      
      var id_token = googleUser.getAuthResponse().id_token;

      callbacks.xhrReq(id_token);
    });

  }

function isUserEqual(googleUser, firebaseUser) {
  if (firebaseUser) {
    var providerData = firebaseUser.providerData;
    for (var i = 0; i < providerData.length; i++) {
      if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
        providerData[i].uid === googleUser.getBasicProfile().getId())
        {
          // We don't need to reauth the Firebase connection.
          return true;
        }
      }
    }
    return false;
}
