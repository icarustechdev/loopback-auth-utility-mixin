var nodemailer = require('nodemailer');
var path = require('path');

module.exports = function (Model, options) {

    Model.on('attached' , function () {

		/**
         *
		 */
		Model.app.get('/request-password-reset', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/reset-password.html'));
        });

		/**
		 *
		 */
        Model.app.get('/confirm-password-reset', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/confirm-password.html'));
        });

		/**
		 *
		 */
        Model.app.post('/request-password-reset', function(request, response, next) {
            Model.resetPassword({
                email: request.body.email
            }, function(err) {
                if (err) return response.status(401).send(err);
                else return response.status(200).send({
                    statusCode:200,
                    message:'We have sent you a email. Please check your email to reset your password'
                });
            });
        });

		/**
		 *
		 */
        Model.app.post('/confirm-password-reset', function(request, response, next) {
            if(!request.accessToken)
                return response.status(404).send({
                    error: 'Incorrect Token',
                    statusCode:404,
                    message:'Valid token not found'});

            Model.findById(request.accessToken.userId, function(err, user) {
                if(err)
                    return response.status(404).send(err);
                else {
                    user.updateAttribute('password',request.body.password, function(err, res){
                        if (err) return response.status(404).send(err);
                        return response.status(200).send({
                            statusCode:200,
                            message:'password reset processed successfully'
                        });
                    });
                }
            });
        });
    });

    Model.on('resetPasswordRequest', function (info) {

        var settings = Model.app.settings;
        var emailSetupDb = Model.app.models.EmailSetup;
        emailSetupDb.findOne({}, function(emailSetup) {

            var transporter = nodemailer.createTransport({
                host: emailSetup.type + "." + emailSetup.name,
                port: emailSetup.output_smtp,
                secure: emailSetup.with_ssl,
                auth: {
                    user: emailSetup.user,
                    pass: emailSetup.password
                }
            });

            var html = 'Clique neste <a href="'+settings.protocol+'://'+settings.host+':'+settings.port+'/confirm-password-reset?access_token=' + info.accessToken.id + '">link</a> para alterar a sua senha';
            transporter.sendMail({
                from: emailSetup.email,
                to: info.user.email,
                subject: 'Altere sua senha',
                html: html
            }, function (err, success) {
                if(err)
                    console.log('error from the mailer', err);
                else
                    console.log('success from the mailer', success);
            });
        });

    });

};
