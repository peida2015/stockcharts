"use strict";
(function () {
  if (window._GraphBuilder === undefined) {
    window._GraphBuilder = {};
  };

  if (window.callbacks === undefined) {
    window.callbacks = {};
  }

  var GraphBuilder = _GraphBuilder.GraphBuilder = function (stockData, req = {}, height = 600, width = 1000, xPadding = 100, yPadding = 50) {
    this.stockData = stockData; //Note: only "results" from response
    this.graphData = [];
    this.req = req;
    this.svgBody = null;
    this.height = height;
    this.width = width;
    this.xPadding = xPadding;
    this.yPadding = yPadding;
  };

  GraphBuilder.prototype = {
    setSVG: function () {
      this.svgBody = d3.select('body')
        .append('div').classed('centered', true)
        .classed('top-margin', true)
        .append('svg').attr('class', 'chart')
        .datum(this.graphData)
        .attr('height', this.height)
        .attr('width', this.width);

      this.svgBody.exit().remove();

      this.drawSymbol();

      // Remove the prompt to sign in.
      d3.select('.welcome').remove();
    },

    tradingDayConversion: function () {
      var parser = d3.timeParse("%Y-%m-%d");

      this.stockData.forEach(function (d) {
        return d.tradingDay = parser(d.tradingDay);
      });

      var startDate = this.stockData[0].tradingDay;
      var endDate = this.stockData[this.stockData.length-1].tradingDay;
    },

    convertWeeklyData: function () {
      this.weeklyData = [];
      var currWkHigh = 0;
      var currWkLow = Infinity;
      var currWkOpen;
      var currWkClose;
      var currWkVol;
      var currWk = { };

      for (var i = 0; i < this.stockData.length; i++) {
        var currDay = this.stockData[i].tradingDay;

        if (i == 0 && currDay.getDay() !== 1) {
          // Skip first week if first week does not have complete week data
          switch (currDay.getDay()) {
            case 2: i += 3;
            case 3: i += 2;
            case 4: i += 1;
          }
          continue;
        };

        if (currDay.getDay() === 1) {
          currWkOpen = this.stockData[i].open;
          currWk["tradingDay"] = currDay;
          currWkVol = this.stockData[i].volume;
        } else {
          currWkVol += this.stockData[i].volume;
        }

        if (this.stockData[i].high > currWkHigh) {
          currWkHigh = this.stockData[i].high;
        }

        if (this.stockData[i].low < currWkLow) {
          currWkLow = this.stockData[i].low;
        }

        // If Friday is missing, take Thursday as last day of the week. Ignore any week with more than two days missing.
        if (currDay.getDay() === 5 ||
            (currDay.getDay() === 4 && this.stockData[i+1].tradingDay.getDay() !== 5)) {
          currWkClose = this.stockData[i].close;
          currWk["symbol"] = this.stockData[i].symbol;
          currWk["open"] = currWkOpen;
          currWk["high"] = currWkHigh;
          currWk["low"] = currWkLow;
          currWk["close"] = this.stockData[i].close;
          currWk["volume"] = currWkVol;
          if (currWk["tradingDay"] === undefined) {
            if (currDay.getDay() === 5) {
              currWk["tradingDay"] = new Date(currDay-1000*60*60*24*4);
            } else {
              currWk["tradingDay"] = new Date(currDay-1000*60*60*24*3);
            }
          }
          this.weeklyData.push(currWk);
          var currWkHigh = 0;
          var currWkLow = Infinity;
          currWk = {};
        }
      }
    },

    dataSelector: function () {
      this.graphData = this.stockData.length < 100 ? this.stockData : this.weeklyData;
    },

    drawAxes: function () {
      var startDate = this.graphData[0].tradingDay;
      var endDate = this.graphData[this.graphData.length-1].tradingDay;

      // Create axis from scaleTime with preset domain and range;
      this.xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, this.width - 2*this.xPadding]);

      var xAxis = d3.axisBottom(this.xScale);

      // Attach the drawn x-axis to the SVG body
      var xDrawn = this.svgBody.append('g')
        .attr('class', 'xAxis')
        .attr('transform', 'translate('+ this.xPadding + ', '+ (this.height-3*this.yPadding)+')')
        .call(xAxis);

      // Create axis from a scale maximum and minimum stock values
      var max = -Infinity;
      var min = Infinity;

      for (var idx = 0; idx < this.graphData.length; idx++) {
        if (this.graphData[idx].high > max) {
            max = this.graphData[idx].high;
        };
        if (this.graphData[idx].low < min) {
            min = this.graphData[idx].low;
        };
      }

      this.yScale = d3.scaleLinear()
        .domain([min, max])
        .range([this.height - 4*this.yPadding, 0]);
      var yAxis = d3.axisLeft(this.yScale);

      var yDrawn = this.svgBody.append('g')
        .attr('class', 'yAxis')
        .attr('transform', 'translate('+this.xPadding+', '+this.yPadding+')')
        .call(yAxis);

      // Draw grid
      d3.selectAll('.xAxis .tick').append('line')
        .attr('class', 'grid')
        .attr('x1',0.5)
        .attr('x2',0.5)
        .attr('y2', 4*this.yPadding - this.height);

      d3.selectAll('.yAxis .tick').append('line')
        .attr('class', 'grid')
        .attr('y1',0.5)
        .attr('y2',0.5)
        .attr('x2', this.width - 2*this.xPadding);

      // Attach y-axis label
      yDrawn.append('text')
        .attr('transform','rotate(-90)')
        .attr('dx', 0)
        .attr('dy', -40)
        .text('Price ($)');
    },

    drawLineGraph: function () {
      var that = this;
      var line = d3.line()
        .x(function (d) {  return that.xScale(d.tradingDay);  })
        .y(function (d) {  return that.yScale(d.close);  });

      var lineDrawn = this.svgBody.append('g')
        .attr('class','line');

      lineDrawn
        .append('path')
        .attr('transform', 'translate('+this.xPadding+', '+this.yPadding+')')
        .attr('d',line);

      //return lineDrawn so other elements can be attached to it.
      return lineDrawn;
    },

    drawPricesBox: function (line) {
      var box = line.append('g')
                .attr('class','box');
      var rect = box.append('rect');
      var high = box.append('text');
      var low = box.append('text');
      var open = box.append('text');
      var close = box.append('text');
      var volume = box.append('text');
      var tDay = box.append('text');

      var that = this;
      line.on('mouseover', that.mouseoverCallback.bind(that, box, rect, high, low, open, close, volume, tDay));
    },

    mouseoverCallback: function () {
      var eventCoor = d3.mouse(arguments[10][0]);
      var box = arguments[0];
      var rect = arguments[1];
      var high = arguments[2];
      var low = arguments[3];
      var open = arguments[4];
      var close = arguments[5];
      var volume = arguments[6];
      var tDay = arguments[7];

      var currDate = this.xScale.invert(eventCoor[0]-100);

      var currVal = this.stockData.find(function (item) {
        return (
          item.tradingDay.getDate() === currDate.getDate() && item.tradingDay.getMonth() === currDate.getMonth() && item.tradingDay.getFullYear() === currDate.getFullYear());
      });

      if (currVal !== undefined) {
        rect
          .attr('x', eventCoor[0])
          .attr('y', eventCoor[1])
          .attr('width',120)
          .attr('height',80);

        high
          .attr('x', eventCoor[0] + 10)
          .attr('y', eventCoor[1] + 10)
          .text("High: "+currVal.high);

        low
          .attr('x', eventCoor[0] + 10)
          .attr('y', eventCoor[1] + 20)
          .text("Low: "+currVal.low);

        open
          .attr('x', eventCoor[0] + 10)
          .attr('y', eventCoor[1] + 30)
          .text("Open: "+currVal.open);

        close
          .attr('x', eventCoor[0] + 10)
          .attr('y', eventCoor[1] + 40)
          .text("Close: "+currVal.close);

        volume
          .attr('x', eventCoor[0] + 10)
          .attr('y', eventCoor[1] + 50)
          .text("Volume: "+currVal.volume);

        tDay
          .attr('x', eventCoor[0] + 10)
          .attr('y', eventCoor[1] + 70)
          .text(currVal.tradingDay.toDateString());

      } else {
        rect.attr('width', 0).attr('height', 0);
        open.text('');
        close.text('');
        high.text('');
        low.text('');
        volume.text('');
        tDay.text('');
      }
    },

    drawVolAxes: function () {
      var xAxis = d3.axisBottom(this.xScale);
      this.svgBody.append('g')
        .attr('class', 'volX')
        .attr('transform', 'translate('+this.xPadding+','+(this.height-this.yPadding)+')')
        .call(xAxis);

      var volExt = d3.extent(this.graphData, function (obj) {
        return obj.volume;
      })

      this.volYScale = d3.scaleLinear()
          .domain(volExt)
          .range([1.5*this.yPadding, 0])
          .nice();

      var yAxis = d3.axisLeft(this.volYScale)
              .tickFormat(d3.format(".2s"));

      var yDrawn = this.svgBody.append('g')
        .attr('class', 'volY')
        .attr('transform', 'translate('+this.xPadding+','+(this.height-2.5*this.yPadding)+')')
        .call(yAxis.ticks(2));

      yDrawn.append('text')
        .attr('dx', 10)
        .attr('dy', 0)
        .text('Vol');
    },

    drawVolBars: function () {
      var stack = d3.stack().keys(["volume"])

      var barchart = d3.select('.volX').append('g')
        .attr('class', 'barchart')
        .selectAll('.volBars')
        .data(this.graphData)
        .enter();

      var that = this;

      barchart
        .append('line')
        .attr('y2', function (d) {
          return -that.volYScale(d.volume);
        })
        .attr('x1', function (d) {
          return that.xScale(d.tradingDay);
        })
        .attr('x2', function (d) {
          return that.xScale(d.tradingDay);
        });

      barchart.exit().remove();
    },

    drawSymbol: function () {
      var that = this;

      var symb = this.svgBody.append('g')
        .attr('transform', 'translate('+that.width/2+','+that.yPadding/2+')')
        .attr('class', 'symbol');

      symb.append('text')
        .text(function (d) {
          return  d[0].symbol;
        });

      var bgColor = symb.insert('rect', ":first-child")
        .attr('x', 0)
        .attr('y', -symb.node().lastChild.getBBox().height+5)
        .attr('width', symb.node().lastChild.getBBox().width)
        .attr('height', symb.node().lastChild.getBBox().height);

      symb.on("click", function (d) {
          bgColor.classed("focused", true);

          var pressCounter = 0;

          d3.select(document).on("keyup", function () {
            pressCounter++;
            var symEl = d3.select('.symbol text');
            if (pressCounter == 1) { symEl.text(" "); }
            if (d3.event.key.match(/^[\w.]$/)) {
              symEl.text((symEl.text()+d3.event.key).trimLeft());
              bgColor.attr('width', symEl.node().getBBox().width);
            } else if (d3.event.key === "Backspace") {
              symEl.text(symEl.text().slice(0, -1));
              bgColor.attr('width', symEl.node().getBBox().width|10);
            } else if (d3.event.key === "Enter") {
              that.dataRequest(symEl.text().toUpperCase().trim());
            }
          });
        });

    },

    drawTimeline: function () {
      var startDate = this.stockData[0].tradingDay;
      var endDate = this.stockData[this.stockData.length-1].tradingDay;

      // Create axis from scaleTime with preset domain and range;
      var xScale = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, this.width - 2*this.xPadding]);

      var xAxis = d3.axisBottom(xScale);

      var timeline = this.svgBody.append('g')
        .attr('class', 'timeline')
        .attr('transform', 'translate('+ this.xPadding+', '+(this.height-20)+')')

      timeline.call(xAxis);

      timeline.append('rect')
        .attr('class', 'timelineArea')
        .attr('width', this.width-2*this.xPadding)
        .attr('height', 20);

      var rangeRect = timeline.append('rect')
        .attr('class', 'timeRange')
        .attr('width', this.width-2*this.xPadding)
        .attr('height', 20);

      var leftHandle = timeline.append('rect')
        .attr('class', 'handle')
        .attr('width', 8)
        .attr('height', 12)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('y', 4)
        .attr('x', -4);

      var rightHandle = timeline.append('rect')
        .attr('class', 'handle')
        .attr('width', 8)
        .attr('height', 12)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('y', 4)
        .attr('x', this.width-2*this.xPadding-4);

    },

    dataRequest: function (symbol) {
      //Remove keyup listener
      d3.select(document).on("keyup", null);
      d3.selectAll('.focused').classed('focused', false);

      window.callbacks.xhrReq(this.req.id_token, symbol);
      console.log("dataRequest "+symbol);
    },

    createChart: function () {
      this.tradingDayConversion();
      this.convertWeeklyData();
      this.dataSelector();
      this.setSVG();
      this.drawAxes();
      var line = this.drawLineGraph();
      this.drawPricesBox(line);
      this.drawVolAxes();
      this.drawVolBars();
      this.drawTimeline();
    },

    updateChart: function (stockData, req) {
      this.stockData = stockData;
      this.svgBody.remove();

      this.createChart();
    }

  }

  var buildGraph = callbacks.buildGraph = function (data) {
    if (data.status.code === 200) {
      var graph = window._GraphBuilder.singleInstance;
      if (graph === undefined) {
        graph = window._GraphBuilder.singleInstance = new _GraphBuilder.GraphBuilder(data.results, data.request, 600, $('body').width());
        graph.createChart();
      } else {
        graph.updateChart(data.results, data.request)
      }
    }

  }
})();
