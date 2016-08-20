#Stock Charts [Live Demo](http://plocks.herokuapp.com)

## Introduction

This is my third [D3.js](https://github.com/d3) mini-project.  Investors have used many different charts and metrics to help guide their investment decisions.  I aim to develop an application that mimic some basic functionalities of charting applications.  It is a natural context to demonstrate the capabilities of D3.js library.

## Data Disclaimer

This website is for demonstration purpose only.  Stock data is provided by BarChart getHistory API.  Data comes with delays and limited to two years of daily data or 3 weeks of intraday data.

## Minimum Viable Product

[ ] Google Sign-In;
[ ] Aggregate daily stock data into weekly stock data;
[ ] Display stock data in a line graph;
[ ] Display stock data in a Candlestick chart;
[ ] Allow users to choose between the two types of charts;
[ ] Display volume data in a barchart;
[ ] Allow users to enter and request data for another stock.
[ ] Use an interactive timeline to allow users to select the range of dates to display stock charts;
[ ] Automatically choose appropriate type of data (weekly vs daily) for best display of Candlestick charts;


## Technical Considerations

1. Use stock data from BarChart getHistory API without exposing the API key on the frontend JavaScript codes.  API key is set as environment variable to a rails app that fetches data and relays it to frontend JS code.

2. Google Sign-In. (Mainly for practicing working with OAuth 2.0 authorization protocol implementation and identity providers such as Google.)

3. Delegate all of the user management backend code to a firebase app to manage users (alongside Google Sign-In).

4. Object-oriented programming.  Use a single instance of `GraphBuilder` to manage instance data and build different types of graphs.  

5. Minimize the number of API calls, which is limited to 1500 queries/day, by requesting the daily data for a maximum date range (2 years) for each symbol and produce weekly data in frontend.

6. Use a binary search helper method in getRangeData to select data within a time range.


## Features for the Future

1. Allow users to get week, month, 3 month, 6 month, YTD, and 52-week charts with 1-click.

2. Integrate StockTwits API for better user interactions with other investors.

3. Use Redis as data store to store commonly requested stock data to minimize repeated API calls for popular symbols.

4. Use Firebase database to store most recently quoted stock symbols for users (So they have a reason to sign-in. :smile:)
