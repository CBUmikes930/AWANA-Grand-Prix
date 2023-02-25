let socket = io();

let colors = ["btn-success", "btn-primary", "btn-yellow"];

$(document).ready(() => {
    $("#upNext").hide();
})

socket.on("Next Racers", (racers, groupNum) => {
    console.log(racers);
    $("#upNext").hide();
    $("#racerButton").show();

    // For each racer button
    for (let i = 1; i <= 8; i++) {
        // If a racer exists in the list
        if (i <= racers.length) {
            // Remove the previous color class
            for (let j = 0; j < colors.length; j++) {
                $("#racerButton-" + i).removeClass(colors[j]);
            }

            // Update the button content
            let racer = racers[i - 1];
            $("#racerButton-" + i).html("#" + racer.number + ": " + racer.fname + " " + racer.lname);
            // Add the new color class
            $("#racerButton-" + i).addClass(colors[groupNum - 1]);
            $("#racerButton-" + i).show();
        } else {
            // Otherwise, hide the button
            $("#racerButton-" + i).hide();
        }
    }
});

socket.on("Next Race Type", (raceName) => {
    console.log(raceName);
    $("#racerButton").hide();
    $("#upNext").show();

    $("#upNextText").html("Up Next: " + raceName);
})