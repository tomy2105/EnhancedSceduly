// ==UserScript==
// @name         Enhanced Sceduly
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Enables selective hiding and displaying of schedule items in Sceduly based on title and group
// @author       Tomislav Petrović <t.petrovic@inet.hr>
// @match        https://sceduly.com/hr/?page=Profile*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sceduly.com
// @require      http://code.jquery.com/jquery-latest.js
// @grant        none
// @license      none
// ==/UserScript==

(function() {
    'use strict';

    const contentContainerTopPadding = $('#contentContainer').css('padding-top');
    const contentContainerLeftPadding = $('#contentContainer').css('padding-left');

    function getSubject(node) {
        return node.find(".title").text().trim() + " " + node.find(".group").text().trim();
    }

    function showHideAll(subjects, classes, params)
    {
        $('.event').each(function(i, obj) {
            const subject = getSubject($(this));
            if (!subjects[subject])
                $(this).hide();
            else
                $(this).show();
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
            if (params["Group"] === false) {
                $(this).find('.group').hide();
            } else {
                $(this).find('.group').show();
            }
            if (params["No Headers"] === true) {
                $("#headerContainer").hide();
                $("#acpMenu").hide();
                $(".contentSection.noPrint").hide();
                $("#contentContainer").css('padding-top', '0px');
                $("#contentContainer").css('padding-left', '0px');
            } else {
                $("#headerContainer").show();
                $("#acpMenu").show();
                $(".contentSection.noPrint").show();
                $("#contentContainer").css('padding-top', contentContainerTopPadding);
                $("#contentContainer").css('padding-left', contentContainerLeftPadding);
            }

        });
    }

    function createQBlock() {
        var newBlock = $('<block/>');
        newBlock.width("25%");
        newBlock.css("display", "inline-block");
        return newBlock;
    }


    let lastLocation = "";
    var intervalId = window.setInterval(function(){
        const localStorageKeyName = "subjectsState";
        const localStorageParamKeyName = "paramsState";
        clearInterval(intervalId);

        let initialParams = {"Colors": true, "Address" : true, "Group" : true, "No Headers" : false };
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
            if (!subjects[subject])
                $(this).hide();
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
            var newBlock = createQBlock();
            var input = $('<input />', { type: 'checkbox', id: param, checked: params[param] });
            input.change(function() {
                params[param] = $(this).is(':checked');
                localStorage.setItem(localStorageParamKeyName, JSON.stringify(params));
                showHideAll(subjects, classes, params);
            });
            input.appendTo(newBlock);
            $('<label />', { 'for': param, text: " " + param }).appendTo(newBlock);
            newBlock.appendTo(paramsDiv);
        });
        paramsDiv.appendTo(newDiv);
        const divider = $('<div/>');
        divider.height('2px');
        divider.css('background-color', '#ccc');
        divider.appendTo(newDiv);
        var subjectDiv = $('<div/>');
        $.each(Object.keys(subjects).sort(), function(i, subject) {
            const isChecked = subjects[subject];
            var newBlock = createQBlock();
            var input = $('<input />', { type: 'checkbox', id: 'cb'+i, checked: isChecked });
            input.change(function() {
                subjects[subject] = $(this).is(':checked');
                localStorage.setItem(localStorageKeyName, JSON.stringify(subjects));
                showHideAll(subjects, classes, params);
            });
            input.appendTo(newBlock);
            $('<label />', { 'for': 'cb'+i, text: " " + subject }).appendTo(newBlock);
            newBlock.appendTo(subjectDiv);
        });
        subjectDiv.appendTo(newDiv);
        $(".tabMenuContentContainer").prepend(newDiv);

        showHideAll(subjects, classes, params);
        localStorage.setItem(localStorageKeyName, JSON.stringify(subjects));
        localStorage.setItem(localStorageParamKeyName, JSON.stringify(params));
    }, 100);

})();