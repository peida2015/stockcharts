"use strict";

(function () {
  if (window.callbacks === undefined) {
    window.callbacks = {};
  };

  window.callbacks.xhrReq = function (id_token = "limited", symbol = "GOOG", startDate = "20130510", endDate = "20150401") {
    var url = './stock_data';
    var method = 'POST';
    var xhr = new XMLHttpRequest();

    // Check to see if the browser is Firefox, Chrome, etc.  If not, use XDomainRequest() constructor for IE.
    if ("withCredentials" in xhr) {
      xhr.open(method, encodeURI(url), true);
    } else {
      xhr = new XDomainRequest();
      xhr.open(method, url);
    };

    // Must set this header for X-Domain requests.
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.onload = function () {
      if (xhr.status !== 200) {
        console.log("Request failed. "+xhr.status);
      } else {
        window.callbacks.buildGraph(JSON.parse(xhr.response));
        console.log("success");
      };
    };  // Callback function for the XMLHttpRequest.

    var token_data = JSON.stringify({
      "id_token": id_token,
      "symbol": symbol,
      "type": "daily",
      "startDate": startDate,
      "endDate": endDate
    });
    xhr.send(token_data);
  };

})();
