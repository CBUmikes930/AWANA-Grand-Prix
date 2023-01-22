console.log("index.js loaded");

$(document).ready(() => {
    $("#delete-button").click(() => {
        let passphrase = "CONFIRM DELETE ALL";
        let res = prompt("Please type the following to confirm you want to delete all racer data:\n\n" + passphrase);

        if (res !== passphrase) {
            alert("You did not correctly enter the phrase. Please try again.");
            return;
        }

        fetch('/deleteAllData', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json())
        .then(json => {
            console.log(json);
        }).catch(err => console.log("Error: " + err));
    });
});