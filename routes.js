//Importar de Controllers Admin y Website
var website = require('./controllers/website'),
    admin = require('./controllers/admin');

//Comprobacion de administrador
function is_admin(req, res, next) {
  if(req.user && req.user.admin) {
    next();
  } else {
    res.redirect('/');
  }
}

module.exports = function (app, passport) {

  /*
   * Urls del Website
   */
  app.get('/', website.index);
  app.post('/feedback', website.feedback);
  app.get('/salir', website.salir);

  /*
   * Urls de administracion
   */
  app.get('/admin',          is_admin, admin.index);
  app.get('/admin/feedback', is_admin, admin.feedback);
  app.get('/admin/users',    is_admin, admin.users);

  app.post('/admin/update',  is_admin, admin.update);
  /*
   * Urls de autenticacion
   */
  // Auth Twitter
  app.get('/auth/twitter', passport.authenticate('twitter'));
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', { successRedirect: '/',
                                       failureRedirect: '/' }));
  // Auth Facebook
  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
                                       failureRedirect: '/' }));

//Todo lo demas 404 NOT FOUND
  app.all('*', website.notFound);
};