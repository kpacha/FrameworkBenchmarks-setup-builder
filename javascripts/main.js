$.fn.scrollTo = function scrollTo(speed) {
    var container, offset, target;
    target = this;
    container = 'html,body';
    offset = $(target).offset().top - 60;
    $(container).animate({
        scrollTop: offset
    }, speed || 1000);
    return this;
};
$(function() {
    
    var dropzone = document.documentElement;
    var tid;

    dropzone.addEventListener('dragover', handleDragOver, false);
    dropzone.addEventListener('dragleave', handleDragLeave, false);
    dropzone.addEventListener('drop', handleFileSelect, false);


    function handleDragOver(e) {
        clearTimeout(tid);
        e.stopPropagation();
        e.preventDefault && e.preventDefault();
        e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.

        $('#myModal').modal('show')
    }

    function handleDragLeave(e) {
        tid = setTimeout(function () {
            e.stopPropagation();
            $('#myModal').modal('hide');
        }, 300);
    }

    function handleFileSelect(e) {
        e.stopPropagation();
        e.preventDefault && e.preventDefault();

        $('#myModal').modal('hide');

        var files = e.dataTransfer.files; // FileList object.

        // Only proceed when a single file is dropped
        if (files.length > 1 || !files.length) {
            return false;
        }

        var file = files[0];

        // Only allow json uploads
        if (file.name.toLowerCase() !== 'setup.json') {
            alert('Not allowed! You shlould try with your setup.json file...')
            return false;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                populateForm(jQuery.parseJSON(e.target.result));
            };
        })(file);

        // Read in the image file as a data URL.
        reader.readAsText(file);

        return false;
    }

    function populateForm(config) {
        if (!config) {
            return;
        }

        var num = $('.clonedInput').length;
        var totalStartCmdGroups = config.start.length;

        if(num > totalStartCmdGroups){
            removeLastStartCmdGroups(num - totalStartCmdGroups);
        }else if(num < totalStartCmdGroups){
            createNewStartCmdGroup(totalStartCmdGroups - num);
        }

        $(':input', '.form-horizontal').val('');
        $('#output').addClass("hidden");
        for(var input in config){
            if(input!=='start'){
                $("[name="+input+"]").val(config[input]);
            }else{
                var startCmds = config[input];
                for(var current = 0; current < startCmds.length; current++){
                    var startCmd = startCmds[current];
                    for(var startCmdInput in startCmd){
                        $("[name="+startCmdInput+"]", '#startCmd' + (current + 1)).val(startCmd[startCmdInput]);
                    }
                }
            }
        }
    }

    function createNewStartCmdGroups(totalStartCmdGroups) {
        var newNum = 0;
        for(var current = 1; current <= totalStartCmdGroups; current++) {
            newNum = createNewStartCmdGroup();
        }
        // Enable the "remove" button. This only shows once you have a duplicated section.
        $('#btnDel').attr('disabled', false);
        if (newNum == 10)
            $('#btnAdd').attr('disabled', true).prop('value', "You've reached the limit"); // value here updates the text in the 'add' button when the limit is reached 
    
    }

    function createNewStartCmdGroup() {
        var num = $('.clonedInput').length, // Checks to see how many "duplicatable" input fields we currently have
        newNum  = new Number(num + 1),      // The numeric ID of the new input field being added, increasing by 1 each time
        newElem = $('#startCmd' + num).clone().attr('id', 'startCmd' + newNum).fadeIn('slow'); // create the new element via clone(), and manipulate it's ID using newNum value

        newElem.find('.heading-reference').attr('id', 'ID' + newNum + '_reference').attr('name', 'ID' + newNum + '_reference').html('Command #' + newNum);

        // Insert the new element after the last "duplicatable" input field
        $('#startCmd' + num).after(newElem);
        $('#ID' + newNum + '_title').focus();
        return newNum;
    }

    function removeLastStartCmdGroups(totalGroupsToRemove) {
        var num = $('.clonedInput').length;
        if(num - totalGroupsToRemove > 0){
            $('#startCmd' + (num - totalGroupsToRemove + 1)).slideUp('fast', function () {
                for(var current = 0; current < totalGroupsToRemove; current++){
                    $('#startCmd' + (num - current)).remove();
                }
                // if only one element remains, disable the "remove" button
                if (num - totalGroupsToRemove === 1)
                    $('#btnDel').attr('disabled', true);
                // enable the "add" button
                $('#btnAdd').attr('disabled', false).prop('value', "add section");
            });
        }
    }

    function downloadDocument(name, content) {
        saveAs(new Blob([content] , {type: "text/plain;charset=UTF-8"}), name);
    }

    $('#btnAdd').click(function () {
        createNewStartCmdGroups(1);
    });
    // Enable the "add" button
    $('#btnAdd').attr('disabled', false);

    $('#btnDel').click(function () {
        // Confirmation dialog box. Works on all desktop browsers and iPhone.
        if (confirm("Are you sure you wish to remove this section? This cannot be undone."))
        {
            removeLastStartCmdGroups(1);
        }
        return false; // Removes the last section you added
    });
    // Disable the "remove" button
    $('#btnDel').attr('disabled', true);

    $('#btnDownloadSetup').click(function(){
        downloadDocument('setup.py', $('.setup').text());
    });
    $('#btnDownloadConfig').click(function(){
        downloadDocument('setup.json', $('.manifest').text());
    });

    return $('.run').click(function() {
        var archetype = $('[name=testArchetype]').val();
        if(archetype){
            archetype = '_' + archetype;
        }
        $.get('template/setup' + archetype + '.mustache', function(setupTemplate) {
            var setupContent, formData, data = new Object(), startStep = new Object();
            formData = $('.form-horizontal').serializeArray();
            data.start=new Array();
            data.date = new Date();
            for(var current = 0; current<formData.length;current++){
                var key = formData[current].name;
                if(key.substring(0,5) == 'start'){
                    startStep[key] = formData[current].value;
                    if(key == 'startCwd'){
                        data.start[data.start.length] = startStep;
                        startStep = new Object();
                    }
                } else {
                    data[key] = formData[current].value;
                }
            }

            setupContent = Mustache.to_html(setupTemplate, data);
            $('.setup').text(setupContent);
            $('.manifest').text(JSON.stringify(data));
            $('#output').removeClass("hidden").scrollTo(1);
        });
        return Highlight.highlightDocument();
    });
});