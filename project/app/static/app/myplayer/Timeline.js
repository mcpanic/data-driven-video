"use strict";

// all timeline operations
var Timeline = function ($, window, document) {
    // visualization parameters
    var w;
    var h;
    var xScale;
    var yScale;

    // status variables
    var isDragging = false;
    var isChartMouseDown = false;
    var draggingId = 0;
    var peakRecovery = 0;
    var curMousePos;

    function init(visWidth, visHeight){
        w = visWidth;
        h = visHeight;
        xScale = d3.scale.linear().domain([0, duration]).range([0, w]);
        yScale = d3.scale.linear().domain([0, d3.max(data.play_kde)]).range([h, 0]);

        // global to avoid losing correponding mouse up if it occurs outside the chart.
        $(document).on("mouseup", mouseupHandler);
    }

    /* Move the player to the selected region to sync with the vis */
    function rectMousedownHandler(d, i){
        isChartMouseDown = true;
        // dragPlayheadMove(this);
        // console.log("DRAGGING", d3.event.dx);
        $(".playbar").attr("class", "playbar dragging");

        // ignore micro dragging events
        // if (d3.event.dx < 10 && d3.event.dx > -10)
        //     return;
        var chart = d3.selectAll("svg.play-chart");
        var playhead = d3.selectAll("svg.play-chart .playhead");
        var newX = d3.mouse(this)[0]; //parseFloat(playhead.attr("cx")) + d3.event.dx;
        var newTime = parseInt(newX * duration / chart.attr("width"));
        var newY = getAltitude(newTime);

        // 2) determine speed based on the strength of the "rubber band"
        var dx = newX - playhead.attr("cx");
        var dy = newY - playhead.attr("cy");
        // var force = dx*dx + dy*dy;
        var force = dx*dx;
        var speed = Math.min(16, force / 10000);
        console.log("force", force, "speed", speed);

        // 3) play a "quick" preview based on the speed from 2)
        if (dx < 0)
            speed = -1 * speed;
        Player.changeSpeed(speed / 2);
        Player.playUntil(newTime, speed / 2);

        // 4) display a drag trail
        // var dragTrail = chart.selectAll(".dragtrail")
        //     .data(["dragtrail"])
        //     .attr("x1", playhead.attr("cx"))
        //     .attr("x2", newX)
        //     .attr("y1", playhead.attr("cy"))
        //     .attr("y2", yScale(newY))
        //     .attr("stroke-width", (speed * 2) + "px");
        // dragTrail.enter().append("line")
        //     .attr("class", "dragtrail");
    }

    function mouseupHandler(e) {
        window.clearInterval(draggingId);
        // console.log(isChartMouseDown, e, e.pageX, e.pageY);
        if (!isChartMouseDown)
            return;
        isChartMouseDown = false;
        isDragging = false;
        var leftOffset = e.pageX - $("svg.chart").offset().left;
        //var second = Math.floor(d3.mouse(e)[0] * duration / visWidth);
        var second = Math.floor(leftOffset * duration / visWidth);
        Player.seekTo(second);
        // var chart = d3.selectAll("svg.play-chart");
        // chart.selectAll(".dragtrail")
        //     .transition()
        //     .duration(500)
        //     .attr("opacity", 0)
        //     .remove();
    }

    /* Progress the playhead as the video advances to the destinationTime mark. */
    function movePlayhead(destinationTime){
        var chart = d3.selectAll("svg.play-chart");
        var newY = getAltitude(destinationTime);
        var curPosition = chart.attr("width") * destinationTime / duration;
        // var dur = isDragging ? 1000 : 250;
        var dur = 0;
        // move the playhead.
        chart.selectAll(".playhead")
            .transition()
            .duration(dur)
            .attr("cx", curPosition)
            .attr("cy", yScale(newY));
        // move the playbar.
        chart.selectAll(".playbar")
            .transition()
            .duration(dur)
            .attr("x1", curPosition)
            .attr("x2", curPosition);
    }

/*
    var dragPlayhead = d3.behavior.drag()
        .origin(Object)
        .on("drag", dragPlayheadMove)
        .on("dragstart", function() {
            console.log("dragstart");
            Player.pause();
            d3.event.sourceEvent.stopPropagation(); // silence other listeners
        })
        .on("dragend", function() {
            console.log("dragend");
            var chart = d3.selectAll("svg.play-chart");
            chart.selectAll(".dragtrail")
                .transition()
                .duration(500)
                .attr("opacity", 0)
                .remove();
        });
*/


    // when dragging the playhead starts
    function playheadMousedownHandler(e){
        // console.log(e, e.pageX, e.pageY);
        // d3.event.sourceEvent.stopPropagation(); // silence other listeners
        d3.event.stopPropagation();
        // d3.event.preventDefault();
        Player.pause();
        isChartMouseDown = true;
        // dragPlayheadMove(this);
        draggingId = setInterval(handleDragging, 20);
        console.log("MOUSEDOWN", draggingId);
        // $(".playbar").attr("class", "playbar dragging");
        // console.log("mouse", d3.mouse(this));
        // ignore micro dragging events
        // if (d3.event.dx < 10 && d3.event.dx > -10)
        //     return;
        /*
        isDragging = true;
        var chart = d3.selectAll("svg.play-chart");
        var playhead = d3.selectAll("svg.play-chart .playhead");

        var newX = d3.mouse(this)[0]; //parseFloat(playhead.attr("cx")) + d3.event.dx;
        var newTime = parseInt(newX * duration / chart.attr("width"));
        var newY = getAltitude(newTime);
        console.log("x", newX, "time", newTime);
        Player.seekTo(newTime);
        */
    }

    function handleDragging() {
        isDragging = true;
        if (!isChartMouseDown || !curMousePos)
            return;
        // $(".playbar").attr("class", "playbar dragging");

        var chart = d3.selectAll("svg.play-chart");
        var newX = curMousePos.x;
        var newTime = parseInt(newX * duration / chart.attr("width"));
        var curTime = Player.getCurrentTime();

        // var playhead = d3.selectAll("svg.play-chart .playhead");
        // var newX = d3.mouse(this)[0]; //parseFloat(playhead.attr("cx")) + d3.event.dx;
        // var newY = getAltitude(newTime);

        // console.log("curTime", curTime, "newTime", newTime, "diff", newTime - curTime);
        if (Peak.isInteractionPeak(curTime)) {
            // var penalty = 0.1;
            // var adjustedTime = curTime + penalty * (newTime - curTime);
            var unit = newTime - curTime > 0 ? Math.min(0.15, newTime - curTime) : Math.max(-0.15, newTime - curTime);
            var adjustedTime = curTime + unit; // static slowdown
            // console.log("adjTime", adjustedTime);
            Player.seekTo(adjustedTime);
            peakRecovery = 20;
        } else {
            if (peakRecovery > 0) {
                peakRecovery -= 1;
                var penalty = 0.05;
                var adjustedTime = curTime + penalty * (newTime - curTime);
                // console.log("adjTime", adjustedTime);
                Player.seekTo(adjustedTime);
            } else {
                Player.seekTo(newTime);
            }
        }
    }


    // simply updates the mouse position because mouse position information
    // is only available via event handlers.
    function chartMousemoveHandler(e){
        // console.log(isChartMouseDown, d3.mouse(this)[0]);
        if (!isChartMouseDown)
            return;
        // e = e || window.event; // IE-ism
        curMousePos = {
            x: d3.mouse(this)[0], // e.clientX
            y: d3.mouse(this)[1] // e.clientY
        };
        return;
        /*

        // $(".playbar").attr("class", "playbar dragging");
        // ignore micro dragging events
        // if (d3.event.dx < 10 && d3.event.dx > -10)
        //     return;
        isDragging = true;

        var chart = d3.selectAll("svg.play-chart");
        var playhead = d3.selectAll("svg.play-chart .playhead");
        var newX = d3.mouse(this)[0]; //parseFloat(playhead.attr("cx")) + d3.event.dx;
        var newTime = parseInt(newX * duration / chart.attr("width"));
        var newY = getAltitude(newTime);
        var curTime = Player.getCurrentTime();
        // console.log("curTime", curTime, "newTime", newTime, "diff", newTime - curTime);
        if (Peak.isInteractionPeak(curTime)) {
            // var penalty = 0.1;
            // var adjustedTime = curTime + penalty * (newTime - curTime);
            var unit = newTime - curTime > 0 ? Math.min(0.2, newTime - curTime) : Math.max(-0.2, newTime - curTime);
            var adjustedTime = curTime + unit; // static slowdown
            console.log("adjTime", adjustedTime);
            Player.seekTo(adjustedTime);
            peakRecovery = 10;
        } else {
            if (peakRecovery > 0) {
                peakRecovery -= 1;
                var penalty = 0.1;
                var adjustedTime = curTime + penalty * (newTime - curTime);
                Player.seekTo(adjustedTime);
            } else {
                Player.seekTo(newTime);
            }
        }
        */
    }


    // function postDrag(){
    //     Player.play();
    // }

    function getAltitude(time){
        var chart = d3.selectAll("svg.play-chart");
        var dataset = chart.selectAll("rect").data();
        return dataset[parseInt(time)];
    }

/*
    function dragPlayheadMove(d){
        console.log("DRAGGING", d3.event.dx);
        $(".playbar").attr("class", "playbar dragging");
        // console.log("mouse", d3.mouse(this));
        // ignore micro dragging events
        // if (d3.event.dx < 10 && d3.event.dx > -10)
        //     return;
        isDragging = true;
        var chart = d3.selectAll("svg.play-chart");
        var playhead = d3.selectAll("svg.play-chart .playhead");

        var newX = d3.mouse(this)[0]; //parseFloat(playhead.attr("cx")) + d3.event.dx;
        var newTime = parseInt(newX * duration / chart.attr("width"));
        var newY = getAltitude(newTime);

        Player.seekTo(newTime);
        return;

        // 2) determine speed based on the strength of the "rubber band"
        var dx = newX - playhead.attr("cx");
        var dy = newY - playhead.attr("cy");
        var force = dx*dx + dy*dy;
        var speed = Math.min(16, force / 1000);
        console.log("force", force, "speed", speed);

        // 3) play a "quick" preview based on the speed from 2)
        if (dx < 0)
            speed = -1 * speed;
        // console.log("play until", newTime);
        Player.changeSpeed(speed / 2);
        Player.playUntil(newTime, speed / 2);


        // instead of directly jumping to that section,
        // Player.seekTo(newTime);
        var dragTrail = chart.selectAll(".dragtrail")
            .data(["dragtrail"])
            .attr("x1", playhead.attr("cx"))
            .attr("x2", newX)
            .attr("y1", playhead.attr("cy"))
            .attr("y2", yScale(newY))
            .attr("stroke-width", (speed * 2) + "px");
        // 1) display the trail
        dragTrail.enter().append("line")
            .attr("class", "dragtrail");

        // dragTrail.transition()
        //     .duration(3000)
            // .delay(500)
            // .remove();
            // .call(postDrag);

        // console.log(d3.event, playhead.attr("cx"));
        // console.log(newX, newY, currentTime);
        // chart.selectAll(".playhead")
     //        .transition()
     //        .duration(0)
        //     .attr("cx", newX)
        //     .attr("cy", yScale(newY));
        isDragging = false;
    }
*/

    /* Render the heatmap visualization */
    function drawPlayVis(dataset, duration){
        d3.selectAll("svg.play-chart").remove();
        // margin = 20,
        // y = d3.scale.linear().domain([0, d3.max(data)]).range([0 + margin, h - margin]),
        // x = d3.scale.linear().domain([0, data.length]).range([0 + margin, w - margin])

        var barPadding = 0;
        //var chart = d3.select("#play-vis").append("svg")
        var chart = d3.select("#timeline").append("svg")
                    .attr("class", "chart play-chart")
                    .attr("width", w)
                    .attr("height", h);
                // .append("g")
                //     .attr("transform", "translate(0,30)");

        // Show tooltips on mouseover
        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .text("Tooltip");

        var line = d3.svg.line()
            .x(function(d, i){ return xScale(i); })
            .y(function(d){ return yScale(d); });

        // chart.selectAll("path")
        //     .data(dataset)
        //     .enter().append("path")
        //     .attr("d", line(dataset));

        // chart.append("svg:path")
        //     .data(dataset)
        //     .attr("d", line(dataset))
        //     .on("click", rectMousedownHandler);
            // .on("mouseover", function(d, i){
            //     console.log(this, d, i);
            //     return tooltip.text("at " + formatSeconds(d.key) + " count: " + d.value).style("visibility", "visible");
            // })
            // .on("mousemove", function(d){
            //     return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            // })
            // .on("mouseout", function(d){
            //     return tooltip.style("visibility", "hidden");
            // });
        chart.on("mousedown", rectMousedownHandler);
        chart.on("mousemove", chartMousemoveHandler);

        // // Add histogram
        chart.selectAll("rect")
            .data(dataset)
            .enter().append("rect")
            .attr("data-second", function(d, i){ return i; })
            .attr("class", "databar")
            .attr("x", function(d, i){ return i * (w / dataset.length); })
            .attr("y", yScale)
            .attr("width", w / dataset.length - barPadding)
            .attr("height", function(d){ return h - yScale(d); });
            // // .on("click", rectMousedownHandler)
            // .on("mouseover", function(d, i){
            //     return tooltip.text("at " + formatSeconds(i) + " count: " + d).style("visibility", "visible");
            // })
            // .on("mousemove", function(d){
            //     return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            // })
            // .on("mouseout", function(d){
            //     return tooltip.style("visibility", "hidden");
            // });

        // Add playbar
        chart.append("line")
            .attr("class", "playbar")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", 0)
            .attr("y2", h)
            .on("mousedown", playheadMousedownHandler);
            // .call(dragPlayhead);

        chart.append("circle")
            .attr("class", "playhead")
            .attr("cx", 0)
            .attr("cy", yScale(dataset[0]))
            .attr("r", 8)
            .on("mousedown", playheadMousedownHandler);
            // .on("mousemove", playheadMousemoveHandler);
            // .call(dragPlayhead);

        // chart.selectAll("text")
        //     .data(dataset)
        // .enter().append("text")
        //     .text(function(d){ return Math.floor(d); })
        //     .attr("x", function(d, i){ return i * (w / dataset.length)+3; })
        //     .attr("y", function(d){ return h - (d*amplifier) - 5; });

        // Add axes
        var padding = 0;
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .ticks(5)
            .tickFormat(formatSeconds);
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(3);
        chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis);
        chart.append("g")
            .attr("class", "axis y-axis")
            //.attr("transform", "translate(" + padding + ",0)")
            .call(yAxis);
        return chart;
    }



    function drawTimeVis(dataset) {
        var w = visWidth;
        var h = visHeight;
        // Data format: array of [date, count] entries
        // e.g., dataset[0] ==> "2013-03-01": 34

        var keys = dataset.map(function(d){ return d[0]; });
        var values = dataset.map(function(d){ return d[1]; });
        d3.selectAll("svg.time-chart").remove();
        var xScale = d3.scale.ordinal().domain(keys).rangePoints([0, w]);
        var yScale = d3.scale.linear().domain([ 0, d3.max(values) ]).range([h, 0]);

        var barPadding = 1;
        var chart = d3.select("#time-vis").append("svg")
                    .attr("class", "chart time-chart")
                    .attr("width", w)
                    .attr("height", h);
                // .append("g")
                //     .attr("transform", "translate(0,30)");

        // Show tooltips on mouseover
        var tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .text("Tooltip");

        var line = d3.svg.line()
            .x(function(d, i){ return xScale(i); })
            .y(function(d){ return yScale(d[1]); });
            // .on("mouseover", function(d){
            //     return tooltip.text(d.value[0] + ": " + d.value[1] + " views").style("visibility", "visible");
            // })
            // .on("mousemove", function(d){
            //     return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            // })
            // .on("mouseout", function(d){
            //     return tooltip.style("visibility", "hidden");
            // });

        // chart.selectAll("path")
        //     .data(d3.entries(dataset))
        //     .enter().append("path")
        //     .attr("d", line(dataset))
            // .on("mouseover", function(d){
            //     console.log(d);
            //     return tooltip.text(d.value[0] + ": " + d.value[1] + " views").style("visibility", "visible");
            // })
            // .on("mousemove", function(d){
            //     return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            // })
            // .on("mouseout", function(d){
            //     return tooltip.style("visibility", "hidden");
            // });
        // Add histogram
        chart.selectAll("rect")
            .data(d3.entries(dataset))
            .enter().append("rect")
            .attr("x", function(d, i){ return i * (w / keys.length); })
            .attr("y", function(d){ return yScale(d.value[1]); })
            .attr("width", w / keys.length - barPadding)
            .attr("height", function(d){ return h - yScale(d.value[1]); })
            // .on("click", rectMousedownHandler)
            .on("mouseover", function(d){
                return tooltip.text(d.value[0] + ": " + d.value[1] + " views").style("visibility", "visible");
            })
            .on("mousemove", function(d){
                return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            })
            .on("mouseout", function(d){
                return tooltip.style("visibility", "hidden");
            });

        // Add axes
        var padding = 0;
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickValues(xScale.domain().filter(function(d,i){
                // only showing the first day of each month
                return d.substr(-2) == "01";
            }));
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(3);
        chart.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis);
        chart.append("g")
            .attr("class", "axis y-axis")
            //.attr("transform", "translate(" + padding + ",0)")
            .call(yAxis);

        return chart;
    }

    function addSegment(start, end, tid) {
        var xPos = start/duration * 100;
        var width = (end - start)/duration * 100;
        var $trace = $("<div/>")
            .addClass("trace")
            .attr("id", "trace-" + tid)
            .data("sid", tid)
            .data("start", start)
            .data("end", end)
            .css("left", xPos + "%")
            .css("width", width + "%")
            .appendTo("#timeline");

        $("<span/>")
            .addClass("tooltip")
            .text("You watched this segment already.")
            .appendTo($trace);

        // opacity change only when there are more than 3 traces
        for (var i = 3; i < tid; i++) {
            var curOpacity = $("#trace-" + (i - 2)).css("opacity");
            var newOpacity = curOpacity > 0.2 ? curOpacity - 0.2 : 0.2;
            $("#trace-" + (i - 2)).css("opacity", newOpacity);
        }
    }

    return {
        init: init,
        getAltitude: getAltitude,
        movePlayhead: movePlayhead,
        drawPlayVis: drawPlayVis,
        drawTimeVis: drawTimeVis,
        addSegment: addSegment
    }

}(jQuery, window, document);