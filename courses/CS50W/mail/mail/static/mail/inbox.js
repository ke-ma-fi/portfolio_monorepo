document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());
  document.querySelector('#compose-form').addEventListener('submit', (event) => submit(event));

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#mailview').style.display= 'none';

  // Get form fields
  let recipients = document.querySelector('#compose-recipients');
  let subject = document.querySelector('#compose-subject');
  let body = document.querySelector('#compose-body');

  // Check if user wants to reply. If so load content else clear form
  if (email == undefined){
    recipients.value = '';
    subject.value = '';
    body.value = '';
  } else {
    recipients.value = email.sender;
    subject.value = email.subject.toLowerCase().startsWith('re:') ? email.subject : `Re: ${email.subject}`;
    body.value = `\n______________________\nOn ${email.timestamp} "${email.sender}" wrote:\n${email.body}`;
  }
}  

function submit(event){
  let recipients = document.querySelector('#compose-recipients');
  let subject = document.querySelector('#compose-subject');
  let body = document.querySelector('#compose-body');
  //handle submition
  event.preventDefault();
  fetch('/emails', {
    method:'POST',
    body: JSON.stringify({
      recipients: recipients.value,
      subject: subject.value,
      body: body.value
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.message !== undefined){
      alert(data.message);
      load_mailbox('sent');
    } else if ( data.error !== undefined){
      alert(data.error);
    }
  })
  .catch(error => {
    console.log(error);
    alert(error);
  })
}



function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mailview').style.display= 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //fetch emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      //create div for each mail
      const div = document.createElement('div');
      div.id = email.id;
      //style mail div
      div.classList.add('email');
      div.classList.add(`${mailbox}`);
      div.style.border = '1px solid black';
      div.style.borderRadius = '10px';
      div.style.margin = '10px 10px';
      div.style.padding = '10px 10px';
      //show rquired content
      div.innerHTML = `
      <div class="sender">${email.sender}</div>
      <div class="subject">${email.subject}</div>
      <div class="timestamp">${email.timestamp}</div>
      `;
      //style arcordingly to read state
      if (email.read){
        div.style.backgroundColor = 'gray';
      } else {
        div.style.backgroundColor = 'white';
      }
      document.querySelector('#emails-view').append(div);

      //listen for mail clicked
      document.querySelectorAll('.email').forEach(email => email.addEventListener('click', (event) => load_email(event)));
    });
  })
}

function load_email(event){
  // show mail and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mailview').style.display= 'block';

  const mail = event.target.closest('.email')
  //Check if we selectet the right div
  if (mail.classList.contains('email')){
    // fetch content of email
    fetch(`/emails/${mail.id}`)
    .then(response => response.json())
    .then(email => {
      //display content on email view
      const view = document.querySelector('#mailview');
      view.innerHTML = `
      <div>Resipients: ${email.recipients}</div>
      <div>Subject: ${email.subject}</div>
      <div>On: ${email.timestamp}</div>
      <div style="white-space: pre-wrap;">${email.sender} wrote: <br> <br> ${email.body}</div><br><br>
      `;
      console.log(email)
      if (!mail.classList.contains('sent')){
        //create buttons for archive and reply
        const buttons = document.createElement('div');
        buttons.innerHTML = `
        <button data-id="${email.id}" data-action="${email.archived ? 'unarchive' : 'archive'}" id="archive"> ${email.archived ? 'Unarchive' : 'Archive'} </button>
        <button data-id="${email.id}" id="reply"> Reply </button>
        `

        view.append(buttons);
        //add eventlisteners to buttons
        document.querySelector('#archive').addEventListener('click',(event) => archive(event.target.dataset.action, event.target.dataset.id));
        document.querySelector('#reply').addEventListener('click', () => compose_email(email));
      }
    })
    //set read state when user opens an email
    fetch(`/emails/${mail.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  }
}

async function archive(action, mailid){
  //handle archive button clicked
 try {
  await fetch(`/emails/${mailid}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: action === 'unarchive' ? false : true
    })
  })

  load_mailbox('inbox');

 } catch (error) {
  alert(error)
 }

}