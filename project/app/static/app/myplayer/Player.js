// all timeline operations
var Player = function() {
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

	function init(videoUrl){
		bindEvents();
		load(videoUrl);
	}

	function load(videoUrl){
		video.src = videoUrl;
		video.load();
		video.play();
	}

	function seekTo(time){
		video.currentTime = time;
	}

	function getCurrentTime(){
		return video.currentTime;
	}

	function play(){
		video.play();
		$(playButton).removeClass("play-display").addClass("pause-display");
	}
	
	function playUntil(newTime, speed){
		isPlayUntil = true;
		playUntilTime = newTime;
		console.log("play until started", video.currentTime, playUntilTime, speed);
		// play();
		// ensure moving at least at 1x
		var adjustedSpeed = Math.max(1, speed);
		if (video.currentTime + adjustedSpeed > playUntilTime)
			video.currentTime = playUntilTime;
		else
			video.currentTime += adjustedSpeed;
	}

	function pause(){
		video.pause();
		$(playButton).removeClass("pause-display").addClass("play-display");
	}

	function changeSpeed(rate){
		video.playbackRate = rate.toFixed(1);
		$(speedButton).text(rate.toFixed(1) + "x");
	}

	function bindEvents(){
		playButton.addEventListener("click", playButtonClickHandler);
		muteButton.addEventListener("click", muteButtonClickHandler);
		fullScreenButton.addEventListener("click", fullScreenButtonClickHandler);
		seekBar.addEventListener("mousedown", seekBarMousedownHandler);
		seekBar.addEventListener("mouseup", seekBarMouseupHandler);		
		seekBar.addEventListener("change", seekBarChangeHandler);
		video.addEventListener("click", videoClickHandler);
		video.addEventListener("timeupdate", videoTimeUpdateHandler);
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

var oldVolume = 0.0; 

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
		console.log(time);
		// Update the video time
		video.currentTime = time;
	}

	function videoClickHandler(){
		playButton.click();
	}
	

var topics = [
	{"start": 0, "end": 30, "keywords":[
		{"label": "function", "importance": "high"},
		{"label": "computation", "importance": "medium"},
		{"label": "primitive", "importance": "low"}
		]
	}, 
	{"start": 31, "end": 60, "keywords":[
		{"label": "loop", "importance": "high"},
		{"label": "construct", "importance": "high"},
		{"label": "bit", "importance": "low"}
		]
	}, 
	{"start": 61, "end": 150, "keywords":[
		{"label": "iterate", "importance": "high"},
		{"label": "variable", "importance": "medium"},
		{"label": "state", "importance": "medium"}
		]
	}, 
	{"start": 151, "end": 305, "keywords":[
		{"label": "result", "importance": "high"},
		{"label": "variable", "importance": "high"},
		{"label": "initialization", "importance": "low"}
		]
	}


	
];

var lastTimeUpdate = -1000; // force trigger the first time
var currentTopic;

	function displayTopics(currentTime){
		var i, j;
		var $topic;
		$("#current-topic").empty();
		for (i in topics){
			if (currentTime >= topics[i]["start"] && currentTime <= topics[i]["end"]){				
				currentTopic = topics[i];
				// console.log("topic match", currentTopic);
				for (j in currentTopic["keywords"]){
					$topic = $("<span>").text(currentTopic["keywords"][j]["label"]).addClass("topic " + currentTopic["keywords"][j]["importance"]);
					$("#current-topic").append($topic);
					// console.log("adding", currentTopic["keywords"][j]["label"]);
				}
			}
		}	
	}

	var isPeak = false;
	// Update the seek bar as the video plays
	function videoTimeUpdateHandler(){
		if (isPlayUntil)
			console.log("update", video.currentTime, video.playbackRate);
		// Calculate the slider value
		var value = (100 / video.duration) * video.currentTime;
		var intCurrentTime = parseInt(video.currentTime);

		$("#time-display").text(formatSeconds(video.currentTime));		

		// Things that don't need updates every time. 
		// Currently happnening every 2 seconds.
		// TODO: make efficient. reduce looping. group same time topics into a single object
		if (lastTimeUpdate - intCurrentTime < -2 || lastTimeUpdate - intCurrentTime > 2){
			lastTimeUpdate = intCurrentTime;
			// console.log("checking");

			if (typeof currentTopic === "undefined") {
				console.log("first time");
				displayTopics(intCurrentTime);
			} else {
				if (intCurrentTime <= currentTopic["start"] || intCurrentTime >= currentTopic["end"]){
					console.log("topic changed");
					displayTopics(intCurrentTime);
				}				
			}

			Highlight.updateScreenshot(video.currentTime);	
		}
		
		// slow down for hills
		if (isPlayUntil){
			var adjustedSpeed; 
			if (Highlight.isPeak(video.currentTime)){
				adjustedSpeed = Math.max(1, video.playbackRate / 4);
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
					adjustedSpeed = Math.max(1, video.playbackRate);
					changeSpeed(adjustedSpeed);
					if (video.currentTime + adjustedSpeed > playUntilTime)
						video.currentTime = playUntilTime;
					else
						video.currentTime += adjustedSpeed;
				}
				isPeak = true;
			} else {
				adjustedSpeed = Math.max(1, video.playbackRate * 4);
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
					adjustedSpeed = Math.max(1, video.playbackRate);
					changeSpeed(adjustedSpeed);
					if (video.currentTime + adjustedSpeed > playUntilTime)
						video.currentTime = playUntilTime;
					else
						video.currentTime += adjustedSpeed;
				}
				isPeak = false;
			}
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
		$("#speed-dropdown").show();
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
		getCurrentTime: getCurrentTime,
		pause: pause,
		play: play,
		playUntil: playUntil,
		changeSpeed: changeSpeed
	}
}();