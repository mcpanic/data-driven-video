"use strict";

// Adding user interaction event logs
var Log = function ($, window, document) {

    // pid: participant ID. serves as a unique session ID.
    // tid: task ID. serves as a unique task ID. N tasks in a session.
    // torder: task order in a session. starts from 1 and increments for each session.
    // ttype: task type. "vs": visual search, "ps": problem search, "sk": skimming
    // iid: interface ID. "con": control interface, "exp": experimental interface
    var conditions = {
        "1": {
            "pid": 1,
            "tid": 1,
            "torder": 1,
            "ttype": "vs",
            "iid": "con"
        },
        "2": {
            "pid": 1,
            "tid": 2,
            "torder": 2,
            "ttype": "vs",
            "iid": "exp"
        }
    };


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
        add: add
    };
}(jQuery, window, document);