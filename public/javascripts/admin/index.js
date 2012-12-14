jQuery(function ($) {
	$('.guardar').click(function () {
		var $self = $(this),
			$user = $self.closest('.user'),
			admin = $user.find('.admin').is(':checked'),
			activado = $user.find('.activado').is(':checked'),
			id = $user.attr('data-id');

		$.post('/admin/update', {id: id, admin: admin, activado: activado});
	});
});

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
});