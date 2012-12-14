var website = require('./controllers/website'),
    admin = require('./controllers/admin');

module.exports = function (app, passport) {

  /*
   * Website urls
   */
  app.get('/', website.index);
  app.get('/salir', website.salir);

  /*
   * Admin urls
   */
  app.get('/admin', admin.index);
  app.post('/admin/update', admin.update);
  /*
   * Passport urls
   */
  // Twitter
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { successRedirect: '/',
                                       failureRedirect: '/' }));
  // Facebook
  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
                                       failureRedirect: '/' }));


  app.all('*', website.notFound);
};