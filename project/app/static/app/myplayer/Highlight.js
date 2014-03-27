"use strict";

// Handling interaction peak and highlight display
var Highlight = function ($, window, document) {
    // var peaks = [];
    var api;

    function init() {
        // console.log(peaks_data);
        // peaks = peaks_data;
        bindEvents();
        // hard-coded data for prototyping
        /*
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
        } */
        displayPeaks();
        addScrollbar();
    }

    function bindEvents() {
        // should this belong here?
        $(document).on("click", ".trace", traceClickHandler);

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
        $(document).on("keyup", "#bookmark-description", bookmarkDescriptionKeyupHandler);
        $(document).on("click", ".highlight-checkboxes label", checkboxClickHandler);
        // $(document).on("mouseenter", "#bookmark-popup", function(e){ e.preventDefault(); $(this).css("z-index", 3000); console.log("prevent"); return false;});
    }

    function traceClickHandler() {
        Player.seekTo($(this).data("start"));
    }

    function bookmarkDescriptionKeyupHandler(e) {
        if (e.keyCode === 13) {
            $("#save-bookmark-button").click();
        }
    }

    function isInteractionShown() {
        return $("input.from-others").is(":checked");
    }

    function isBookmarkShown() {
        return $("input.from-me").is(":checked");
    }

    // get up-to-date peak data, depending on the selected view options
    function getCurrentPeaks() {
        var result = [];
        if (isInteractionShown() && isBookmarkShown()) {
            result = Peak.interactionPeaks.concat(Peak.bookmarkPeaks);
        } else if (isInteractionShown()) {
            result = Peak.interactionPeaks;
        } else if (isBookmarkShown()) {
            result = Peak.bookmarkPeaks;
        }
        // last case is when nothing is selected: it's empty alreay so do nothing.
        return result;
    }


    function checkboxClickHandler() {
        var checkboxValue = $(this).attr('for');
        $(".highlight-checkboxes input[value='" + checkboxValue + "']").trigger('click');
        var isChecked = $(".highlight-checkboxes input[value='" + checkboxValue + "']").is(":checked");
        console.log(checkboxValue, isChecked);
        if (checkboxValue == "from-me-val") {
            if (isChecked) {
                $(".screenshot.by-me").show();
                $(".timeline-peak.by-me").show();
            } else {
                $("#highlights .screenshot.by-me").hide();
                $(".timeline-peak.by-me").hide();
            }
        } else if (checkboxValue == "from-others-val") {
            if (isChecked) {
                $(".screenshot.by-others").show();
                $(".timeline-peak.by-others").show();
            } else {
                $(".screenshot.by-others").hide();
                $(".timeline-peak.by-others").hide();
            }
        }
        refreshScrollbar();
    }

    function addScrollbar() {
        setTimeout(function () {
            $('#highlights').jScrollPane({
                animateScroll: true
            });
            Highlight.api = $('#highlights').data('jsp');
        }, 500);
    }

    function refreshScrollbar() {
        if (typeof Highlight.api !== "undefined") {
            setTimeout(function () {
                Highlight.api.reinitialise();
            }, 500);
        }
    }

    function updateScreenshot(time) {
        var activePeak;
        var peaks = getCurrentPeaks();
        peaks.sort(Peak.sortPeaksByTime);
        var i;
        for (i in peaks){
            // since peaks are time-ordered, we'll always get the most recent screenshot.
            if (peaks[i]["start"] <= time)
                activePeak = peaks[i];
        }
        // check if we need an update.
        // if (activePeak[])
        $(".screenshot.active").removeClass("active");
        if (typeof activePeak !== "undefined"){
            // console.log("match", activePeak[1]);
            $("#peak_" + activePeak["uid"]).addClass("active");
            refreshScrollbar();
        } else {
            // console.log("no match");
        }
    }

    function hideBookmarkPanel(){
            $("#bookmark-popup").hide();
            $("#add-bookmark-button").removeAttr("disabled");
            // $("#bookmark-thumbnail img").attr("src", "");
            $("#bookmark-thumbnail").empty();
            $("#bookmark-description").val("");
            $("#bookmark-thumbnail").hide();
            $("#bookmark-description").hide();
            $("#save-bookmark-button").hide();
            $("#cancel-bookmark-button").hide();
            $("#bookmark-time").text("").hide();
    }

    function screenshotClickHandler(){
        Player.seekTo($(this).data("start"));
        if (typeof Highlight.api !== "undefined") {
            Highlight.api.scrollToElement($(this));
        }
    }

    function screenshotMouseenterHandler(){
        $(this).find(".tooltip").show();
        $(this).addClass("brushing");
        // find corresponding timeline mark
        $("#timeline-peak-" + $(this).data("uid")).addClass("brushing");
        // brushing on the timeline itself
        var peak = Peak.getInteractionPeakByUID($(this).data("uid"));
        if (typeof peak !== "undefined")
            Timeline.addDatabarBrushing(peak);
    }

    function screenshotMouseleaveHandler(){
        $(this).find(".tooltip").hide();
        $(this).removeClass("brushing");
        // find corresponding timeline mark
        $("#timeline-peak-" + $(this).data("uid")).removeClass("brushing");
        // brushing on the timeline itself
        var peak = Peak.getInteractionPeakByUID($(this).data("uid"));
        if (typeof peak !== "undefined")
            Timeline.removeDatabarBrushing(peak);
    }

    function timelinePeakMouseenterHandler(){
        $(this).addClass("brushing");
        // find corresponding screenshot
        $("#peak_" + $(this).data("uid")).addClass("brushing");
    }

    function timelinePeakMouseleaveHandler(){
        $(this).removeClass("brushing");
        // find corresponding screenshot
        $("#peak_" + $(this).data("uid")).removeClass("brushing");
    }

    function timelinePeakClickHandler(){
        Player.seekTo($(this).data("start"));
    }

    function addBookmarkButtonClickHandler(){
        var curTime = parseInt(Player.getCurrentTime());
        // var imgPath = '/static/djmodules/video_analytics/img/v_' +  video_id + '_' + curTime + '.jpg';
        // var imgPath = 'http://localhost:8888/edx/edxanalytics/src/edxanalytics/edxmodules/video_analytics/static/img/v_' +  video_id + '_' + curTime + '.jpg';// console.log(curTime, imgPath);
        var imgPath = mediaUrlPrefix + "thumbs/" + course + "/v_" + video_id + '_' + curTime + '.jpg';
        // if (!$(this).is(":disabled")){
            // $(this).attr("disabled", "disabled");
        if ($("#bookmark-popup").is(":visible")) {
            hideBookmarkPanel();
        } else {
            $(this).data("curTime", curTime);
            $("<img/>").attr("src", imgPath).appendTo("#bookmark-thumbnail");
            $("#bookmark-popup").show();
            $("#bookmark-thumbnail").show();
            $("#bookmark-description").show();
            $("#bookmark-description").focus()
            $("#save-bookmark-button").show();
            $("#cancel-bookmark-button").show();
            $("#bookmark-time").text(formatSeconds(curTime)).show();
        }
    }

    function saveBookmarkButtonClickHandler(){
        var curTime = $("#add-bookmark-button").data("curTime");
        var description = $("#bookmark-description").val();
        //peaks.push([curTime-2, curTime, curTime+2, 100, "You bookmarked it.", description]);
        Peak.addBookmarkPeak({
                    "uid": Peak.getNewBookmarkUID(),
                    "start": curTime - 2,
                    "top": curTime,
                    "end": curTime + 2,
                    "type": "bookmark",
                    "score": 100,
                    "label": description});
        displayPeaks();
        hideBookmarkPanel();
    }

    function cancelBookmarkButtonClickHandler(){
        hideBookmarkPanel();
    }

    function updatePeaks(peaks, position){
        var threshold = 100 - position;
        var count = 0;
        for (var index in peaks){
            if (peaks[index]["score"] >= threshold){
                $("#peak_" + peaks[index]["uid"]).show();
                $("#timeline-peak-" + peaks[index]["uid"]).show();
                count++;
            } else {
                $("#peak_" + peaks[index]["uid"]).hide();
                $("#timeline-peak-" + peaks[index]["uid"]).hide();
            }
        }
        $("#highlight-count").text(count);
        // console.log(count, Highlight.api);
        refreshScrollbar();
    }

    function displayPeaks(){
        var peaks = getCurrentPeaks();
        console.log(peaks);
        $(".screenshot").remove();
        $("#timeline .timeline-peak").remove();
        peaks.sort(Peak.sortPeaksByTime);
        for (var index in peaks){
            // TODO: get rid of the temporary link
            // var imgPath = '/static/djmodules/video_analytics/img/v_' +  video_id + '_' + peaks[index][1] + '.jpg';
            // var imgPath = 'http://localhost:8888/edx/edxanalytics/src/edxanalytics/edxmodules/video_analytics/static/img/v_' +  video_id + '_' + parseInt(peaks[index]["top"]) + '.jpg';
            var imgPath = mediaUrlPrefix + "thumbs/" + course + "/v_" + video_id + '_' + parseInt(peaks[index]["top"]) + '.jpg';
            var displayClass = (peaks[index]["type"] == "interaction") ? "by-others" : "by-me";

            // Part 1. update sidebar
            var labelHTML = "";
            if (peaks[index]["label"] !== "") {
                labelHTML = "<span class='screenshot-label'>"
                    + peaks[index]["label"]
                    + "</span>";
            }
            var $highlight = $("<div/>")
                .attr("id", "peak_" + peaks[index]["uid"])
                .data("uid", peaks[index]["uid"])
                .data("second", peaks[index]["top"])
                .data("start", peaks[index]["start"])
                .data("end", peaks[index]["end"])
                .data("score", peaks[index]["score"])
                .data("label", peaks[index]["label"])
                // .addClass("screenshot").html("<span class='tooltip'>" + peaks[index][4] + "</span><span>" + formatSeconds(peaks[index][1]) + " </span> <span class='summary'>" + peaks[index][5] + "</span><br/>" + "<img src='" + imgPath + "'>")
                .addClass("screenshot " + displayClass)
                .html("<span class='screenshot-time'>"
                    + formatSeconds(peaks[index]["top"])
                    + "</span> "
                    + labelHTML
                    + "<img src='" + imgPath + "'>");
            if (typeof Highlight.api !== "undefined") {
                Highlight.api.getContentPane().append($highlight);
            } else {
                $("#highlights").append($highlight);
            }

            // Part 2. update timeline
            //timeline - width of the peak div
            var xPos = peaks[index]["top"]/duration * 100 - 8*100 / visWidth;
            var $timelinePeak = $("<div/>")
                .addClass("timeline-peak " + displayClass)
                .attr("id", "timeline-peak-" + peaks[index]["uid"])
                .data("uid", peaks[index]["uid"])
                .data("second", peaks[index]["top"])
                .data("start", peaks[index]["start"])
                .data("end", peaks[index]["end"])
                .data("score", peaks[index]["score"])
                .data("label", peaks[index]["label"])
                .css("left", xPos + "%")
                .appendTo("#timeline");
            $("<span/>")
                .addClass("tooltip")
                .text("[" + formatSeconds(peaks[index]["top"]) + "] " + peaks[index]["label"])
                .appendTo($timelinePeak);

        }
        updatePeaks(peaks, 0);
        updatePeakColor();
        // updateTimeline(0);
    }

    // color the rollercoaster graph
    function updatePeakColor() {
        if (!isInteractionShown())
            return;
        for (var index in Peak.interactionPeaks){
            var j;
            for (j = Peak.interactionPeaks[index]["start"]; j <= Peak.interactionPeaks[index]["end"]; j++) {
                var $databar = $(".databar[data-second='" + j + "']")
                    .attr("class", "databar peak-databar");
            }
        }
    }

    return {
        init: init,
        // isPeak: isPeak,
        displayPeaks: displayPeaks,
        updateScreenshot: updateScreenshot,
        updatePeakColor: updatePeakColor,
        api: api
    }
}(jQuery, window, document);