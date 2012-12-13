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