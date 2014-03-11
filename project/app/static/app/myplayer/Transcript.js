// load and process text transcript
var Transcript = function() {
	// http://v2v.cc/~j/jquery.srt/jquery.srt.js

	var srt;
	function init(transcriptUrl){
		$.ajax(transcriptUrl)
			.done(function(data){
				// console.log(data);
				srt = data;
				parseSRT();
			})
			.fail(function(){
				console.log("transcript load FAILED")
			})
			.always(function(){

			});
	}
  function toSeconds(t) {
    var s = 0.0
    if(t) {
      var p = t.split(':');
      for(i=0;i<p.length;i++)
        s = s * 60 + parseFloat(p[i].replace(',', '.'))
    }
    return s;
  }	
	function strip(s) {
		return s.replace(/^\s+|\s+$/g,"");
	}
	function parseSRT() {
		// var videoId = subtitleElement.attr('data-video');
		// var srt = subtitleElement.text();
		// subtitleElement.text('');
		srt = srt.replace(/\r\n|\r|\n/g, '\n')
		// console.log(srt);
		var subtitles = {};
		srt = strip(srt);
		// console.log(srt);
		var srt_ = srt.split('\n\n');
		for(s in srt_) {
		    st = srt_[s].split('\n');
		    if(st.length >=2) {
		    	// console.log(st);
		        n = st[0];
		        i = strip(st[1].split(' --> ')[0]);
		        o = strip(st[1].split(' --> ')[1]);
		        t = st[2];
		        if(st.length > 2) {
		        	for(j=3; j<st.length;j++)
		          		t += '\n'+st[j];
		        }
		        if (typeof t === "undefined")
		        	continue;
		        is = toSeconds(i);
		        os = toSeconds(o);
		        subtitles[is] = {i:is, o: os, t: t};
		        $("#transcript").append("<div class='transcript-entry'><span class='transcript-time'>" + formatSeconds(is) + "</span>" + "<span class='transcript-text'>" + t + "</span></div>");
		    }
		}

		console.log(subtitles);

		// var currentSubtitle = -1;
		// var ival = setInterval(function() {
		//   var currentTime = document.getElementById(videoId).currentTime;
		//   var subtitle = -1;
		//   for(s in subtitles) {
		//     if(s > currentTime)
		//       break
		//     subtitle = s;
		//   }
		//   if(subtitle > 0) {
		//     if(subtitle != currentSubtitle) {
		//       subtitleElement.html(subtitles[subtitle].t);
		//       currentSubtitle=subtitle;
		//     } else if(subtitles[subtitle].o < currentTime) {
		//       subtitleElement.html('');
		//     }
		//   }
		// }, 100);
	}

	return {
		init: init
	}
}();