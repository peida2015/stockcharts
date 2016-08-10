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
        .datum(this.stockData)
        .attr('height', this.height)
        .attr('width', this.width);

      this.svgBody.exit().remove();

      this.drawSymbol();

      // Remove the prompt to sign in.
      d3.select('.welcome').remove();
    },

    // tradingDay data conversion
    tradingDayConversion: function () {
      var parser = d3.timeParse("%Y-%m-%d");

      this.stockData.forEach(function (d) {
        return d.tradingDay = parser(d.tradingDay);
      });

      var startDate = this.stockData[0].tradingDay;
      var endDate = this.stockData[this.stockData.length-1].tradingDay;
    },

    drawAxes: function () {
      var startDate = this.stockData[0].tradingDay;
      var endDate = this.stockData[this.stockData.length-1].tradingDay;

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

      for (var idx = 0; idx < this.stockData.length; idx++) {
        if (this.stockData[idx].high > max) {
            max = this.stockData[idx].high;
        };
        if (this.stockData[idx].low < min) {
            min = this.stockData[idx].low;
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

      var volExt = d3.extent(this.stockData, function (obj) {
        return obj.volume;
      })

      this.volYScale = d3.scaleLinear()
          .domain(volExt)
          .range([1.5*this.yPadding, 0])
          .nice();

      var yAxis = d3.axisLeft(this.volYScale);

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
        .data(this.stockData)
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
            if (d3.event.key.match(/^\w$/)) {
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

    dataRequest: function (symbol) {
      //Remove keyup listener
      d3.select(document).on("keyup", null);
      d3.selectAll('.focused').classed('focused', false);

      window.callbacks.xhrReq(this.req.id_token, symbol);
      console.log("dataRequest "+symbol);
    },

    createChart: function () {
      this.tradingDayConversion();
      this.setSVG();
      this.drawAxes();
      var line = this.drawLineGraph();
      this.drawPricesBox(line);
      this.drawVolAxes();
      this.drawVolBars();
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
        graph = window._GraphBuilder.singleInstance = new _GraphBuilder.GraphBuilder(data.results, data.request);
        graph.createChart();
      } else {
        graph.updateChart(data.results, data.request)
      }
    }

  }
})();
