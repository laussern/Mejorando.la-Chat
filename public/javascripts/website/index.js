jQuery(function ($) {
    // HTML elements
    var $chatform = $('#chatform'),
        $text     = $chatform.find('input[type="text"]'),
        $publish  = $chatform.find('input[type="checkbox"]'),
        $messages = $('#messages'),
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
                $overlay.removeClass('fadeOut').removeClass('fadeIn');
                $panel.removeClass('bounceOutUp').removeClass('bounceInDown');
            }, 1010);
        });
    }

    $chatform.submit(function () {
        var text = $text.val();

        // si el mensaje no está vacio
        if(!text.match(/^\s*$/)) {
            $chatform.addClass('sending');
            $text.blur();

            socket.emit('send message', { content: text, publish: $publish.is(':checked') });
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
                actions += '<a href="#" target="_blank" class="responder"></a>';
            } else {
                clase += ' sameuser';
            }

            if(user.upgraded) {
                actions += '<a href="#" target="_blank" class="borrar" data-borrar="'+message.id+'"></a>';
            }

            if(message.user.staff) {
                clase += ' destacado';
            }

            message.content = message.content
                    .replace('@'+user.username, '<span class="mention">@'+user.username+'</span>');
        }


        var fecha = new Date(message.datetime);

        var $message = $('<div class="message'+clase+'" id="'+id+'"><div class="avatar"><a href="'+message.user.link+'" target="_blank"><img src="'+message.user.avatar+'" alt="'+message.user.username+'" width="30" height="30" /></a></div><a href="'+message.user.link+'" target="_blank" class="user">'+message.user.username+'</a><p>'+message.content+'</p><div class="time"><small title="'+fecha.toISOString()+'">'+fecha.toString('MMMM d, HH:mm')+'</small></div><div class="actions">'+actions+'</div></div>');
        $messages.prepend($message);
    }

    $('a.borrar').live('click', function () {
        var $self = $(this);

        $self.addClass('ready');

        $(document).mousedown(function (evt) {
            if($self.is(evt.target)) return;

            $self.removeClass('ready');
            $(document).unbind('mousedown', arguments.callee);
        });

        return false;
    });

    $('a.borrar.ready').live('click', function () {
        var $self = $(this),
            $message = $self.closest('.message');

        socket.emit('delete message', $self.attr('data-borrar'));
        
        $message.remove();

        return false;
    });

    $('a.responder').live('click', function () {
        var $self = $(this);

        var mention = $self.closest('.message').find('.user').text();

        if(mention && mention !== '') {
            $text.val('@'+mention+' ').focus();
        }

        return false;
    });
});
