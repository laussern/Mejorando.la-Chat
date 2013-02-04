jQuery(function ($) {
    // HTML elements
    var $chatform = $('#chatform'),
        $text     = $chatform.find('input[type="text"]'),
        $publish  = $chatform.find('input[type="checkbox"]'),
        $messages = $('#messages'),
        $mentions = $('#mentions'),
        $chat     = $('.chat'),
        // auth elements
        $login   = $('#login'),
        $overlay = $login.find('.overlay'),
        $panel   = $login.find('.panel');

    // socket elements
    var socket = io.connect('/');
    
    // prompt for login
    if($login.size() > 0) {
        $text.focus(function () {
            $login.addClass('show');
            $overlay.addClass('fadeIn');
            $panel.addClass('bounceInDown');
            $text.blur();
        });

        $overlay.click(function () {
            $overlay.addClass('fadeOut');
            $panel.addClass('bounceOutUp');

            setTimeout(function () {
                $login.removeClass('show');
                $overlay.removeClass('fadeOut fadeIn');
                $panel.removeClass('bounceOutUp bounceInDown');
            }, 1010);
        });
    }

    $chatform.submit(function () {
        var text = $text.val();

        // si el mensaje no está vacio
        if(!text.match(/^\s*$/)) {
            $chatform.addClass('sending');
            $text.blur();

            socket.emit('send message', { content: text, publish: false });
            socket.once('message sent', function (message) {
                $chatform.removeClass('sending');
                $text.val('');
                $text.focus();

                render(message);
            });
        }

        return false;
    });

    socket.on('send message', function (message) {
        render(message);
    });

    socket.on('message deleted', function (id) {
        $('#message-'+id).remove();
    });

    socket.on('user connected', function (id) {
        $('#users-'+id).addClass('online');
    });

    socket.on('user disconnected', function (id) {
        $('#users-'+id).removeClass('online');
    });

    socket.on('encuesta', function (questions) {
        if($('#encuesta').size() <= 0) return;
        
        var html = '';

        for(var i = 1; i <= questions.length; i++) {
            html += '\
            <div class="question">\
                <input type="hidden" name="question['+i+'][content]" value="'+questions[i-1]+'" />\
                <p>'+questions[i-1]+'</p>\
                <p>\
                    <span>\
                        <label>Si</label>\
                        <input type="radio" name="question['+i+'][answer]" value="1" checked /> \
                    </span>\
                    <span>\
                        <label>No</label>\
                        <input type="radio" name="question['+i+'][answer]" value="0" /> \
                    </span>\
                </p>\
            </div>';
        }

        $('#encuesta .questions').html(html).trigger('ready');
    });

    function render(message) {
        var id = 'message-'+(typeof message.id == 'undefined' ? message.datetime : message.id);

        if($('#'+id).size() > 0) return;

        var text = message.content;

        // attacks
        text = text.replace(/&(?!\s)|</g, function (s) { if(s == '&') return '&amp;'; else return '&lt;'; });
        // links
        text = text.replace(/https?:\/\/(\S+)/, '');
        // emoticons
        text = text.replace(/(:\)|:8|:D|:\(|:O|:P|:cool:|:'\(|:\|)/g, '<span title="$1" class="emoticon"></span>');

        message.content = text;


        var actions = '', clase = '';
        if(typeof user != 'undefined') {
            if(user.username != message.user.username) {
                actions += '<a href="#" target="_blank" class="responder icon-undo"></a>';
            } else {
                clase += ' sameuser';
            }

            if(user.upgraded) {
                actions += '<a href="#" target="_blank" class="borrar icon-blocked" data-borrar="'+message.id+'"></a>';
            }

            if(message.user.staff) {
                clase += ' destacado';
            }

            message.content = message.content
                    .replace('@'+user.username, '<span class="mention">@'+user.username+'</span>');
        }

        var fecha = new Date(message.datetime);

        var $message = $('<div class="message'+clase+'" id="'+id+'"><div class="avatar"><a href="'+message.user.link+'" target="_blank"><img src="'+message.user.avatar+'" alt="'+message.user.username+'" width="30" height="30" /></a></div><a href="'+message.user.link+'" target="_blank" class="user">'+message.user.username+'</a><p class="content">'+message.content+'</p><div class="time"><small title="'+fecha.toISOString()+'">'+fecha.toString('MMMM d, HH:mm')+'</small></div><div class="actions">'+actions+'</div></div>');
        $messages.prepend($message);

        // si tiene una mencion
        if($message.find('.mention').size() > 0) {
            var html = '<div class="message'+clase+'"><div class="avatar"><a href="'+message.user.link+'" target="_blank"><img src="'+message.user.avatar+'" alt="'+message.user.username+'" width="30" height="30" /></a></div><a href="'+message.user.link+'" target="_blank" class="user">'+message.user.username+'</a><p class="content">'+message.content+'</p><div class="time"><small title="'+fecha.toISOString()+'">'+fecha.toString('MMMM d, HH:mm')+'</small></div><div class="actions">'+actions+'</div></div>';
            $message = $(html);
            $mentions.prepend($message);
        
            if(canSound) mentionSnd.play();

            $('#mention-btn').addClass('new');
        }
    }

    $messages.on('click', '.borrar',  function () {
        var $self = $(this);

        $self.addClass('ready');

        $(document).mousedown(function (evt) {
            if($self.is(evt.target)) return;

            $self.removeClass('ready');
            $(document).unbind('mousedown', arguments.callee);
        });

        return false;
    });

    $messages.on('click', '.borrar.ready', function () {
        var $self = $(this),
            $message = $self.closest('.message');

        socket.emit('delete message', $self.attr('data-borrar'));
        
        $message.remove();

        return false;
    });

    $chat.on('click', '.responder',  function () {
        var $self = $(this);

        var mention = $self.closest('.message').find('.user').text();

        if(mention) {
            if($text.val().length > 0 ) {
                $text.val($text.val() + ' @'+mention);
            } else {
                $text.val('@'+mention+' ');
            }
            $text.focus();
        }

        return false;
    });

    var $menu = $('#user-nav');
    $menu.on('click', '#mention-btn', function () {
        var $self = $(this);

        if($self.hasClass('icon-mention')) {
            $chat.addClass('alternate');
            $self.removeClass('icon-mention new').addClass('icon-bubble');
        } else {
            $chat.removeClass('alternate');
            $self.addClass('icon-mention').removeClass('icon-bubble');
        }

        return false;
    });

    var canSound = true;
    $menu.on('click', '#sound-btn', function () {
        var $self = $(this);

        if($self.hasClass('icon-volume-high')) {
            $self.removeClass('icon-volume-high').addClass('icon-volume-mute');
            canSound = false;
        } else {
            $self.addClass('icon-volume-high').removeClass('icon-volume-mute');
            canSound = true;
        }

        return false;
    });

    var mentionSnd = new Audio('sound/mention.wav');

    +function () {
        var $encuesta = $('#encuesta'),
            $overlay = $encuesta.find('.overlay'),
            $panel = $encuesta.find('.panel');

        if($encuesta.size() <= 0) return;

        $encuesta.on('ready', function () {
            $encuesta.addClass('show');
            $overlay.addClass('fadeIn');
            $panel.addClass('bounceInDown');
        });

        $encuesta.on('submit', 'form', function () {
            var $form = $(this);

            $(this).addClass('sending');

            $.post($form.attr('action'), $form.serialize(),
                function (r) {
                    $overlay.addClass('fadeOut');
                    $panel.addClass('bounceOutUp');

                    setTimeout(function () {
                        $encuesta.removeClass('show');
                        $overlay.removeClass('fadeOut fadeIn');
                        $panel.removeClass('bounceOutUp bounceInDown');
                    }, 1010);
            });

            return false;
        });
    }();

    $('.users a').click(function () {
        var $self = $(this);

        var mention = $self.attr('data-user');

        if(mention) {
            if($text.val().length > 0 ) {
                $text.val($text.val() + ' @'+mention);
            } else {
                $text.val('@'+mention+' ');
            }

            $text.focus();
        }

        return false;
    });
});
