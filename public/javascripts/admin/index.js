jQuery(function ($) {
    /* coneccion socket */
    var socket = io.connect('/');
    /* confirmacion de encuesta */
    $('#publish').click(function () {
        if(confirm('¿ESTAS SEGURO DE QUE DESEAS MANDAR AL VIVO LA ENCUESTA?')) {
            socket.emit('push encuesta', []);
        }
    });

    /* Guardar usuario admin */
    $('.guardar').click(function () {
        var $self = $(this),
            $user = $self.closest('.user'),
            admin = $user.find('.admin').is(':checked'),
            activado = $user.find('.activado').is(':checked'),
            id = $user.attr('data-id');

        $.post('/admin/update', {id: id, admin: admin, activado: activado});
    });

});
/*  Google chart API */
google.load('visualization', '1', {'packages': ['corechart', 'geochart']});

google.setOnLoadCallback(function () {
    var $impacto = $('#impacto');

    if($impacto.size() > 0) {
        var votos = $impacto.attr('data-values').split(',');

        var data = google.visualization.
            arrayToDataTable([['Opinión', 'Votos'], ['Me gusta', parseInt(votos[0], 10)], ['No me gusta', parseInt(votos[1], 10)]]);

        var chart = new google.visualization.PieChart($impacto.get(0));
        chart.draw(data, {
            backgroundColor: 'transparent',
            fontName: 'Open Sans',
            is3D: true,
            slices: [{color: '#6673d8'}, { color: '#d13b3b'}],
            chartArea: {
                left: 0,
                top: 0,
                width: '100%',
                height: '100%'
            },
            legend: {
                position: 'top',
                alignment: 'end',
                textStyle: {
                    color:'white'
                }
            }
        });
    }

    var $geo = $('#geo');

    if($geo.size() > 0) {
        var data2 = google.visualization
            .arrayToDataTable([['País', 'Usuarios']]
            .concat(_.map(JSON.parse($geo.attr('data-values')), function (obj) { return _.values(obj); })));

        var options = {
            backgroundColor: 'transparent',
            datalessRegionColor: '#6673d8',
            colorAxis: {
                colors: ['#d13b3b', '#6d1f1f']
            }
        };

        var chart2 = new google.visualization.GeoChart($geo.get(0));
        chart2.draw(data2, options);
    }
});
/*  Google chart API */

/*
google.load('visualization', '1', {'packages': ['geochart']});

google.setOnLoadCallback(function () {
    var $geo = $('.chart-geo');

    var data = google.visualization
        .arrayToDataTable([['País', 'Usuarios']]
            .concat(_.map(JSON.parse($geo.attr('data-geo')), function (obj) { return _.values(obj); })));

    var options = {
        colorAxis: {
            colors: ['#e6e6e6', '#303030']
        }
    };

    var chart = new google.visualization.GeoChart($geo.get(0));
    chart.draw(data, options);
});*/
