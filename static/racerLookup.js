console.log("racerLookup.js loaded");

let myTimeout;
let colors = ["btn-success", "btn-primary", "btn-warning"];

$(document).ready(() => {
    $("#alert").hide();

    colors.forEach((color) => {
        $("#division").removeClass(color);
    });
    $("#division").addClass(colors[$("#division").val() - 1]);

    $("#division").change(() => {
        colors.forEach((color) => {
            $("#division").removeClass(color);
        });
        $("#division").addClass(colors[$("#division").val() - 1]);
    });
});

function submit_form(option) {
    // Get the name from the form fields
    let body = {};

    if (option === 1) {
        let fname = $("#fname").val();
        let lname = $("#lname").val();
        body = {
            fname: fname,
            lname: lname
        }
    } else {
        let div = $("#division").val();
        let num = $("#number").val();
        body = {
            div: div,
            num: num
        }
    }

    // Send the data to the server to process
    fetch('/racerLookup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => response.json())
    .then(json => {
        console.log(json);
        json.forEach((res) => {
            // Set the alert popup text
            $("#alert-1").text(res.fname + " " + res.lname + " | Division: " + res.group + " Racer #" + res.number);
            $("#alert-2").text("Current Race: " + res.status);

            // Reset the popup timer
            clearTimeout(myTimeout);
            // Show the alert
            $("#alert").show();
                
            // After 3 seconds
            myTimeout = setTimeout(function() {
                // Hide the popup
                $("#alert").hide();
            }, 5000);
            });
    }).catch(err => console.log("Error: " + err));
}