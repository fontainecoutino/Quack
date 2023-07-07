/*
    NAME: Fontaine Coutino
    DATE: August 12, 2020
    COURSE: CS 337
    ASSIGNMENT: FINAL; Quack
    FILE: access.js
    PURPOSE: Responsible for client side js. Only has two 
    functions, adding login user in and signing user. 
*/

/**
 * Responsible for handling users login request. Sends request
 * to server and if successful, it redirects to ostaa. Otherwise, 
 * it displays error.
 */
function login() {
    let user = {
        username: $('#usernameL').val(),
        password: $('#passwordL').val()
    }

    $.ajax({
        url: '/login/',
        data: {
            user: JSON.stringify(user)
        },
        method: 'POST',
        success: (result) => {
            if (result == 'User does not exist' ||
                result == 'Incorrect password') { // Invalid
                alert(result);
                window.location.reload();

            } else { // Valid
                window.location.href = '/'
            }
        }
    });
}

/**
 * Adds sign up html at bottom of page
 */
function loadSignUp() {
    // load sign up form
    var html = `<br>
    <div id="signUpDiv" class="infoDiv">
        <h2>Sign Up</h2>
        <label for="usernameS">Username</label>
        <input type="text" id="usernameS" class="accessInput" name="usernameS" maxlength="15">
        <label for="passwordS">Password</label>
        <input type="password" id="passwordS" class="accessInput" name="passwordS">
        <button id="signUpButton" onclick="signUp()">Sign Up</button>
    </div><br><br><br><br><br>
    `;
    $('#body').append(html)
    $("html, body").animate({
        scrollTop: document.body.scrollHeight
    }, 500);
    $('#passwordS').on('keypress', function (e) {
        if (e.which === 13) {
            //Disable textbox to prevent multiple submit
            $(this).attr("disabled", "disabled");
            signUp()
        }
        }); 

    // disable sign up button
    $("#forSignUpButton").attr("onclick", "");
}

/**
 * Responsible for handling users sign up request. Sends request
 * to server and displays either success or failure.
 */
function signUp() {
    let user = {
        username: $('#usernameS').val(),
        password: $('#passwordS').val()
    };

    $.ajax({
        url: '/signup/',
        data: {
            user: JSON.stringify(user)
        },
        method: 'POST',
        success: (result) => {
            if ('Added successfully!') { // Log in
                $.ajax({
                    url: '/login/',
                    data: {
                        user: JSON.stringify(user)
                    },
                    method: 'POST',
                    success: (result) => {
                        if (result == 'User does not exist' ||
                            result == 'Incorrect password') { // Invalid
                            alert(result);
                            window.location.reload();
                        } else { // Valid
                            window.location.href = '/'
                        }
                    }
                });
            } else {
                alert(result);
                window.location.reload();
            }

        }
    });
}