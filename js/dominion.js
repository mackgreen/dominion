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
var loadCnt = 0;

$(document).ready( function() {
  console.log("ready");

  loadXmlFiles();

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
  });

});

//TODO: Build a getXml function

function loadXmlFiles() {
  var xmlFiles = ["xml/common.xml", "xml/base.xml"];
  for ( var i = 0; i < xmlFiles.length; i++ ) {
    console.log("Fetching " + xmlFiles[i]);
    $.ajax({
      type: "GET",
      url: xmlFiles[i],
      dataType: "xml",
      async: false,
      success: function (xml) {
        var json = $.xml2json(xml);
        console.log(xmlFiles[i] + " success");
        json["#document"]["pack"]["card"].forEach(function(el) {
          cards[el["name"]] = el;
          var thumb = new Image();
          thumb.src = "images/" + el["packName"] + "/tn_" + el["name"] + ".jpg";
          var full = new Image();
          full.src = "images/" + el["packName"] + "/" + el["name"] + ".jpg";
        });
        loadCnt += 1;
        if ( loadCnt == xmlFiles.length ) {
          $(".countBottom").each(function() {
            addCardCounts($(this));
          });
          addCardCounts($("#drawPile"));
          addCardCounts($("#discardPile"));
          startGame();
          cleanUp();
          startTurn();
        }
      }
    });
  }
}

function startGame() {
  var actionCards = $("#actionCards").val().split(",");

  for ( var i = 0; i < 10; i++ ) {
    var row = "#actionRow1";
    if ( i > 4 ) {
      row = "#actionRow2";
    }

    var img = $("<img id=\"" + actionCards[i] + "\" src=\"images/" + cards[actionCards[i]]['packName'] + "/tn_" + actionCards[i] + ".jpg\" class=\"card\"></div>");
    img.appendTo(row);
    img.on('load', function(){
      addCardCounts($(this));
    });
  }

  hand = ["estate", "copper", "estate", "estate", "copper", "copper", "copper", "copper", "copper", "copper"];
  shuffle();
}

function addCardCounts(el) {
  var id = el.attr('id');
  var cardCnt = 10;
  if ( cards[id] && cards[id]['type'] == "victory" ) {
    cardCnt = 8;
    if ( numPlayers > 2 ) {
      cardCnt = 12;
    }
  }
  if ( el.attr('id') == "curse" ) {
    cardCnt = (numPlayers - 1) * 10;
  }

  var offset = el.offset();
  var top = offset.top - 5;
  var left = offset.left + 100;
  if ( el.hasClass('countBottom') ) {
    top = offset.top + 107;
    left = offset.left - 5;
  }

  $("<span class=\"cardCount\" " +
          "id=\"" + id + "_cnt\" " +
          "style=\"top:" + top + "px; " +
          "left:" + left + "px; " +
          "\">" + cardCnt + "</span>").appendTo('body');
}

function updateCount(el, count) {
  if ( count != 0 ) {
    count = count || parseInt(el.text()) - 1;
  }
  el.text(count);

}

function shuffle() {
  console.log("Every day I'm shufflin...");

  var splice = $("#hand img").length + $(".played").length;
  hand = hand.concat(hand.splice(0, splice));

  console.log("Shuffle splice = " + splice);
  console.log("Hand length = " + hand.length);

  let counter = hand.length - splice + $(".bought").length;
  console.log("Shuffle counter = " + counter);

  console.log("Counter = " + counter);
  handIdx = counter;
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter);
    counter--;
    let temp = hand[counter];
    hand[counter] = hand[index];
    hand[index] = temp;
  }
  updateCount($("#drawPile_cnt"), handIdx);
  updateCount($("#discardPile_cnt"), 0);
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
      shuffle();
    }
  }
  updateCount($("#drawPile_cnt"), handIdx);

  $(".card").draggable({
    containment: "#container",
    helper: 'clone',
    zIndex: 100
  });

  $(".card").click(function(){
    var id = $(this).attr('id');
    $("#overlay img").attr("src", "images/" + cards[id]["packName"] + "/" + id + ".jpg");
    $("#overlay").show();
  });

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
    zIndex: 100
  });
}

function playCard(card) {
  if ( cards[card]["type"] == "action" ) {
    var actCnt = parseInt($("#actions").text()) - 1 + parseInt(cards[card]["actions"]);
    updateCount($("#actions"), actCnt);

    var coins = draw(parseInt(cards[card]["cards"]));

    coins = coins + parseInt($("#coins").text()) + parseInt(cards[card]["coins"]);
    updateCount($("#coins"), coins);

    var buys = parseInt($("#buys").text()) + parseInt(cards[card]["buys"]);
    $("#buys").text(buys);

    $("<img id=\"" + card + "\" src=\"images/" + cards[card]['packName'] + "/" + card + ".jpg\" class=\"card played\"></div>").appendTo($("#playArea"));
    if ( $("#playArea .card").length > 1 && $(".played").length == 1 ) {
      $(".played").css("margin-left", "0px");
    }
    $("#hand #" + card + ":first").remove();
  }
}

function buy(card) {
  $("<img id=\"" + card + "\" src=\"images/" + cards[card]['packName'] + "/" + card + ".jpg\" class=\"card bought\"></div>").appendTo($("#playArea"));

  updateCount($("#" + card + "_cnt"));

  var buys = parseInt($("#buys").text()) - 1;
  $("#buys").text(buys);

  var coins = parseInt($("#coins").text()) - parseInt(cards[card]["cost"]);
  $("#coins").text(coins);

  hand.push(card);
}

function discard(card) {

}

function trash(card) {

}

function addToHand(card) {

}

function show(card) {

}

function cleanUp() {
  console.log("Cleaning up");
  count = parseInt($("#discardPile_cnt").text()) + $("#playArea img").length + $("#hand img").length;
  updateCount($("#discardPile_cnt"), count);
  $("#playArea").empty();
  $("#hand").empty();
  $("#coins").text(0);
  draw(5);
  startTurn();
}
