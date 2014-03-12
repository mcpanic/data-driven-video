"use strict";

// load and process text transcript
var Transcript = function ($, window, document) {
    var srt;
    var api;
    var isScrollLocked = false;
    var scrollLockCount = 0;
    function init(transcriptUrl) {
        $.ajax(transcriptUrl)
            .done(function (data) {
                // console.log(data);
                srt = data;
                parseSRT();
                bindEvents();
                setTimeout(function () {
                    // delay in srt display cause premature scrollbar,
                    // so wait a couple seconds until everything is ready.
                    $('#transcript').jScrollPane({
                        animateScroll: true
                    });
                    api = $('#transcript').data('jsp');
                    $(".jspPane").on("mousedown mousewheel", function () {
                        // console.log("manual");
                        isScrollLocked = true;
                        scrollLockCount = 0;
                    });
                    setInterval(startScrollCheck, 3000);
                }, 2000);

            })
            .fail(function () {
                console.log("transcript load FAILED");
            })
            .always(function () {
                // do nothing
            });
    }

    function bindEvents() {
        $(document).on("keyup", "input.search-bar", searchKeyupHandler);
        $(document).on("click", ".transcript-time", transcriptClickHandler);
        $(document).on("click", ".transcript-text", transcriptClickHandler);
        $(document).on("click", ".search-found", transcriptClickHandler);

        // s.addEventListener('keydown', find , false);
        // s.addEventListener('keyup', searchHandler, false);
    }

    // unlock scroll if no scroll for 5 seconds && in current viewport
    function startScrollCheck() {
        // offset: location of "current" in respect to transcript
        var offset = document.querySelector(".transcript-entry.current").getBoundingClientRect().top - document.querySelector("#transcript").getBoundingClientRect().top;
        // console.log("scrollCount", scrollLockCount, offset);

        // if within the current viewport, increment count
        if ($(".transcript-entry.current").length === 1
            && offset >= 0
            && offset < document.querySelector("#transcript").getBoundingClientRect().height) {
            scrollLockCount += 1;
            if (scrollLockCount >= 3) {
                isScrollLocked = false;
                scrollLockCount = 0;
                // console.log("scroll start");
            }

        }

    }


    // scroll to given time
    function scrollTo(second) {
        if (typeof api === "undefined" ||
            $(".transcript-entry.current").length === 0 ||
            isScrollLocked) {
            return;
        }
        // console.log($(".transcript-entry.current"));
        var sh = document.querySelector('.jspPane').scrollHeight;
        // $(".transcript-entry.current")
        //     .css("top", this.offsetTop * 100 / sh + "%");
        //     document.querySelector('.transcript-entry.current').offsetTop * 100 / sh + "%"
        api.scrollTo(0, document.querySelector('.transcript-entry.current').offsetTop - 200);
    }

    // highlight the current sentence
    function highlightSentence(second) {
        $(".transcript-entry.current").removeClass("current");
        var $target;
        var closestTime = -100;
        $(".transcript-entry").each(function() {
            var currentTime = parseFloat($(this).attr("data-second"));
            if (currentTime <= second && closestTime < currentTime) {
                // console.log(second, "updating to", currentTime);
                closestTime = currentTime;
                $target = $(this);
            }
        });
        if (typeof $target !== "undefined")
            $target.addClass("current");
    }


    function update(second) {
        highlightSentence(second);
        scrollTo(second);
    }


    function searchKeyupHandler() {
        var s = document.querySelector('input.search-bar');
        var p = document.querySelectorAll('.transcript-text');
        var count = 0;
        var term = s.value.toLowerCase();
        var timemarks = [];
        $(".timeline-peak").remove();
        $(".search-tick").remove();
        $(".timeline-result").remove();
        $(".search-summary").text("");
        $(".search-found").each(function () {
            $(this).replaceWith($(this).text());
        });
        // search is over, return to the interaction peaks
        if (term.length == 0) {
            console.log("search over");
            // back to the original graph
            $("#vis-options a").eq(6).trigger("click");
            Highlight.displayPeaks(peaks);
            return;
        }
        // search starts only for queries longer than 3 characters
        if (term.length < 3)
            return;
        // loop through each p and run the code below.
        var j = p.length;
        while (--j >= 0) {
            // console.log(j);
            var words = p[j].innerText.split(/\s+/),
                i = words.length,
                word = '';
            // console.log(j, p[j].innerText, p[j].innerText.split(/\s+/), words.length);
            while(--i >= 0) {
                // console.log(i);
                word = words[i];
                // if(word.toLowerCase() == s.value.toLowerCase()) {
                // partial matching support
                // console.log(term, word.toLowerCase(), term.indexOf(word.toLowerCase()));
                if(word.toLowerCase().indexOf(term) !== -1) {
                    count++;
                    words[i] = "<span class='search-found'>" + word + "</span>";
                }
                else{
                }
            }
            p[j].innerHTML = words.join(' ');
        }

        // current view height
        // var oh = $("#transcript").height();
        // var oh = document.querySelector('#transcript').offsetHeight;
        // entire div height
        var sh = document.querySelector('.jspContainer').scrollHeight;
        // var scrollRatio =  oh / sh;
        // scroll bar height
        // var bh = scrollRatio * oh;
        // console.log("sh", sh, "oh", oh, "bh", bh);
        // var actualScrollHeight = oh - bh;
        // var transcriptTop = $(".jspContainer").position().top;
        $(".search-found").each(function () {
            // console.log(this.offsetTop, (this.offsetTop - transcriptTop));
            $("<span class='search-tick'></span>")
                // .css("top", (this.offsetTop - transcriptTop) * scrollRatio)
                // .css("top", (this.offsetTop - transcriptTop) * 100 / sh + "%")
                .css("top", this.offsetTop * 100 / sh + "%")
                .appendTo(".jspVerticalBar");
                // .appendTo("#transcript-scroll");
            // var scrollTopPosition = $(this).position().top * scrollRatio;
            // document.querySelector("html").scrollHeight
            // document.querySelector("html").clientHeight

            // add ticks to the timeline
            var second = $(this).closest(".transcript-entry").attr("data-second");
            var xPos = second / duration * 100 - 8 * 100 / visWidth;
            $("<div/>")
                .addClass("timeline-result by-search")
                .attr("id", "timeline-search-" + second)
                .data("second", second)
                .data("summary", term)
                .css("left", xPos + "%")
                .appendTo("#timeline");

            timemarks.push(parseInt(second));
        });
        // add Gaussian and convolution to the timeline
        var searchData = [];
        console.log(timemarks);
        for(var i = 0; i < duration; i++) {
            searchData[i] = 100;
        }
        for(var i = 0; i < duration; i++) {
            if ($.inArray(i, timemarks) > -1) {
                searchData[i] += 500;
                searchData[i+1] += 400;
                searchData[i+2] += 300;
                searchData[i+3] += 200;
                searchData[i+4] += 100;
                searchData[i-1] += 400;
                searchData[i-2] += 300;
                searchData[i-3] += 200;
                searchData[i-4] += 100;
            }
        }
        console.log(searchData);
        Timeline.drawPlayVis(searchData, duration);

        $(".search-summary").text(count + " results found on ");

    }


    function transcriptClickHandler() {
        var second = $(this).closest(".transcript-entry").attr("data-second");
        Player.seekTo(second);
    }


    function toSeconds(t) {
        var s = 0.0;
        if(t) {
                var p = t.split(':');
                var i;
                for(i=0;i<p.length;i++)
                    s = s * 60 + parseFloat(p[i].replace(',', '.'));
        }
        return s;
    }

    function strip(s) {
        return s.replace(/^\s+|\s+$/g,"");
    }
    function parseSRT() {
        // http://v2v.cc/~j/jquery.srt/jquery.srt.js
        // var videoId = subtitleElement.attr('data-video');
        // var srt = subtitleElement.text();
        // subtitleElement.text('');
        srt = srt.replace(/\r\n|\r|\n/g, '\n');
        // console.log(srt);
        var subtitles = {};
        srt = strip(srt);
        // console.log(srt);
        var srt_ = srt.split('\n\n');
        var s, n, i, o, t, j, is, os;
        for (s in srt_) {
            var st = srt_[s].split('\n');
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
                $("#transcript").append("<div class='transcript-entry' data-second='" + is + "'><span class='transcript-time'>" + formatSeconds(is) + "</span>" + "<span class='transcript-text'>" + t + "</span></div>");
            }
        }

        console.log(subtitles);

        // var currentSubtitle = -1;
        // var ival = setInterval(function () {
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
        init: init,
        scrollTo: scrollTo,
        highlightSentence: highlightSentence,
        update: update
    }
}(jQuery, window, document);