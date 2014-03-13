"use strict";

// Handling peak data for interaction, search, bookmark
// a peak should have the following fields:
// - start: start time
// - top: peak time
// - end: end time
// - type: interaction, bookmark, search
// - score: how strong the peak is
// - label: description or summary of the peak
// - uid: unique ID of (type + integer), e.g., i1, i2, b1, b2, s1, s2...

var Peak = function ($, window, document) {
    var interactionPeaks = [];
    var searchPeaks = [];
    var bookmarkPeaks = [];

    function init(iPeaks, bPeaks) {
        // TODO: handle server-generated bookmarks
        Peak.interactionPeaks = iPeaks;
        Peak.bookmarkPeaks = bPeaks;
        initUID();
        // console.log(interactionPeaks);
    }

    function initUID() {
        for (var i = 0; i < Peak.interactionPeaks.length; i++) {
            Peak.interactionPeaks[i]["uid"] = "i" + (i + 1);
        }
        for (var i = 0; i < Peak.bookmarkPeaks.length; i++) {
            Peak.bookmarkPeaks[i]["uid"] = "b" + (i + 1);
        }
    }

    function assignSearchUID() {
        for (var i = 0; i < Peak.searchPeaks.length; i++) {
            Peak.searchPeaks[i]["uid"] = "s" + (i + 1);
        }
    }

    function getNewBookmarkUID() {
        return "b" + (Peak.bookmarkPeaks.length + 1);
    }

    function sortPeaksByTime(a, b) {
        var aName = a["top"];
        var bName = b["top"];
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    }

    function isInteractionPeak(time) {
        var i;
        for (i in Peak.interactionPeaks) {
            if (Peak.interactionPeaks[i]["start"] <= time && time <= Peak.interactionPeaks[i]["end"])
                return true;
        }
        return false;
    }

    function isSearchPeak(time) {
        var i;
        for (i in Peak.searchPeaks) {
            if (Peak.searchPeaks[i]["start"] <= time && time <= Peak.searchPeaks[i]["end"])
                return true;
        }
        return false;
    }

    function isBookmarkPeak(time) {
        var i;
        for (i in Peak.bookmarkPeaks) {
            if (Peak.bookmarkPeaks[i]["start"] <= time && time <= Peak.bookmarkPeaks[i]["end"])
                return true;
        }
        return false;
    }

    // is now under "any" type of peaks?
    function isPeak(time) {
        return isInteractionPeak(time) || isSearchPeak(time) || isBookmarkPeak(time);
    }


    function addBookmarkPeak(obj) {
        Peak.bookmarkPeaks.push(obj);
        Peak.bookmarkPeaks.sort(sortPeaksByTime);
        console.log(Peak.bookmarkPeaks);
        console.log(Peak.interactionPeaks);
    }


    return {
        init: init,
        interactionPeaks: interactionPeaks,
        searchPeaks: searchPeaks,
        bookmarkPeaks: bookmarkPeaks,
        assignSearchUID: assignSearchUID,
        getNewBookmarkUID: getNewBookmarkUID,
        isInteractionPeak: isInteractionPeak,
        isSearchPeak: isSearchPeak,
        isBookmarkPeak: isBookmarkPeak,
        isPeak: isPeak,
        addBookmarkPeak: addBookmarkPeak,
        sortPeaksByTime: sortPeaksByTime
    };
}(jQuery, window, document);