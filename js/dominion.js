/*
  TODO:
    Build a new game page to select action cards
      - checks that exactly 10 are selected
      - sorts them by cost
      - select the # and names of players
    Reposition card counts on resize
*/

//Glocal variables
var cards = {};
var hand;
var players;
var handIdx = 0;
var loadCnt = 0;
var socket;
var turn;
var userName;
var curPlayer;


//Web socket
window.addEventListener("load", function() {
  socket = new WebSocket("ws://104.236.51.19:8080/ws");
  socket.onmessage = function(event) {
    var split = event.data.split("=");
    console.log(event.data);
    console.log("Calling " + split[0] + "(" + split[1] + ")");
    window[split[0]](split[1]);
  };
});

//Load xml and create the events
$(document).ready( function() {

  var msgOffset = $("#minLog").offset();
  msgOffset.top = msgOffset.top + $("#minLog").height() + 3;
  $("#messageLog").offset(msgOffset);
  $("#messageLog").hide();

  $("#logControl").click( function() {
    if ( $("#logControl").text() == "+" ) {
      $("#messageLog").show();
      $("#logControl").text("-");
    } else {
      $("#messageLog").hide();
      $("#logControl").text("+");
    }
  });

  $("#playArea").droppable({
    drop: function(event, ui) {
      if ( $(ui.draggable).hasClass("hand") ) {
        if ( curPlayer == userName ) {
          socket.send("playCard=" + $(ui.draggable).attr('id'));
        }
      } else {
        if ( curPlayer == userName ) {
          socket.send("buy=" + $(ui.draggable).attr('id'));
        }
      }
    }
  });

  $("#discardPile").droppable({
    drop: function(event, ui) {
      if ( $(ui.draggable).hasClass("hand") ) {
        socket.send("discard=" + userName + ":" + $(ui.draggable).attr('id'));
      }
    }
  });

  $("#trashPile").droppable({
    drop: function(event, ui) {
      if ( $(ui.draggable).hasClass("hand") ) {
        socket.send("trash=" + userName + ":" + $(ui.draggable).attr('id'));
      }
    }
  });

  $("#hand").droppable({
    drop: function(event, ui) {
      if ( curPlayer == userName ) {
        socket.send("addToHand=" + $(ui.draggable).attr('id'));
      }
    }
  });

  $("#login button").click(function() {
    socket.send("setUserName=" + $("#setUserName").val());
  });

  $("#startGame").click(function() {
    if ( $(".selectItem input:checked").length == 10 ) {
      console.log("Starting the game");
      var output = $.map($('.selectItem input:checked'), function(n, i){
        return n.value;
      }).join(',');
      socket.send("startGame=" + output);
    } else {
      alert("You need 10, you currently have " + $(".selectItem input:checked").length);
    }
  });

  $("#cleanUp").click(function() {
    cleanUp();
  })

  $("#drawPile").click(function() {
    if ( curPlayer == userName ) {
      draw(1);
    } else {
      show(1);
    }
  });

  $("#overlay").click(function() {
    $("#overlay").hide();
  });

  $("label").click(function() {
    var id = $(this).attr('for');
    $(".preview img").attr("src", "images/" + cards[id]["packName"] + "/" + id + ".jpg");
  });

  $("#newGameButton").click(function() {
    $("#newGame").show();
  });

  $("#cancel").click(function() {
    $("#newGame").hide();
  });
});

function setUserName(name) {
  userName = name;
  $("#userName").text(name);
  $("#userName").show();
  $("#setUserName").hide();
  $("#login button").hide();
}

function loadXmlFiles(fileList) {
  var xmlFiles = fileList.split(",");
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
        addTab(json["#document"]["pack"]["name"]);
        json["#document"]["pack"]["card"].forEach(function(el) {
          cards[el["name"]] = el;
          addSelect(el["packName"], el["name"]);
          var thumb = new Image();
          thumb.src = "images/" + el["packName"] + "/tn_" + el["name"] + ".jpg";
          var full = new Image();
          full.src = "images/" + el["packName"] + "/" + el["name"] + ".jpg";
        });
        loadCnt += 1;
      }
    });
  }
  $("#cardselect").tabs();
}

function addTab(tabName) {
  if ( tabName == "common" ) {
    return;
  }
  $("<li><a href=\"#" + tabName + "\">" + tabName + "</li>").appendTo($("#cardselect ul:first"));
  var content = "<table id=\"" + tabName + "\" class=\"wrapper\"><tr><td class=\"selectPane\"><ul>" +
                "</ul></td><td class=\"preview\"><img src=\"images/common/cardback.jpg\" /></td></tr></table>";
  $("#cardselect").append(content);
}

function addSelect(tabName, selectName) {
  if ( tabName == "common" ) {
    return;
  }
  var content = "<li class=\"selectItem\"><input name=\"" + selectName + "\" value=\"" + selectName + "\" type=\"checkbox\">" +
                "<label for=\"" + selectName + "\">" + selectName + "</label></li>";
  $(content).appendTo("#" + tabName + " ul");
}

function startGame(dataString) {
  $("#newGame").hide();
  var dataSplit = dataString.split(":");
  players = dataSplit[1].split(",");

  var cardSplit = dataSplit[0].split(",");
  var cardTuple = [];
  for ( var cost = 1; cost < 20; cost++ ) {
    for ( var i = 0; i < cardSplit.length; i++ ) {
      if ( cards[cardSplit[i]]["cost"] == cost ) {
        cardTuple.push(cardSplit[i]);
      }
    }
  }

  for ( var i = 0; i < cardTuple.length; i++ ) {
    var row = "#actionRow1";
    if ( i > 4 ) {
      row = "#actionRow2";
    }

    var img = $("<img id=\"" + cardTuple[i] + "\" src=\"images/" + cards[cardTuple[i]]['packName'] + "/tn_" + cardTuple[i] + ".jpg\" class=\"card actionCard\"></div>");
    img.appendTo(row);
    img.on('load', function() {
      //console.log("addCardCounts(" + cardTuple[i] + ")");
      addCardCounts($(this));
      $(this).off('load');
    });
  }

  $(".countBottom").each(function() {
    addCardCounts($(this));
  });
  addCardCounts($("#drawPile"));
  addCardCounts($("#discardPile"));

  hand = ["estate", "copper", "estate", "estate", "copper", "copper", "copper", "copper", "copper", "copper"];
  shuffle();

  count = parseInt($("#discardPile_cnt").text()) + $("#playArea img").length + $("#hand img").length;
  updateCount($("#discardPile_cnt"), count);
  $("#playArea").empty();
  $("#hand").empty();
  $("#coins").text(0);
  draw(5);
}

function addCardCounts(el) {
  var id = el.attr('id');
  console.log("addCardCounts(" + id + ")");
  var cardCnt = 10;
  if ( cards[id] && cards[id]['type'] == "victory" ) {
    cardCnt = 8;
    if ( players.length > 2 ) {
      cardCnt = 12;
    }
  }
  if ( el.attr('id') == "curse" ) {
    cardCnt = (players.length - 1) * 10;
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

function log(msg) {
  $("#messageLog").prepend($("#minLog").html());
  $("#minLog").html("<p>" + msg + "</p>");
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

  $(".card").click(function() {
    var id = $(this).attr('id');
    $("#overlay img").attr("src", "images/" + cards[id]["packName"] + "/" + id + ".jpg");
    $("#overlay").show();
  });

  return coins;
}

function startTurn(player) {
  log(player + " starting turn");
  curPlayer = player;
  if ( userName == player ) {
    var coins = 0;
    $("#hand img").each(function() {
      var card = $(this).attr("id");
      if ( cards[card]["type"] == "treasure" ) {
        coins = coins + parseInt(cards[card]["coins"]);
      }
    });

    socket.send("setText=actions:" + 1);
    socket.send("setText=buys:" + 1);
    socket.send("setText=coins:" + coins);

    $(".card").draggable({
      containment: "#container",
      helper: 'clone',
      zIndex: 100
    });
  }
}

function setText(pair) {
  parts = pair.split(":");
  $("#" + parts[0]).text(parts[1]);
}

function playCard(card) {
  log(curPlayer + " played " + card);
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

    if ( curPlayer == userName ) {
      $("#hand #" + card + ":first").remove();
    }
  }
  if ( cards[card]["attack"] != "none" ) {
    $("#attack").append("<p>" + cards[card]["attack"] + "</p>");
    $("#attack").dialog();
  }
}

function buy(card) {
  log(curPlayer + " bought " + card);
  $("<img id=\"" + card + "\" src=\"images/" + cards[card]['packName'] + "/" + card + ".jpg\" class=\"card bought\"></div>").appendTo($("#playArea"));

  updateCount($("#" + card + "_cnt"));

  if ( $("#" + card + "_cnt").text() == "0" ) {
    $("#" + card + ":first").attr("src", "images/blank.png");
    $("#" + card + "_cnt").remove();
  }

  var buys = parseInt($("#buys").text()) - 1;
  $("#buys").text(buys);

  var coins = parseInt($("#coins").text()) - parseInt(cards[card]["cost"]);
  $("#coins").text(coins);

  if ( curPlayer == userName ) {
    hand.push(card);
  }
}

function discard(card) {
  var parts = card.split(":");
  log(parts[0] + " discarded " + parts[1]);
  $("#hand #" + parts[1] + ":first").remove();
}

function trash(card) {
  var parts = card.split(":");
  log(parts[0] + " trashed " + parts[1]);
  $("#hand #" + parts[1] + ":first").remove();
  var delIdx = hand.lastIndexOf(parts[1]);
  hand.splice(delIdx, 1);
}

function addToHand(card) {
  log(curPlayer + " added " + card + " to their hand");
  if ( curPlayer == userName ) {
    $("<img id=\"" + card + "\" src=\"images/" + cards[card]['packName'] + "/" + card + ".jpg\" class=\"card hand\"></div>").appendTo($("#hand"));
  }
}

function show(card) {
  draw(1);
  socket.send("log=" + userName + " drew " + $("#hand img:last").attr("id"));
}

function cleanUp(nextTurn) {
  log(curPlayer + " cleaned up, ending turn");
  if ( curPlayer == userName ) {
    count = parseInt($("#discardPile_cnt").text()) + $("#playArea img").length + $("#hand img").length;
    updateCount($("#discardPile_cnt"), count);
  }
  $("#playArea").empty();
  if ( curPlayer == userName ) {
    $("#hand").empty();
    draw(5);
    var idx = players.indexOf(curPlayer);
    if ( idx == players.length - 1 ) {
      socket.send("startTurn=" + players[0]);
    } else {
      socket.send("startTurn=" + players[idx + 1]);
    }
  }
}

function error(message) {
  alert(message);
}
