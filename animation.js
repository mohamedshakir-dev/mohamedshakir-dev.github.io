(function() {
  ('.luminaire:nth-child(2n)').addClass('on');
  ('.luminaire').on('click', function() {
    (this).toggleClass('on');
  });
});
