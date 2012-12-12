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

                render(message);
            });
        }

        return false;
    });

    socket.on('send message', function (message) {
        render(message);
    });

    function render(message) {
        var id = 'message-'+(typeof message._id == 'undefined' ? message.datetime : message._id);

        if($('#'+id).size() > 0) return;

        var text = message.content;

        // attacks
        text = text.replace(/&(?!\s)|</g, function (s) { if(s == '&') return '&amp;'; else return '&lt;'; });
        // links
        //text = text.replace(/http:\/\/(\S+)/, '<a href="http://$1" target="_blank">$1</a>');
        text = text.replace(/http:\/\/(\S+)/, '');
        // emoticons
        text = text.replace(/(:\)|:8|:D|:\(|:O|:P|:cool:|:'\(|:\|)/g, '<span title="$1" class="emoticon"></span>');

        message.content = text;

        var fecha = new Date(message.datetime);

        var actions = '<a href="#" target="_blank" class="responder"></a>';

        var $message = $('<div class="message" id="'+id+'"><div class="avatar"><a href="'+message.user.link+'" target="_blank"><img src="'+message.user.avatar+'" alt="'+message.user.username+'" width="30" height="30" /></a></div><a href="'+message.user.link+'" target="_blank" class="user">'+message.user.username+'</a><p>'+message.content+'</p><div class="time"><small title="'+fecha.toISOString()+'">'+fecha.toString('MMMM d, HH:mm')+'</small></div><div class="actions">'+actions+'</div></div>');
        $messages.prepend($message);
    }
    
});
