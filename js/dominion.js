/*
  TODO:
    Build a new game page to select action cards
      - checks that exactly 10 are selected
      - sorts them by cost
      - select the # and names of players
    Reposition card counts on resize
*/

var cards = {};
var hand;
var numPlayers = 3;
var handIdx = 0;

$(document).ready( function() {
  console.log("ready");

  var common;
  $.ajax({
    type: "GET",
    url: "xml/common.xml",
    dataType: "xml",
    async: false,
    success: function (xml) {
      common = $.xml2json(xml);
      console.log("common success");
      common["#document"]["pack"]["card"].forEach(function(el) {
        cards[el["name"]] = el;
        var thumb = new Image();
        thumb.src = "images/" + el["name"]['packName'] + "/tn_" + el["name"] + ".jpg";
        var full = new Image();
        full.src = "images/" + el["name"]['packName'] + "/" + el["name"] + ".jpg";
      });
    }
  });
  var base;
  $.ajax({
    type: "GET",
    url: "xml/base.xml",
    dataType: "xml",
    async: false,
    success: function (xml) {
      base = $.xml2json(xml);
      console.log("base success");
      base["#document"]["pack"]["card"].forEach(function(el) {
        cards[el["name"]] = el;
        var thumb = new Image();
        thumb.src = "images/" + el["name"]['packName'] + "/tn_" + el["name"] + ".jpg";
        var full = new Image();
        full.src = "images/" + el["name"]['packName'] + "/" + el["name"] + ".jpg";
      });
    }
  });

  addCardCounts();

  startGame();

  cleanUp();

  startTurn();

  $("#playArea").droppable({
    drop: function(event, ui) {
      if ( $(ui.draggable).hasClass("hand") ) {
        playCard($(ui.draggable).attr('id'));
      } else {
        buy($(ui.draggable).attr('id'));
      }
    }
  });

  $("#cleanUp").click(function() {
    cleanUp();
  })

  $("#drawPile").click(function() {
    draw(1);
  });

  $("#overlay").click(function() {
    $("#overlay").hide();
  })

});

//TODO: Build a getXml function

function startGame() {
  var actionCards = $("#actionCards").val().split(",");

  for ( var i = 0; i < 5; i++ ) {
    $("<img id=\"" + actionCards[i] + "\" src=\"images/" + cards[actionCards[i]]['packName'] + "/tn_" + actionCards[i] + ".jpg\" class=\"card countTop \"></div>").appendTo($("#actionRow1"));
  }
  for ( var i = 5; i < 10; i++ ) {
    $("<img id=\"" + actionCards[i] + "\" src=\"images/" + cards[actionCards[i]]['packName'] + "/tn_" + actionCards[i] + ".jpg\" class=\"card countTop\"></div>").appendTo($("#actionRow2"));
  }

  $('.countTop').each(function() {
    var cardCnt = 10;
    if ( cards[$(this).attr('id')]['type'] == "victory" ) {
      cardCnt = 8;
      if ( numPlayers > 2 ) {
        cardCnt = 12;
      }
    }
    var offset = $(this).offset();
    $("<span class=\"cardCount\" " +
            "id=\"" + $(this).attr('id') + "_cnt\" " +
            "style=\"top:" + (offset.top - 5) + "px; " +
            "left:" + (offset.left + 100) + "px; " +
            "\">" + cardCnt + "</span>").appendTo('body');
  });

  hand = ["estate", "copper", "estate", "estate", "copper", "copper", "copper", "copper", "copper", "copper"];
  shuffle(hand);
}

function addCardCounts() {
  $('.countBottom').each(function() {
    var cardCnt = 8;
    if ( numPlayers > 2 ) {
      cardCnt = 12;
    }
    if ( $(this).attr('id') == "curse" ) {
      cardCnt = (numPlayers - 1) * 10;
    }
    var offset = $(this).offset();
    $("<span class=\"cardCount\" " +
            "id=\"" + $(this).attr('id') + "_cnt\" " +
            "style=\"top:" + (offset.top + 107) + "px; " +
            "left:" + (offset.left - 5) + "px; " +
            "\">" + cardCnt + "</span>").appendTo('body');
  });
}

function shuffle(array) {
  console.log("Every day I'm shufflin...");
  let counter = array.length;
  handIdx = counter;
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter);
    counter--;
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
  return array;
}

function draw(quantity) {
  var coins = 0;
  for ( var i = 0; i < quantity; i++ ) {
    handIdx -= 1;
    if ( cards[hand[handIdx]]["type"] == "treasure" ) {
      coins = coins + parseInt(cards[hand[handIdx]]["coins"]);
    }
    $("<img id=\"" + hand[handIdx] + "\" src=\"images/" + cards[hand[handIdx]]['packName'] + "/" + hand[handIdx] + ".jpg\" class=\"card hand\"></div>").appendTo($("#hand"));
    if ( handIdx == 0 ) {
      shuffle(hand);
    }
  }
  return coins;
}

function startTurn() {
  var coins = 0;
  $("#hand img").each(function() {
    var card = $(this).attr("id");
    if ( cards[card]["type"] == "treasure" ) {
      coins = coins + parseInt(cards[card]["coins"]);
    }
  });
  $("#actions").text(1);
  $("#buys").text(1);
  $("#coins").text(coins);

  $(".card").draggable({
    containment: "#container",
    helper: 'clone',
    zIndex: 100,
    start: function() {
             console.log($(this).attr('id'));
           }
  });
}

function playCard(card) {
  if ( cards[card]["type"] == "action" ) {
    var actCnt = parseInt($("#actions").text()) - 1 + parseInt(cards[card]["actions"]);
    $("#actions").text(actCnt);

    var coins = draw(parseInt(cards[card]["cards"]));

    coins = coins + parseInt($("#coins").text()) + parseInt(cards[card]["coins"]);
    $("#coins").text(coins);

    var buys = parseInt($("#buys").text()) + parseInt(cards[card]["buys"]);
    $("#buys").text(buys);

    $("<img id=\"" + card + "\" src=\"images/" + cards[card]['packName'] + "/" + card + ".jpg\" class=\"card\"></div>").appendTo($("#playArea"));
    $("#hand #" + card + ":first").remove();
    console.log(card + " dropped from hand.");
  }
}

function buy(card) {
  $("<img id=\"" + card + "\" src=\"images/" + cards[card]['packName'] + "/" + card + ".jpg\" class=\"card\"></div>").appendTo($("#playArea"));

  var count = parseInt($("#" + card + "_cnt").text()) - 1;
  $("#" + card + "_cnt").text(count);

  var buys = parseInt($("#buys").text()) - 1;
  $("#buys").text(buys);

  var coins = parseInt($("#coins").text()) - parseInt(cards[card]["cost"]);
  $("#coins").text(coins);

  hand.push(card);
}

function cleanUp() {
  console.log("Cleaning up");
  $("#playArea").empty();
  $("#hand").empty();
  $("#coins").text(0);
  draw(5);
  startTurn();
}
