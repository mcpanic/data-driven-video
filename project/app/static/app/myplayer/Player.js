"use strict";

// all timeline operations
var Player = function ($, window, document) {
    var video = document.getElementById("video");

    // Buttons
    var playButton = document.getElementById("play-pause");
    var muteButton = document.getElementById("mute");
    var fullScreenButton = document.getElementById("full-screen");

    // Sliders
    var seekBar = document.getElementById("seek-bar");
    var volumeBar = document.getElementById("volume-bar");
    var speedButton = document.getElementById("speed-button");

    var isPlayUntil = false;
    var playUntilTime = 0;

    var oldVolume = 0.0;

    var lastTimeUpdate = -1000; // force trigger the first time
    var isPeak = false;

    var traces = []; // personal interaction traces
    // var isSegmentOn = false; // flag for keeping track of watching segments
    var tid = 1;    // trace count used as ID

    function init(videoUrl) {
        bindEvents();
        load(videoUrl);
        muteButton.click();
    }

    function load(videoUrl) {
        video.src = videoUrl;
        video.load();
        play();
    }

    function seekTo(time) {
        video.currentTime = time;
        // traces.push({
        //     "type": "seek",
        //     "vtime": getCurrentTime(),
        //     "time": new Date(),
        //     "processed": false
        // });
        // if (!isSegmentOn)
        //     isSegmentOn = true;
        // addSegment();
    }

    function getCurrentTime() {
        return video.currentTime;
    }

    function addSegment() {
        var start;
        var end;
        var segStart;
        var segEnd;
        for (var i = 0; i < traces.length; i++) {
            if (!traces[i]["processed"] && traces[i]["type"] == "play"){
                start = traces[i];
                // if the last one, return because it's still waiting for end
                if (i == traces.length - 1)
                    return;
                end = traces[i + 1];
                break;
            }
        }
        console.log("TRACE", start, end, getTimeDiff(end["time"], start["time"]));
        start["processed"] = true;
        // add the segment to the timeline
        if (end["type"] == "pause") {
            console.log("play-pause", start["vtime"], end["vtime"]);
            segStart = start["vtime"];
            segEnd = end["vtime"];
            end["processed"] = true;
        } else if (end["type"] == "play") {
            console.log("play-play", start["vtime"], start["vtime"] + getTimeDiff(end["time"], start["time"]));
            segStart = start["vtime"];
            segEnd = start["vtime"] + getTimeDiff(end["time"], start["time"]);
        }
        Timeline.addSegment(segStart, segEnd, tid);
        tid += 1;
        // isSegmentOn = false;
    }

    function play() {
        video.play();
        $(playButton).removeClass("play-display").addClass("pause-display");
        traces.push({
            "type": "play",
            "vtime": getCurrentTime(),
            "time": new Date(),
            "processed": false
        });
        // if (!isSegmentOn)
        //     isSegmentOn = true;
        addSegment();
    }

    function playUntil(newTime, speed) {
        isPlayUntil = true;
        playUntilTime = newTime;
        console.log("play until started", video.currentTime, playUntilTime, speed);
        // play();
        // ensure moving at least at 1x
        var adjustedSpeed = Math.max(0.5, speed);
        if (video.currentTime + adjustedSpeed > playUntilTime)
            video.currentTime = playUntilTime;
        else
            video.currentTime += adjustedSpeed;
    }

    function pause(forceRecord) {
        if (video.paused && typeof forceRecord === "undefined")
            return;
        video.pause();
        $(playButton).removeClass("pause-display").addClass("play-display");
        traces.push({
            "type": "pause",
            "vtime": getCurrentTime(),
            "time": new Date(),
            "processed": false
        });
        // if (!isSegmentOn)
        //     isSegmentOn = true;
        addSegment();
    }

    function changeSpeed(rate) {
        video.playbackRate = rate.toFixed(1);
        $(speedButton).text(rate.toFixed(1) + "x");
    }

    function bindEvents() {
        playButton.addEventListener("click", playButtonClickHandler);
        muteButton.addEventListener("click", muteButtonClickHandler);
        fullScreenButton.addEventListener("click", fullScreenButtonClickHandler);
        seekBar.addEventListener("mousedown", seekBarMousedownHandler);
        seekBar.addEventListener("mouseup", seekBarMouseupHandler);
        seekBar.addEventListener("change", seekBarChangeHandler);
        video.addEventListener("click", videoClickHandler);
        video.addEventListener("timeupdate", videoTimeUpdateHandler);
        video.addEventListener("ended", videoEndedHandler);
        volumeBar.addEventListener("change", volumeBarChandeHandler);
        speedButton.addEventListener("click", speedButtonClickHandler);
        $(".speed-option").on("click", speedOptionClickHandler);
    }

    // Event listener for the play/pause button
    function playButtonClickHandler(){
        if (video.paused == true) {
            play();
        } else {
            pause();
        }
    }



    // Event listener for the mute button
    function muteButtonClickHandler(){
        if (video.muted == false) {
            // Mute the video
            video.muted = true;
            oldVolume = volumeBar.value;
            volumeBar.value = 0.0;
            // Update the button text
            $(muteButton).removeClass("volume-low-display volume-medium-display volume-high-display").addClass("volume-mute-display");
        } else {
            // Unmute the video
            video.muted = false;
            volumeBar.value = oldVolume;
            // Update the button text
            var volumeLevel;
            if (volumeBar.value <= 0.3)
                volumeLevel = "volume-low-display";
            else if (volumeBar.value <= 0.7)
                volumeLevel = "volume-medium-display";
            else
                volumeLevel = "volume-high-display";
            $(muteButton).removeClass("volume-mute-display").addClass(volumeLevel);
        }
    }


    // Event listener for the full-screen button
    function fullScreenButtonClickHandler(){
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.mozRequestFullScreen) {
            video.mozRequestFullScreen(); // Firefox
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen(); // Chrome and Safari
        }
    }


    // Pause the video when the seek handle is being dragged
    function seekBarMousedownHandler(){
        pause();
    }

    // Play the video when the seek handle is dropped
    function seekBarMouseupHandler(){
        play();
    }

    // Event listener for the seek bar
    function seekBarChangeHandler(){
        // Calculate the new time
        var time = video.duration * (seekBar.value / 100);
        // console.log(time);
        // Update the video time
        video.currentTime = time;
    }

    function videoClickHandler(){
        playButton.click();
    }



    // Update the seek bar as the video plays
    function videoTimeUpdateHandler() {
        // if (isPlayUntil)
        //     console.log("update", video.currentTime, video.playbackRate);
        // Calculate the slider value
        var value = (100 / video.duration) * video.currentTime;
        var intCurrentTime = parseInt(video.currentTime);

        $("#time-display").text(formatSeconds(video.currentTime));

        // update transcript
        Transcript.update(intCurrentTime);

        // Things that don't need updates every time.
        // Currently happnening every 2 seconds.
        // TODO: make efficient. reduce looping. group same time topics into a single object
        if (lastTimeUpdate - intCurrentTime < -2 || lastTimeUpdate - intCurrentTime > 2){
            lastTimeUpdate = intCurrentTime;
            // console.log("checking");

            if (typeof Topicflow.currentTopic === "undefined") {
                console.log("first time");
                Topicflow.displayTopics(intCurrentTime);
            } else {
                if (intCurrentTime * 1000 <= Topicflow.currentTopic["start"] || intCurrentTime  * 1000 >= Topicflow.currentTopic["end"]){
                    console.log("topic changed");
                    Topicflow.displayTopics(intCurrentTime);
                }
            }

            Highlight.updateScreenshot(video.currentTime);
        }

        // slow down for hills
        if (isPlayUntil){
            var adjustedSpeed;
            if (Peak.isPeak(video.currentTime)){
                adjustedSpeed = video.playbackRate / 4; // Math.max(0.5, video.playbackRate / 4);
                console.log("PEAK ALERT", adjustedSpeed);
                // trigger only for the first time
                if (isPeak == false){
                    changeSpeed(adjustedSpeed);
                    if (video.currentTime + adjustedSpeed > playUntilTime)
                        video.currentTime = playUntilTime;
                    else
                        video.currentTime += adjustedSpeed;
                } else {
                    // normal dragging: move a bit.
                    adjustedSpeed = video.playbackRate; // Math.max(0.5, video.playbackRate);
                    changeSpeed(adjustedSpeed);
                    if (video.currentTime + adjustedSpeed > playUntilTime)
                        video.currentTime = playUntilTime;
                    else
                        video.currentTime += adjustedSpeed;
                }
                isPeak = true;
            } else {
                adjustedSpeed = video.playbackRate * 4; // Math.max(0.5, video.playbackRate * 4);
                // trigger only for the first time
                if (isPeak == true){
                    console.log("jumping", adjustedSpeed);
                    changeSpeed(adjustedSpeed);
                    if (video.currentTime + adjustedSpeed > playUntilTime)
                        video.currentTime = playUntilTime;
                    else
                        video.currentTime += adjustedSpeed;
                } else {
                    // normal dragging: move a bit.
                    adjustedSpeed = video.playbackRate; //Math.max(0.5, video.playbackRate);
                    changeSpeed(adjustedSpeed);
                    if (video.currentTime + adjustedSpeed > playUntilTime)
                        video.currentTime = playUntilTime;
                    else
                        video.currentTime += adjustedSpeed;
                }
                isPeak = false;
            }
        }

        // only when in the interaction peaks
        if (Peak.isPeak(video.currentTime)) {
            $(".playbar").attr("class", "playbar dragging peak");
        } else {
            $(".playbar").attr("class", "playbar");
        }

        if (isPlayUntil){
            if ((video.playbackRate > 0 && playUntilTime <= intCurrentTime) || (video.playbackRate < 0 && playUntilTime >= intCurrentTime)){
                // pause();
                $(".playbar").attr("class", "playbar");
                console.log("play until complete");
                isPlayUntil = false;
                isPeak = false;
                changeSpeed(1);
                play();
            }
        }

        // Update the slider and playhead
        seekBar.value = value;
        Timeline.movePlayhead(video.currentTime);
    }

    // Event listener for the video playback end
    function videoEndedHandler() {
        pause(true);
        console.log("video ended");
    }


    // Event listener for the volume bar
    function volumeBarChandeHandler(){
        // Update the video volume
        video.volume = volumeBar.value;
        var volumeLevel;
        if (volumeBar.value <= 0.3)
            volumeLevel = "volume-low-display";
        else if (volumeBar.value <= 0.7)
            volumeLevel = "volume-medium-display";
        else
            volumeLevel = "volume-high-display";
        $(muteButton).removeClass("volume-low-display volume-medium-display volume-high-display").addClass(volumeLevel);
    }

    function speedButtonClickHandler(){
        // $(speedButton).attr("data-speed")
        if ($("#speed-dropdown").is(":visible")) {
            $("#speed-dropdown").hide();
        } else {
            $("#speed-dropdown").show();
        }
        console.log("clicked");
    }

    function speedOptionClickHandler(){
        var newSpeed = $(this).attr("data-speed");
        $("#speed-button").text($(this).text());
        console.log(newSpeed);
        updateSpeed(newSpeed);
        $("#speed-dropdown").hide();
    }

    function updateSpeed(newSpeed){
        video.playbackRate = newSpeed;
    }

    return {
        init: init,
        seekTo: seekTo,
        traces: traces,
        getCurrentTime: getCurrentTime,
        pause: pause,
        play: play,
        playUntil: playUntil,
        changeSpeed: changeSpeed
    }
}(jQuery, window, document);