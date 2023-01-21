let socket = io();

let colors = ["btn-red", "btn-primary", "btn-success", "btn-yellow"];

$(document).ready(() => {
    for (let i = 1; i <= 8; i++) {
        $("#racerButton-" + i).addClass(colors[(i - 1) % 4]);
    }
})

socket.on("Current Racers", (racers) => {
    console.log(racers);

    for (let i = 1; i <= 8; i++) {
        if (i <= racers.length) {
            let racer = racers[i - 1];
            $("#racerButton-" + i).html("#" + racer.number + ": " + racer.fname + " " + racer.lname);
            $("#racerButton-" + i).show();
        } else {
            $("#racerButton-" + i).hide();
        }
        
    }
});