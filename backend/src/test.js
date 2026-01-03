const bcrypt = require('bcrypt');
const hash = '$2b$10$4SfA2D.EZIZzBslauZvvm.3mDJYifEDtrWGvdeMflt61m6lL8V.5y';
const passwordAttempt = 'mypassword';

bcrypt.compare(passwordAttempt, hash, (err, result) => {
  if(result) console.log('Password matches!');
  else console.log('Wrong password.');
  console.log()
});
