document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email('None'));

  document.querySelector('form').onsubmit = function() {

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      alert(result["message"]);
      load_mailbox('sent');
    });

    return false;
  }

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  if(email == 'None'){
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }

  //Relpying a mail
  else {
    document.querySelector('#compose-recipients').value = email.sender;
    if (email.subject.includes('Re')) {
      document.querySelector('#compose-subject').value = email.subject;
    }
    else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  }
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  //Start with the title of the mailbox
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Fetch the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    emails.forEach(function(emails) {

      //Fetch the emails of that mailbox
      fetch(`emails/${emails.id}`)
      .then(response => response.json())
      .then(email => {

        const element = document.createElement('div');
        element.innerHTML = `${email.sender}: ${email.subject} <span class="timestamp">${email.timestamp}<span>`;

        if (email.read) {
          element.style.background = 'lightgray';
        }

        document.querySelector('#emails-view').append(element);
        element.addEventListener('click', () => show_mail(email, mailbox));

      });

    })

  });

}

function archive_mail(email){
  fetch(`emails/${email.id}`, {
  method: 'PUT',
    body: JSON.stringify({
      archived: !email.archived
    })
  })
}

function show_mail(email, mailbox){
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`emails/${email.id}`, {
  method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  document.querySelector('#email-view').innerHTML = 
  `<div><span>From:</span> ${email.sender}</div>
  <div><span>To:</span> ${email.recipients}</div>
  <div><span>Subject:</span> ${email.subject}</div>
  <div><span>Timestamp:</span> ${email.timestamp}</div>
  <hr></hr>
  <div>${email.body}</div>
  <button id="replyButton" class='mailButton'>Reply</button>`;

  if (mailbox === 'sent') {
    return;
  }

  const buttonElement = document.createElement('span');

  if (email.archived) {
   buttonElement.innerHTML = "<button id='archiveButton' class='mailButton'>Unarchive</button>";
  }
  else {
    buttonElement.innerHTML = "<button id='archiveButton' class='mailButton'>Archive</button>"
  }

  document.querySelector('#email-view').append(buttonElement);

  document.querySelector('#archiveButton').addEventListener('click', function(){
    archive_mail(email);
    //re-loading the inbox
    location.reload(true);
  })

  document.querySelector('#replyButton').addEventListener('click', function() {
    compose_email(email);
  })

}
