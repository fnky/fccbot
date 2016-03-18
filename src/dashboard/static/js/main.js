// global array to store poll info....
let pollinfo = [];

/**
 * Add poll option
 */
function addOption() {
  const optiontext = $('#poll_item_input').val();
  $(`<div class="chip">
       <span class="chips">${optiontext}</span>
       <i class="material-icons">close</i>
     </div>`).appendTo('.pollitems');
  $('#poll_item_input').val('');
}

/**
 * Clears all poll items and question from the DOM
 */
function delOptions() {
  $('.pollitems').empty();
  $('#poll_question').val('');
}

function updatePoll() {
  // clear and empty array and poll items
  pollinfo = [];
  $('#right3_collapsible_body').empty();
  $('.right3_collapsible_header').text($('#poll_question').val());
  $('.chips').each((index, element) => {
    pollinfo.push($(element).text());
  });

  console.log(pollinfo);

  for (const x of pollinfo) {
    $(`<li class="collection-item">${pollinfo[x]}</li>`)
      .appendTo('#right3_collapsible_body');
  }
  // $('#right3_collapsible_body')
  // <li class="collection-item">yes</li>
}


$(document).ready(() => {
  // TODO: If there is no poll remove the poll widget

  // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
  $('.modal-trigger').leanModal();

  $('#poll_item_input').keypress((event) => {
    if (event.which === 13) {
      if ($(this).val() !== '') {
        addOption();
      }
    }
  });

  $('#deloptbtn').click(delOptions);

  $('#submit_poll').click(() => {
    if ($('#poll_question').val() !== '' && $('.chips').length !== 0) {
      updatePoll();

      // 4000 is the duration of the toast
      Materialize.toast('Poll Updated', 3000);
    }
  });
});

$(window).load(() => {
  // FadeOut Preloader
  $('#preloader').fadeOut();
  $("#outer-wrapper").fadeIn('fast');
  // to be fancy with it
});
