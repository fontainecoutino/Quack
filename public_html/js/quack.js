/*
    NAME: Fontaine Coutino
    DATE: August 12, 2020
    COURSE: CS 337
    ASSIGNMENT: FINAL; Quack
    FILE: quack.js
    PURPOSE: Javascript for Quack. Makes various calls using AJAX in order
    to get information to be displayed.

    ** NOTE **
    This is mostly set up so that if needed i could later change to
    display different pages instead of just changing html. 
*/

sessionUsername = '';

/**
 * Called in order to store user in js file as well as 
 * setting up info in Quack page
 */
function setup() {
    $.ajax({
        url: '/cookies/',
        success: (result) => {
            let cookie = JSON.parse(result);
            sessionUsername = cookie.login.username;
        }
    })

    // Loads home page
    home();
}

/**
 * Responsible for displaying content on page. Changes main content with 
 * given content. Then changes title and button colors. If needed, page
 * scrolls to top.
 * @param {string} content Html containing content to display
 * @param {string} page Title og page being displayed
 */
function displayPage(content, page) {
    $('#mainContent').html(content);
    $('#headerTitle').html('<p id="headerTitle">' + page.toUpperCase() + '</p>');
    $('.sidebarButton').css('color', '#edf2f4');
    $('#' + page + 'Button').css('color', '#ef233c');
    $("#main").animate({
        scrollTop: document.body.scrollHeight
    }, 100);
}

/* ---------------------------------- Home ---------------------------------- */
 
/**
 * Responsible for homepage call to display.
 */
function home() {
    $.ajax({
        url: '/home/',
        success: (result) => {
            if (result == 'Expired cookie' ||
                result == 'Error loading posts') {
                window.location.reload();

            } else {
                displayPage(postsHtml(JSON.parse(result)), 'home');
            }
        }
    })
}

/* --------------------------------- Explore -------------------------------- */

/**
 * Responsible for explore page call to display.
 */
function explore() {
    $.ajax({
        url: '/explore/',
        success: (result) => {
            if (result == 'Expired cookie' ||
                result == 'Error loading posts') {
                window.location.reload();

            } else {
                displayPage(postsHtml(JSON.parse(result)), 'explore')
            }
        }
    })
}

/* -------------------------------- New Quack ------------------------------- */

/**
 * Responsible for displaying new quack form. 
 */
function quack() {
    let html = `
    <div id="quackDiv" class="add">
    <form action="/quack" method="post" enctype="multipart/form-data">
        <h1>What would you like to quack?</h1>
        <textarea id="quackText" class="quackInput" name="quackText" rows="4"
            placeholder="Quack quack" maxlength="300"></textarea>
        <div id="imageQuack">
            <svg id="imageIcon" width="20px" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" d="M14.002 2h-12a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-12-1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12z"/>
                <path d="M10.648 7.646a.5.5 0 0 1 .577-.093L15.002 9.5V14h-14v-2l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71z"/>
                <path fill-rule="evenodd" d="M4.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
            </svg>
            <input type="file" id="chooseImage" accept="image/*" name="image">
        </div>
        <div id="submitDiv">
            <input type="submit" id="submitQuack" value="QUACK">
        </div>
    </form></div>`

    displayPage(html, 'quack')
}

/* --------------------------------- Profile -------------------------------- */
 
 /**
  * Responsible for making profile call on given user. If no username is given,
  * it utilizes session username. 
  * @param {string} username Profile being searched
  */
function profile(username = sessionUsername) {
    $.ajax({
        url: '/profile/' + username,
        success: (result) => {
            if (result == 'Expired cookie' ||
                result == 'Error loading profile information') {
                window.location.reload();

            } else { // Success
                let info = JSON.parse(result);
                displayPage(profileInfoHtml(info) + postsHtml(info.posts), 'profile')

                if (username == sessionUsername) {
                    $('#profileButton').css('color', '#ef233c');
                } else {
                    $('#profileButton').css('color', '#edf2f4');
                }
            }
        }
    })
}
 
/**
 * Receives profile information to be displayed. Based on if its users session,
 * other user, if followed, etc; it displays different information.
 * @param {object} info Public profile information
 */
function profileInfoHtml(info) {
    var profilePictureHtml = `<img id="profilePicture" src="img/${info.profilePicture}" 
    alt="${info.username}'s profile picture" style="cursor:default">`
    if (info.status == 'self') {
        var statusHtml = '<button class="profileButton" onclick="logout()">Log Out</button>'
        if (info.profilePicture == 'defaultProfilePic.jpg') {
            var profilePictureHtml = `<img id="profilePicture" src="img/defaultProfilePic.jpg" 
             onclick="addProfilePic()" alt="${info.username}'s profile picture">`
        }
    } else if (info.status == 'followed') {
        var statusHtml = `<button class="profileButton" onclick="unfollow('${info.username}')">Unfollow</button>`
    } else {
        var statusHtml = `<button class="profileButton" onclick="follow('${info.username}')">Follow</button>`
    }

    let html = `
        <div id="profileDiv">
            <div id="profileTop">
                ${profilePictureHtml}
                <div id="insideTop">
                    <p id="username">${info.username}</p>
                    ${statusHtml}
                </div>
            </div>
            <div class="profileBottom">
                <span id="postsProfile" class="infoText">${info.posts.length} posts</span>   
                <span id="followersProfile" class="infoText" >${info.followers} followers</span>
                <span id="followingProfile" class="infoText">${info.following} following</span>
            </div>
        </div> `
    return html;
}
 
/**
 * Responsible for displaying for for adding profile picture.
 */
function addProfilePic() {
    let html = `
    <div id="newQuackDiv" class="add">
        <form action="/addProfilePic" method="post" enctype="multipart/form-data">
            <h1>Add a profile picture</h1>
            <div id="imageQuack" style="margin:0 auto; text-align: center;">
                <svg id="imageIcon" width="20px" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M14.002 2h-12a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm-12-1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12z"/>
                    <path d="M10.648 7.646a.5.5 0 0 1 .577-.093L15.002 9.5V14h-14v-2l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71z"/>
                    <path fill-rule="evenodd" d="M4.502 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                </svg>
                <input type="file" id="chooseImage" accept="image/*" name="image">
            </div>
            <div id="submitDiv">
                <input type="submit" id="submitQuack" value="Add">
            </div>
        </form></div>`

    $('#mainContent').html(`<div id="mainContent">${html}</div>`);
    $('#headerTitle').html('<p id="headerTitle">USER</p>');
}
 
/**
 * Responsible for making logout call
 */
function logout() {
    $.ajax({
        url: '/logout/',
        success: (result) => {
            window.location.reload();
        }
    })
}
 
/**
 * Responsible for making follow call on user
 */
function follow(username = sessionUsername) {
    $.ajax({
        url: '/user/follow/' + username,
        success: (result) => {
            profile(username)
        }
    })
}
 
/**
 * Responsible for making logout call on user
 */
function unfollow(username = sessionUsername) {
    $.ajax({
        url: '/user/unfollow/' + username,
        success: (result) => {
            profile(username)
        }
    })
}

/* ---------------------------------- Posts --------------------------------- */

/**
 * Responsible for displaying list of given object posts.
 * @param {[object]} posts Object array o posts
 */
function postsHtml(posts) {
    var html = '';
    for (i = 0; i < posts.length; i++) {
        html += postHtml(posts[i])
    }
    return html;
}

/**
 * Responsible for displaying individual post. 
 * @param {object} post Post Object 
 */
function postHtml(post) {
    var pictureHtml = '';
    if (post.picture != 'none') pictureHtml = `<div class="picturePostDiv"><img src="img/${post.picture }" alt="Post picture" class="picturePost"></div>`

    var likeAttributesHtml = `style="color:#edf2f4" onclick="likePost('${post._id}');" `
    if (post.likes.includes(sessionUsername)) likeAttributesHtml = `style="color:#ef233c" onclick="unlikePost('${post._id}');"`

    let html = `
        <div id="${post._id}" class="post">
            <div class="topPost">
                <img src="img/${post.profilePicture}" alt="${post.profilePicture}'s profile picture" onclick="profile('${post.username}')" class="profilePicturePost">
                <p class="usernamePost"">@${post.username}</p>
            </div>
            <div class="midPost">
                <p class="textPost">${post.text}</p>
                ${pictureHtml}
            </div>
            <div class="botPost">
                <div class="likesBotPost">
                    <svg ${likeAttributesHtml} id="likeIcon-${post._id}" class="postButton" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z" />
                    </svg>
                    <p id="likeNumber-${post._id}" class="likesNumPost">${post.likes.length}</p>
                </div>
                <div class="commentBotPost" id="commentBox-${post._id}" >
                    <div class="commentIconBotPost">
                        <svg id="commentIcon-${post._id}" class="postButton" onclick="openComment('${post._id}');" viewBox="0 0 16 16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M14.5 3h-13a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z" />
                            <path fill-rule="evenodd" d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                        </svg>
                    </div>
                </div>
            </div>
            ${commentsHtml(post.comments)}
        </div>`
    return html;
}
 
/**
 * Responsible for displaying comments. Only displays the last three
 * comments on the post. 
 * @param {[Object]} comments Comment Object Array of three comments
 */
function commentsHtml(comments) {
    if (comments.length < 1) return '';

    let commentsReversed = comments.reverse();
    // only up to 3 comments per post
    var html = '<div class="commentsPost">';

    html += `<p class="comment" onclick="profile('${commentsReversed[0].username}')">${commentsReversed[0].username}: ${commentsReversed[0].text}</p>`;
    if (comments.length > 1) html += `<p class="comment" onclick="profile('${commentsReversed[1].username}')">${commentsReversed[1].username}: ${commentsReversed[1].text}</p>`;
    if (comments.length > 2) html += `<p class="comment" onclick="profile('${commentsReversed[2].username}')">${commentsReversed[2].username}: ${commentsReversed[2].text}</p>`;
    return html + '</div>';
}
 
/**
 * Responsible for liking post. Makes call to like id on post
 * @param {string} id ID of posts
 */
function likePost(id) {
    $.ajax({
        url: '/like/like/' + id,
        success: (result) => {
            if (result == 'Expired cookie' ||
                result == 'Error liking post') {
                window.location.reload();

            } else {
                var info = JSON.parse(result);

                $('#likeNumber-' + id).html(info.postLikes);
                $('#likeIcon-' + id).css('color', '#ef233c');
                $('#likeIcon-' + id).attr('onclick', 'unlikePost("' + id + '")');
                $('#likesProfile').html(info.userLikes + ' likes');
            }
        }
    })
}
 
/**
 * Responsible for un liking post. Makes call to like id on post
 * @param {string} id ID of posts
 */
function unlikePost(id) {
    $.ajax({
        url: '/like/unlike/' + id,
        success: (result) => {
            if (result == 'Expired cookie' ||
                result == 'Error liking post') {
                window.location.reload();

            } else {
                var info = JSON.parse(result)

                $('#likeNumber-' + id).html(info.postLikes)
                $('#likeIcon-' + id).css('color', '#edf2f4')
                $('#likeIcon-' + id).attr('onclick', 'likePost("' + id + '")')
                $('#likesProfile').html(info.userLikes + ' likes')
            }
        }
    })
}

/**
 * Responsible for opening comment box on post. 
 * @param {string} id ID of posts
 */
function openComment(id) {
    // Adds input box
    let html = `<input type="text" id="commentInput-${id}"  class="commentOnPost" maxlength="50" name="commentInput-${id}" >`
    $(html).hide().appendTo('#commentBox-' + id).show('fast')
    $('#commentInput-' + id).focus();

    // Submit on Enter
    $('#commentInput-' + id).on('keypress', function (e) {
        if (e.which === 13) {
            //Disable textbox to prevent multiple submit
            $(this).attr("disabled", "disabled");
            //Store to post comments and display
            comment($('#commentInput-' + id).val(), id);
            // Closes comment box
            closeComment(id)
        }
    });

    // Changes comment icon to close 
    $('#commentIcon-' + id).attr('onclick', 'closeComment("' + id + '")')
}
 
/**
 * Responsible for commenting post. Makes call to commenting  on post
 * @param {string} text Text of comment
 * @param {string} id Id for post being commented
 */
function comment(text, id) {
    $.ajax({
        url: '/comment/',
        data: {
            user: JSON.stringify({
                postId: id,
                text: text
            })
        },
        method: 'POST',
        success: (result) => {
            if (result == 'Expired cookie' ||
                result == 'Error commenting post') {
                window.location.reload();

            } else {
                // Redraw post
                $('#' + id).replaceWith(postHtml(JSON.parse(result)));
            }
        }
    })
}

/**
 * Responsible for closing comment box on post. 
 * @param {string} id ID of posts
 */
function closeComment(id) {
    $('#commentInput-' + id).hide('fast', function () {
        $('#commentInput-' + id).remove();
    });
    $('#commentIcon-' + id).attr('onclick', 'openComment("' + id + '")')
}

/* ---------------------------------- Help ---------------------------------- */

/**
 * Responsible for displaying help page
 */
function help() {
    let html = `<div id="helpHome" class="helpContent">
                <h3 class="contentTitle">Home</h3>
                <p>Your homepage is composed of Quacks from all the Quackers you 
                follow. They are order by time and allow you to stay up to date. 
                This page will ONLY include Quacks from other Quackers.</p>
            </div>
            <div id="helpExplore" class="helpContent">
                <h3 class="contentTitle">Explore</h3>
                <p>Your explore page is composed of Quacks from Quackers all over 
                the platform. There is no order in which the Quacks are displayed. 
                This page contains up to 50 quacks, which means that you would 
                have to refresh the page to get more. </p>
            </div>
            <div id="helpQuacking" class="helpContent">
                <h3 class="contentTitle">Quacking</h3>
                <p>The whole purpose of Quack is to... well Quack. If you would 
                like to Quack you need to click on the New Quack button. Quacks 
                can contain up to 200 characters and 1 image.<br> <br> Anyone 
                can Quoment or Quicke a Quack. Quickes are displayed 
                next to the heart. The comment section only displays the three 
                latest comments on the quack. </p>
            </div>

            <div id="helpProfile" class="helpContent">
                <h3 class="contentTitle">Profile</h3>
                <p>Your profile page is composed of your username, profile picture, and data
                showing the amount of post, followers, and following on your profile. It then
                shows all the post you have made.<br><br> If you have not set your picture, 
                an egg profile picture will show as your profile picture. You can set 
                your profile picture by clicking on the egg. But remember you can only do 
                this once! <br><br> You will also view other Quackers with the same format.</p>
            </div>`

    displayPage(html, 'help')
}