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

        $('#drag-drop').fadeIn('slow');
    }

    function handleDragLeave(e) {
        tid = setTimeout(function () {
            e.stopPropagation();
            $('#drag-drop').fadeOut('slow');
        }, 300);
    }

    function handleFileSelect(e) {
        e.stopPropagation();
        e.preventDefault && e.preventDefault();

        $('#drag-drop').fadeOut('slow');

        var files = e.dataTransfer.files; // FileList object.

        // Only proceed when a single file is dropped
        if (files.length > 1 || !files.length) {
            return false;
        }

        var file = files[0];

        // Only allow yaml uploads
        if (file.name.split('.').pop().toLowerCase() !== 'yaml') {
            return false;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                submitForm(e.target.result);
            };
        })(file);

        // Read in the image file as a data URL.
        reader.readAsText(file);

        return false;
    }

    function submitForm(config) {
        if (!config.length) {
            return;
        }

        var form = $(
            '<form action="' + uploadConfigUrl + '" method="post">' +
                '<input type="hidden" name="config" value="' + config + '" />' +
            '</form>'
        );
        $('body').append(form);
        $(form).submit();
    }
    
    
    $('#btnAdd').click(function () {
        var num     = $('.clonedInput').length, // Checks to see how many "duplicatable" input fields we currently have
        newNum  = new Number(num + 1),      // The numeric ID of the new input field being added, increasing by 1 each time
        newElem = $('#startCmd' + num).clone().attr('id', 'startCmd' + newNum).fadeIn('slow'); // create the new element via clone(), and manipulate it's ID using newNum value

        newElem.find('.heading-reference').attr('id', 'ID' + newNum + '_reference').attr('name', 'ID' + newNum + '_reference').html('Command #' + newNum);

        // Insert the new element after the last "duplicatable" input field
        $('#startCmd' + num).after(newElem);
        $('#ID' + newNum + '_title').focus();

        // Enable the "remove" button. This only shows once you have a duplicated section.
        $('#btnDel').attr('disabled', false);

        if (newNum == 10)
            $('#btnAdd').attr('disabled', true).prop('value', "You've reached the limit"); // value here updates the text in the 'add' button when the limit is reached 
    });

    $('#btnDel').click(function () {
        // Confirmation dialog box. Works on all desktop browsers and iPhone.
        if (confirm("Are you sure you wish to remove this section? This cannot be undone."))
        {
            var num = $('.clonedInput').length;
            // how many "duplicatable" input fields we currently have
            $('#startCmd' + num).slideUp('slow', function () {
                $(this).remove();
                // if only one element remains, disable the "remove" button
                if (num -1 === 1)
                    $('#btnDel').attr('disabled', true);
                // enable the "add" button
                $('#btnAdd').attr('disabled', false).prop('value', "add section");
            });
        }
        return false; // Removes the last section you added
    });
    // Enable the "add" button
    $('#btnAdd').attr('disabled', false);
    // Disable the "remove" button
    $('#btnDel').attr('disabled', true);

    return $('.run').click(function() {
        $.get('template/setup.mustache', function(setupTemplate) {
            var setupContent, formData, data = new Object(), startStep = new Object();
            formData = $('.form-horizontal').serializeArray();
            data.start=new Array();
            data.date = new Date();
            for(var current = 0; current<formData.length;current++){
                var key = formData[current].name;
                if(key.substring(0,5) == 'start'){
                    startStep[key] = formData[current].value;
                    if(key == 'startOs'){
                        data.start[data.start.length] = startStep;
                        startStep = new Object();
                    }
                } else {
                    data[key] = formData[current].value;
                }
            }
            
            setupContent = Mustache.to_html(setupTemplate, data).replace(/^\s*/mg, '');
            $('.setup').text(setupContent);
            $('.manifest').text(JSON.stringify(data));
            $('#output').removeClass("hidden").scrollTo(1);
        });
        return Highlight.highlightDocument();
    });
});