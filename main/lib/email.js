const gmail = require('./gmail.js');

/**
  @return Promise resolves to the response object, or rejects on error.
*/
//TODO: Consider using single params {} object.
function send(to,subject,message) {
  const from = 'Reno Pinball Federation <service@RenoPinballFederation.com>';

  return gmail.send({to, from, subject, message});
}

module.exports = {
  send: send
};
