"use strict";

// Adding user interaction event logs
var Log = function ($, window, document) {

    // pid: participant ID. serves as a unique session ID.
    // tid: task ID. serves as a unique task ID. N tasks in a session.
    // torder: task order in a session. starts from 1 and increments for each session.
    // ttype: task type. "vs": visual search, "ps": problem search, "sk": skimming
    // iid: interface ID. "con": control interface, "exp": experimental interface
    var conditions = {
        // "1": {
        //     "pid": 1,
        //     "tid": 1,
        //     "torder": 1,
        //     "ttype": "vs",
        //     "iid": "con"
        // },
        // "2": {
        //     "pid": 1,
        //     "tid": 2,
        //     "torder": 2,
        //     "ttype": "vs",
        //     "iid": "exp"
        // }
    };

    var postQuestionnaireUrl = "";
    var tutorialConUrl = "";
    var tutorialExpUrl = "";

    // video IDs to use for tasks.
    var videos = [];

    function createTasks() {
        var numParticipants = 12;
        var numTasks = 8;
        var tseq = ["vs", "vs", "vs", "vs", "ps", "ps", "sk", "sk"];
        var itype1 = ["con", "exp", "con", "exp", "con", "exp", "con", "exp"];
        var itype2 = ["exp", "con", "exp", "con", "exp", "con", "exp", "con"];
        // var ttype = ["vs", "ps", "sk"];
        var i, j, itype, taskOrder;
        var taskCount = 0;
        for (i = 1; i <= numParticipants; i++) {
            // console.log("Participant", i);

            for (j = 0; j < numTasks; j++) {
                taskCount += 1;
                // taskOrder = taskCount % tseq.length;
                if (i % 2 == 0)
                    itype = itype1;
                else
                    itype = itype2;
                // if (taskOrder == 0)
                //     taskOrder = tseq.length;
                Log.conditions[taskCount] = {
                    "pid": i,
                    "tid": taskCount,
                    "torder": j + 1,
                    "ttype": tseq[j],
                    "iid": itype[j]
                }
            }
        }
        console.log(taskCount, "tasks created");
        console.log(Log.conditions);
    }


    function add(module, action, message) {
        $.ajax({
            type: "POST",
            url: "/app/log-ajax/",
            data: {
                csrfmiddlewaretoken: document.getElementsByName('csrfmiddlewaretoken')[0].value,
                pid: "test",
                tid: 1,
                module: module,
                action: action,
                message: JSON.stringify(message)
            },
        }).done(function(data){
            // console.log("add-log done");
        }).fail(function(){
            console.log("add-log failed");
        }).always(function(){
        });
    }

    return {
        conditions: conditions,
        tutorialConUrl: tutorialConUrl,
        tutorialExpUrl: tutorialExpUrl,
        postQuestionnaireUrl: postQuestionnaireUrl,
        videos: videos,
        createTasks: createTasks,
        add: add
    };
}(jQuery, window, document);