"use strict";

// Handling interaction peak and highlight display
var Highlight = function ($, window, document) {
    var peaks = [];

    function init(peaks_data) {
        peaks = peaks_data;
        bindEvents();
        // hard-coded data for prototyping
        if (video_id === "aTuYZqhEvuk") {
            // [3] is the confidence or strength of the peak
            peaks = [
                // [17, 18, 19, 20, "Other students re-watched this part. Verbal explanation", "Why iterative algorithms?"],
                // [53, 54, 55, 50, "Slide begins.", "Iterative algorithms"],
                [76, 81, 88, 100, "Other students reviewed this slide.", "Iterative algorithms"],
                // [136, 137, 138, 20, "Other students re-watched this part. Verbal explanation.", "Algorithm setup"],
                [173, 176, 178, 100, "Other students re-watched this part. Important explanation.", "Iterative multiplication by successive additions"],
                [203, 205, 213, 100, "Other students re-watched this part. Code example starts.", "Iterative multiplication code exmaple"],
                [266, 268, 270, 100, "Other students re-watched this part. Code demonstration starts.", "Running iterative multiplication code in console"]
                // [290, 291, 292, 50, "Wrap-up.", "Summary of the lecture"]
            ];
        }
        displayPeaks(peaks);
    }

    function bindEvents(){
        $(document).on("click", ".timeline-peak", timelinePeakClickHandler);
        $(document).on("mouseenter", ".timeline-peak", timelinePeakMouseenterHandler);
        $(document).on("mouseleave", ".timeline-peak", timelinePeakMouseleaveHandler);
        $(document).on("click", ".timeline-result", timelinePeakClickHandler);
        $(document).on("click", ".screenshot", screenshotClickHandler);
        $(document).on("mouseenter", ".screenshot", screenshotMouseenterHandler);
        $(document).on("mouseleave", ".screenshot", screenshotMouseleaveHandler);
        $(document).on("click", "#add-bookmark-button", addBookmarkButtonClickHandler);
        $(document).on("click", "#save-bookmark-button", saveBookmarkButtonClickHandler);
        $(document).on("click", "#cancel-bookmark-button", cancelBookmarkButtonClickHandler);
    }

    function isPeak(time) {
        var i;
        for (i in peaks){
            if (peaks[i][0] <= time && time <= peaks[i][2])
                return true;
        }
        return false;
    }

    function updateScreenshot(time) {
        var activePeak;
        var i;
        for (i in peaks){
            // since peaks are time-ordered, we'll always get the most recent screenshot.
            if (peaks[i][0] <= time)
                activePeak = peaks[i];
        }
        $(".screenshot.active").removeClass("active");
        if (typeof activePeak !== "undefined"){
            // console.log("match", activePeak[1]);
            $("#peak_" + activePeak[1]).addClass("active");
        } else {
            // console.log("no match");
        }
    }

    function hideBookmarkPanel(){
            $("#add-bookmark-button").removeAttr("disabled");
            $("#bookmark-thumbnail img").attr("src", "");
            $("#bookmark-description").val("");
            $("#bookmark-thumbnail").hide();
            $("#bookmark-description").hide();
            $("#save-bookmark-button").hide();
            $("#cancel-bookmark-button").hide();
            $("#bookmark-time").text("").hide();
    }

    function screenshotClickHandler(){
        Player.seekTo($(this).data("second") - 3);
    }

    function screenshotMouseenterHandler(){
        $(this).find(".tooltip").show();
        $(this).addClass("brushing");
        // find corresponding timeline mark
        $("#timeline-peak-" + $(this).data("second")).addClass("brushing");
    }

    function screenshotMouseleaveHandler(){
        $(this).find(".tooltip").hide();
        $(this).removeClass("brushing");
        // find corresponding timeline mark
        $("#timeline-peak-" + $(this).data("second")).removeClass("brushing");
    }

    function timelinePeakMouseenterHandler(){
        $(this).addClass("brushing");
        // find corresponding screenshot
        $("#peak_" + $(this).data("second")).addClass("brushing");
    }

    function timelinePeakMouseleaveHandler(){
        $(this).removeClass("brushing");
        // find corresponding screenshot
        $("#peak_" + $(this).data("second")).removeClass("brushing");
    }

    function timelinePeakClickHandler(){
        Player.seekTo($(this).data("second") - 3);
    }

    function addBookmarkButtonClickHandler(){
        var curTime = parseInt(Player.getCurrentTime());
        // var imgPath = '/static/djmodules/video_analytics/img/v_' +  video_id + '_' + curTime + '.jpg';
        var imgPath = 'http://localhost:8888/edx/edxanalytics/src/edxanalytics/edxmodules/video_analytics/static/img/v_' +  video_id + '_' + curTime + '.jpg';// console.log(curTime, imgPath);
        if (!$(this).is(":disabled")){
            $(this).attr("disabled", "disabled");
            $(this).data("curTime", curTime);
            $("<img/>").attr("src", imgPath).appendTo("#bookmark-thumbnail");
            $("#bookmark-thumbnail").show();
            $("#bookmark-description").show();
            $("#save-bookmark-button").show();
            $("#cancel-bookmark-button").show();
            $("#bookmark-time").text(formatSeconds(curTime)).show();
        }
    }

    function saveBookmarkButtonClickHandler(){
        var curTime = $("#add-bookmark-button").data("curTime");
        var description = $("#bookmark-description").val();
        peaks.push([curTime-1, curTime, curTime+1, 100, "You bookmarked it.", description]);
        displayPeaks(peaks);
        hideBookmarkPanel();
    }

    function cancelBookmarkButtonClickHandler(){
        hideBookmarkPanel();
    }

    function SortByTime(a, b){
      var aName = a[1];
      var bName = b[1];
      return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    }

    function updatePeaks(position){
        var threshold = 100 - position;
        var count = 0;
        for (var index in peaks){
            if (peaks[index][3] >= threshold){
                $("#peak_" + peaks[index][1]).show();
                $("#timeline-peak-" + peaks[index][1]).show();
                count++;
            } else {
                $("#peak_" + peaks[index][1]).hide();
                $("#timeline-peak-" + peaks[index][1]).hide();
            }
        }
        $("#highlight-count").text(count);
    }

    function displayPeaks(peaks){
        $(".screenshot").remove();
        $("#timeline .timeline-peak").remove();
        peaks.sort(SortByTime);
        for (var index in peaks){
            // TODO: get rid of the temporary link
            // var imgPath = '/static/djmodules/video_analytics/img/v_' +  video_id + '_' + peaks[index][1] + '.jpg';
            var imgPath = 'http://localhost:8888/edx/edxanalytics/src/edxanalytics/edxmodules/video_analytics/static/img/v_' +  video_id + '_' + peaks[index][1] + '.jpg';

            // sidebar
            $("<div/>")
                .attr("id", "peak_" + peaks[index][1])
                .data("second", peaks[index][1])
                .data("summary", peaks[index][5])
                // .addClass("screenshot").html("<span class='tooltip'>" + peaks[index][4] + "</span><span>" + formatSeconds(peaks[index][1]) + " </span> <span class='summary'>" + peaks[index][5] + "</span><br/>" + "<img src='" + imgPath + "'>")
                .addClass("screenshot")
                .html("<span class='by-others'></span> <span class='screenshot-time'>" + formatSeconds(peaks[index][1]) + " </span> " + "<img src='" + imgPath + "'>")
                .appendTo("#highlights");

            //timeline - width of the peak div
            var xPos = peaks[index][1]/duration * 100 - 8*100 / visWidth;
            $("<div/>")
                .addClass("timeline-peak by-others")
                .attr("id", "timeline-peak-" + peaks[index][1])
                .data("second", peaks[index][1])
                .data("summary", peaks[index][5])
                .css("left", xPos + "%")
                .appendTo("#timeline");
        }
        updatePeaks(0);
        // updateTimeline(0);
    }

    return {
        init: init,
        isPeak: isPeak,
        displayPeaks: displayPeaks,
        updateScreenshot: updateScreenshot
    }
}(jQuery, window, document);