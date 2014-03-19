"use strict";

// Topicflow at the top of the video player
var Topicflow = function ($, window, document) {

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

    var currentTopic;


    function init() {
        bindEvents();
    }

    function bindEvents() {
        $(document).on("click", "#video-top .topic", topicClickHandler);
    }

    function topicClickHandler() {
        var clickedTopic = $(this).text();
        $("input.search-bar").val(clickedTopic).trigger("keyup");
    }

    function displayTopics(currentTime){
        var i, j;
        var $topic;
        $("#current-topic").empty();
        for (i in topics){
            if (currentTime >= topics[i]["start"] && currentTime <= topics[i]["end"]){
                Topicflow.currentTopic = topics[i];
                // console.log("topic match", Topicflow.currentTopic);
                for (j in Topicflow.currentTopic["keywords"]){
                    $topic = $("<span>").text(Topicflow.currentTopic["keywords"][j]["label"]).addClass("topic " + Topicflow.currentTopic["keywords"][j]["importance"]);
                    $("#current-topic").append($topic);
                    // console.log("adding", Topicflow.currentTopic["keywords"][j]["label"]);
                }
            }
        }
    }

    return {
        init: init,
        currentTopic: currentTopic,
        displayTopics: displayTopics
    };
}(jQuery, window, document);