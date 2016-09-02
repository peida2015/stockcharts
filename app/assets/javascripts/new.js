"use strict";

$(document).ready(function () {
  if (window.callbacks === undefined) {
    window.callbacks = {};
  };
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDcwNKGkY22_SP4PQ1tUu8xOvkrfvuywFY",
    authDomain: "voltaic-tooling-115723.firebaseapp.com",
    databaseURL: "https://voltaic-tooling-115723.firebaseio.com",
    storageBucket: "voltaic-tooling-115723.appspot.com",
  };

  firebase.initializeApp(config);

  window.callbacks.toggleAppAuth = function () {
    if (firebase.auth().currentUser) {
      callbacks.signOutApp();
    } else {
      callbacks.signBackIn();
    }
  };

  window.callbacks.signOutApp = function () {
    // Sign out of the App with Firebase and Google.
    firebase.auth().signOut().then(function () {
      gapi.auth2.getAuthInstance().signOut().then(function () {
        location.reload();
      }, function() {
            console.log("Error signing out of firebase");
      }); // Google sign out end
    }, function () {
      console.log("Google sign out error");
    });//Firebase sign out end
  };

  window.callbacks.onFailure = function () {
    console.log('Did not log into Google');
    console.log('Google Auth Response', googleUser);
  };

  window.callbacks.signBackIn = function () {
    console.log("signBackIn");
      var googleUser = gapi.auth2.getAuthInstance().currentUser.get();
      onSignIn(googleUser);
    };

  window.callbacks.tryOut = function () {
    // "limited" is for app trial, only the symbol GOOG can be requested.
    window.callbacks.xhrReq("limited");
    var timer = d3.select('body').append('span').classed('timer', true);

    var startTime = new Date();
    // Sets a 5 minute timer to reload(exit the application).
    window.setTimeout(function () {
      console.log('reload');
      timer.remove();
      window.clearInterval(eachSec);
      location.reload();
    }, 300000, timer);

    var eachSec = window.setInterval(function () {
      var timeLeft = 300000 - (new Date() - startTime);
      var minLeft = Math.floor(timeLeft/60000);
      var secLeft = Math.floor(timeLeft%60000/1000);
      if (secLeft < 10) secLeft = "0"+secLeft;
      timer.text("Time Left: "+minLeft+":"+secLeft);
    }, 1000, startTime, timer);
  };
});



function onSignIn (googleUser) {
  $('#spinner').modal();
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
      console.log('signed in FireBase');
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

function renderButton(signInCB = onSignIn) {
  var buttonSpec = {
    'theme': 'dark',
    'longtitle': false,
    'width': 180,
    'height': 50,
    'scope': 'profile email',
    'onsuccess': signInCB
  };

  gapi.signin2.render('g-signin2', buttonSpec);
}
