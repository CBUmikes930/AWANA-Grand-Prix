console.log("raceScript.js loaded");

let curNumber = 0;
let places = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
let colors = ["btn-red", "btn-primary", "btn-success", "btn-yellow"];
let order = [];

$(document).ready(() => {
    reset();

    for (let i = 1; i <= 8; i++) {
        $("#racerButton-" + i).addClass(colors[(i - 1) % 4]);
    }
}).keyup(function(e) {
    if (e.code === "Escape") {
        reset();
    } else if (e.code === "Enter") {
        if (order.length === $(".racerButton").length) {
            submitResults();
        }
    }
});

function reset() {
    // Hide places buttons
    $(".placeButton").hide();
    $("#advancing").hide();

    // Hide advancing options
    let advancing = $(".advancingButton");
    advancing.hide();
    // Remove any previous color classes
    colors.forEach((color) => {
        advancing.removeClass(color);
    });

    // Add the button functionality
    for (let i = 1; i <= 8; i++) {
        $("#racerButton-" + i).off("click");
        $("#racerButton-" + i).click(function() {
            racerButton(i);
        });
    }

    curNumber = 0;
    order = [];
}

function racerButton(number) {
    // Get the matching place button
    let button = $("#placeButton-" + number);
    // Show the button
    button.show();
    // Display the correct place based on the counter
    button.html(places[curNumber++]);

    // Show the advancing block
    $("#advancing").show();

    // Get the matching advance button
    let advance = $("#advancingButton-" + curNumber);
    // Show the button
    advance.show();
    // TODO: Load the content of the matching racer button as the html
    advance.html($("#racerButton-" + number).html())
    // Change the color to match
    advance.addClass(colors[(number - 1) % 4]);

    $("#racerButton-" + number).off("click");

    order.push($("#racerID-" + number).val());
}

function submitResults() {
    console.log(order);

    fetch('/submitResults', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            raceResults: order
        })
    }).then(response => response.json())
    .then(json => {
        window.location.reload();
    }).catch(err => console.log("Error: " + err));
}