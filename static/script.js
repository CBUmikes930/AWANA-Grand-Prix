console.log("script.js loaded");

let myTimeout;

$(document).ready(() => {
    $("#alert").hide();
    $("#fname").change(() => {
        if ($("#fname").val() == "" && $("#lname").val() == "") {
            $("option").prop('disabled', false);
        } else if ($("#fname").val() == "") {
            lname();
        } else {
            fname();
        }
    });
    $("#lname").change(() => {
        if ($("#fname").val() == "" && $("#lname").val() == "") {
            $("option").prop('disabled', false);
        } else if ($("#lname").val() == "") {
            fname();
        } else {
            lname();
        }
    });
});

function fname() {
    // Disable all autocomplete options
    $("option").prop('disabled', true);
    // Except the ones with a class name matching the firstname value
    $("." + $("#fname").val()).prop('disabled', false);
}

function lname() {
     // Disable all autocomplete options
     $("option").prop('disabled', true);
     // Except the ones with a class name matching the lastname value
     $("." + $("#lname").val()).prop('disabled', false);
}

function submit_form(group_num) {
    // Get the name from the form fields
    let fname = $("#fname").val();
    let lname = $("#lname").val();

    if (fname === "" || lname === "") {
        let res = confirm("You are about to assign a racer to a group without a full name. Are you sure you want to continue?");

        if (!res) {
            return;
        }
    }
    
    // Set the color of the popup based on the group number
    switch (group_num) {
        case 1:
            colorClass = "alert-success";
            break;
        case 2:
            colorClass = "alert-info";
            break;
        case 3:
            colorClass = "alert-warning";
            break;
    }

    // Send the data to the server to process
    fetch('/addRacer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fname: fname,
            lname: lname,
            group: group_num
        })
    }).then(response => response.json())
    .then(json => {
        console.log(json);
        // Set the alert popup text
        $("#alert-1").text(fname + " " + lname + " added to Group " + group_num);
        $("#alert-2").text("Racer #" + json.number);

        // Clear the firstname from the field
        $("#fname").val("");
        // Remove the lastname from the firstname option
        $("#" + fname).removeClass(lname);
        // If there are no more last names for this firstname, then remove the firstname option
        if ($("#" + fname).attr('class') == "") {
            $("#" + fname).remove();
        }
        // Clear the lastname from the field
        $("#lname").val("");
        // Remove the firstname from the lastname option
        $("#" + lname).removeClass(fname);
        // If there are no more first names for this lastname, then remove the lastname option
        if ($("#" + lname).attr('class') == "") {
            $("#" + lname).remove();
        }
        // Show all remaining options
        $("option").prop('disabled', false);

        // Reset the popup timer
        clearTimeout(myTimeout);
        // Change the color
        $("#alert").addClass(colorClass);
        // Show the alert
        $("#alert").show();
            
        // After 3 seconds
        myTimeout = setTimeout(function() {
            // Hide the popup
            $("#alert").hide();
            // Reset the color
            $("#alert").removeClass(colorClass);
        }, 5000);
    }).catch(err => console.log("Error: " + err));
}