// ==UserScript==
// @name         Enhanced Sceduly
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Enables selective hiding and displaying of schedule items in Sceduly based on title and group
// @author       Tomislav Petrović <t.petrovic@inet.hr>
// @match        https://sceduly.com/hr/?page=Profile*
// @match        https://sceduly.com/?page=Profile*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sceduly.com
// @require      http://code.jquery.com/jquery-latest.js
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    let paramNames = {"Colors": "Colors", "Address" : "Address", "Group" : "Group", "No Headers" : "No Headers" };
    if (window.location.href.indexOf('/hr/') !== -1) {
        paramNames = {"Colors": "Boje", "Address" : "Adresa", "Group" : "Grupa", "No Headers" : "Bez zaglavlja" };
    }

    const contentContainerTopPadding = $('#contentContainer').css('padding-top');
    const contentContainerLeftPadding = $('#contentContainer').css('padding-left');

    function getSubject(node) {
        return node.find(".title").text().trim() + " " + node.find(".group").text().trim();
    }

    function showOrHide(element, show)
    {
        if (show) {
            element.show();
        } else {
            element.hide();
        }
    }

    function showHideAll(subjects, classes, params)
    {
        $('.event').each(function(i, obj) {
            const subject = getSubject($(this));
            showOrHide($(this), subjects[subject]);

            if (params["Colors"] === false) {
                $(this).attr('class', 'event');
                $(this).css("border-bottom", "1px solid #ccc");
            } else {
                $(this).css('');
                $(this).attr('class', classes[subject]);
            }

            let classRoom = $(this).find('.classroom');
            let classRoomBack = $(this).find('.classroomback');
            if (params["Address"] === true) {
                classRoom.text(classRoomBack.text());
            } else {
                let classRoomText = classRoomBack.text();
                classRoom.text(classRoomText.substring(0, classRoomText.indexOf('@')));
            }
        });

        showOrHide($("#headerContainer"), !params["No Headers"]);
        showOrHide($("#acpMenu"), !params["No Headers"]);
        showOrHide($(".contentSection.noPrint"), !params["No Headers"]);
        if (params["No Headers"] === true) {
            $("#contentContainer").css('padding-top', '0px');
            $("#contentContainer").css('padding-left', '0px');
        } else {
            $("#contentContainer").css('padding-top', contentContainerTopPadding);
            $("#contentContainer").css('padding-left', contentContainerLeftPadding);
        }

        const ths = $('.calendar.month > table > tbody > tr:first-child > th')
        ths.each(function(i, obj) {
            showOrHide($(this), params["Day"+ (i % ths.length)]);
        });
        $('.calendar.month > table > tbody > tr > td').each(function(i, obj) {
            showOrHide($(this), params["Day"+ (i % ths.length)]);
        });
    }

    function createQBlock() {
        var newBlock = $('<block/>');
        newBlock.width("25%");
        newBlock.css("display", "inline-block");
        return newBlock;
    }

    function createCheckbox(params, storageKeyName, paramsDiv, id, param, text, update) {
        var newBlock = createQBlock();
        var input = $('<input />', { type: 'checkbox', id: id, checked: params[param] });
        input.change(function() {
            params[param] = $(this).is(':checked');
            localStorage.setItem(storageKeyName, JSON.stringify(params));
            if (update !== undefined) update();
        });
        input.appendTo(newBlock);
        $('<label />', { 'for': id, text: " " + text }).appendTo(newBlock);
        newBlock.appendTo(paramsDiv);
    }

    var intervalId = window.setInterval(function(){
        const localStorageKeyName = "subjectsState";
        const localStorageParamKeyName = "paramsState";
        clearInterval(intervalId);

        let initialParams = Object.keys(paramNames).reduce(function (map, key) { map[key] = true; return map; }, {});
        $('.calendar.month > table > tbody > tr:first-child > th').each(function(i, obj) {
            initialParams["Day"+i] = true;
        });
        let params = {...initialParams};
        params = JSON.parse(localStorage.getItem(localStorageParamKeyName));
        if (params === null || params.constructor !== Object) {
            params = {...initialParams};
        }

        let subjects = {};
        subjects = JSON.parse(localStorage.getItem(localStorageKeyName));
        if (subjects === null || subjects.constructor !== Object) {
            subjects = {};
        }

        let classes = {};
        $('.event').each(function(i, obj) {
            const subject = getSubject($(this));
            if (!(subject in subjects))
                subjects[subject] = true;

            classes[subject] = $(this).attr('class');

            const classroomBackupDiv = $('<div/>');
            classroomBackupDiv.addClass('classroomback');
            classroomBackupDiv.text($(this).find('.classroom').text().trim());
            classroomBackupDiv.hide();
            $(this).append(classroomBackupDiv);
        });

        var newDiv = $('<div/>');
        newDiv.addClass('noPrint');
        var paramsDiv = $('<div/>');
        $.each(Object.keys(params).sort(), function(i, param) {
            if (!param.startsWith("Day")) {
                createCheckbox(params, localStorageParamKeyName, paramsDiv, param, param, paramNames[param], function() { showHideAll(subjects, classes, params); });
            }
        });
        $('.calendar.month > table > tbody > tr:first-child > th').each(function(i, obj) {
            createCheckbox(params, localStorageParamKeyName, paramsDiv, "Day" + i, "Day" + i, $(this).text(), function() { showHideAll(subjects, classes, params); });
        });
        paramsDiv.appendTo(newDiv);

        const divider = $('<div/>');
        divider.height('2px');
        divider.css('background-color', '#ccc');
        divider.appendTo(newDiv);

        var subjectDiv = $('<div/>');
        $.each(Object.keys(subjects).sort(), function(i, subject) {
            createCheckbox(subjects, localStorageKeyName, subjectDiv, "Subject" + i, subject, subject, function() { showHideAll(subjects, classes, params); });
        });
        subjectDiv.appendTo(newDiv);
        $(".tabMenuContentContainer").prepend(newDiv);

        showHideAll(subjects, classes, params);
        localStorage.setItem(localStorageKeyName, JSON.stringify(subjects));
        localStorage.setItem(localStorageParamKeyName, JSON.stringify(params));
    }, 100);

})();