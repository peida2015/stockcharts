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
    };
  };

  window.callbacks.toggleAppAuth = function () {
    if (firebase.auth().currentUser) {
      callbacks.signOutApp();
    } else {
      callbacks.signBackIn();
    }
  };

  window.callbacks.signOutApp = function () {
    // Sign out of the App with Firebase.
      firebase.auth().signOut().then(function () {
        $.get('./', function (page) {
          var parser = new DOMParser();
          var newPage = parser.parseFromString(page, 'text/html');
          $(document.body).replaceWith(newPage.body);
          var button = $('a:contains("Logout")');
          if (button.length > 0) {
            button.text('Login');
            console.log('signed out FB');
          }
        })
      }, function () {
        console.log("Sign out error");
      });
    };

  window.callbacks.signBackIn = function () {
      var googleUser = gapi.auth2.getAuthInstance().currentUser.hg;
      onSignIn(googleUser);
    };
})();



function onSignIn (googleUser) {
  console.log('Google Auth Response', googleUser);
  // We need to register an Observer on Firebase Auth to make sure auth is initialized.
  var unsubscribe = firebase.auth().onAuthStateChanged(function(firebaseUser) {
    unsubscribe();
    // Check if we are already signed-in Firebase with the correct user.
    var id_token = googleUser.getAuthResponse().id_token;

    if (!isUserEqual(googleUser, firebaseUser)) {
      // Build Firebase credential with the Google ID token.
      var credential = firebase.auth.GoogleAuthProvider.credential(id_token);
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

    var button = $('a:contains("Login")');
    if (button.length > 0) {
      button.text('Logout');
      console.log('signed in FB');
    };

    window.callbacks.xhrReq(id_token);

  });
};

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
};
