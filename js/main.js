//TODO
//1. Fix issue with GO hanging on screen when buttons clicked quickly

document.addEventListener('DOMContentLoaded', main);

function main() {
  var sb = new SimonBoard();
  var previousWWidth = window.innerWidth;
  var lastButton = document.getElementById('lastButton');
  var longestButton = document.getElementById('longestButton');
  var strictButton = document.getElementById('strictButton');
  var startButton = document.getElementById('startButton');
  var greenButton = document.getElementById('greenButton');
  var redButton = document.getElementById('redButton');
  var yellowButton = document.getElementById('yellowButton');
  var blueButton = document.getElementById('blueButton');
  var wrongSound = document.getElementById('wrongSound');

  wrongSound.volume = 0.4;
  sb.drawSimon();
  longestButton.addEventListener('click', sb.longest);
  lastButton.addEventListener('click', sb.lastButton);
  startButton.addEventListener('click', sb.startNewGame);
  greenButton.addEventListener('click', sb.buttonHandler);
  redButton.addEventListener('click', sb.buttonHandler);
  yellowButton.addEventListener('click', sb.buttonHandler);
  blueButton.addEventListener('click', sb.buttonHandler);

  strictButton.addEventListener('click', sb.changeStrictMode);
  window.addEventListener('resize', function() {
    if (window.innerWidth !== previousWWidth) {
      previousWWidth = window.innerWidth;
      sb.drawSimon();
    }
  });
}

  function addClass(element, clss) {
    var re = new RegExp('\\b' + clss + '\\b');//not perfect since some word boundary characters are permissible in class names -- but good enough for this project
    if (!re.test(element.className)) element.className += ' ' + clss;
  }

  function removeClass(element, clss) {
    var re = new RegExp('\\b' + clss + '\\b');
    if (re.test(element.className)) element.className = element.className.replace(re, '');
  }

  function hasClass(element, clss) {
    var re = new RegExp('\\b' + clss + '\\b');
    return re.test(element.className);
  }

  function toggleClass(element, clss) {
    if (hasClass(element, clss)) removeClass(element, clss);
    else addClass(element, clss);
  }

function SimonBoard() {
  var self = this;
  var moves = [], longest = [], playMode = false;
  var simonBoard = document.getElementById('simonBoard');
  var controlPanel = document.getElementById('controlPanel');
  var simonBrand = document.getElementById('simonBrand');
  var simonLabel = document.getElementById('simonLabel');
  var tmLabel = document.getElementById('tm');
  var countDisplay = document.getElementById('count');
  var greenButton = document.getElementById('greenButton');
  var redButton = document.getElementById('redButton');
  var yellowButton = document.getElementById('yellowButton');
  var blueButton = document.getElementById('blueButton');
  var buttonCaptions = document.getElementsByClassName('buttonCaption');
  var controlPanelButtons = document.getElementsByClassName('controlPanelButton');
  var strictIndicator = document.getElementById('strictIndicator');
  var startGameSound = document.getElementById('startGameSound');
  var currentMove, allowButtonClick = true, strictMode = false, timeoutIDs = [], clickTimerID, blinkID, victoryID, victoryDone;

  this.drawSimon = function() {//sets the width/height of the board, centers the control panel, and adjusts fonts and border width all based on screen size. All fonts/borders are set based on what looks good when radius = 661.
    var wHeight = window.innerHeight;
    var wWidth = window.innerWidth;
    var radius = Math.min(wHeight, wWidth) * 0.9;
    var controlPanelMargin;
    var leftMargin = (wWidth - radius) / 2;

    for (var i = 0, buttonCaptionsLength = buttonCaptions.length; i < buttonCaptionsLength; i++) buttonCaptions[i].style['font-size'] = (15 / 661) * radius + 'px';
    for (var i = 0, controlPanelButtonsLength = controlPanelButtons.length; i < controlPanelButtonsLength; i++) controlPanelButtons[i].style['border-width'] = (4 / 661) * radius + 'px';
    simonBoard.style.width = radius + 'px';
    simonBoard.style.height = radius + 'px';
    simonBoard.style['margin-left'] = leftMargin + 'px';

    controlPanel.style['border-width'] = (20 / 661) * radius + 'px';
    controlPanelMargin = (radius - controlPanel.offsetWidth) / 2;
    controlPanel.style.left = controlPanelMargin + 'px';
    controlPanel.style.top = controlPanelMargin + 'px';
    simonLabel.style['font-size'] = (110 / 661) * radius + 'px';
    tmLabel.style['font-size'] = (20 / 661) * radius + 'px';
    countDisplay.style['font-size'] = (34 / 661) * radius + 'px';
    strictIndicator.style['font-size'] = (25 / 661) * radius + 'px';

    greenButton.style['border-width'] = (20 / 661) * radius + 'px ' + (10 / 661) * radius + 'px ' + (10 / 661) * radius + 'px ' + (20 / 661) * radius + 'px';
    redButton.style['border-width'] = (20 / 661) * radius + 'px ' + (20 / 661) * radius + 'px ' + (10 /661) * radius + 'px ' + (10 / 661) * radius + 'px';
    yellowButton.style['border-width'] = (10 / 661) * radius + 'px ' + (10 / 661) * radius + 'px ' + (20 / 661) * radius + 'px ' + (20 / 661) * radius + 'px';
    blueButton.style['border-width'] = (10 / 661) * radius + 'px ' + (20 / 661) * radius + 'px ' + (20 / 661) * radius + 'px ' + (10 / 661) * radius + 'px';
  };

  this.lastButton = function(){this.blur(); if (allowButtonClick && moves.length > 0) playMoves();};

  this.changeStrictMode = function() {
    this.blur();
    var strictIndicator = document.getElementById('strictIndicator');
    if (hasClass(strictIndicator, 'strictOn')) {
      strictMode = false;
      removeClass(strictIndicator, 'strictOn');
    }
    else {
      strictMode = true;
      addClass(strictIndicator, 'strictOn');
    }
    self.startNewGame();
  };

  var newMove = function() {
    moves.push(Math.floor(Math.random() * 4));
    var movesLength = moves.length;

    countDisplay.textContent = (movesLength < 10 ? '0' : '') + movesLength;
    playMoves();
  }

  var playMoves = function() {
    allowButtonClick = false;
    clearTimeout(clickTimerID);
    var greenButtonSound = document.getElementById('greenButtonSound');
    var redButtonSound = document.getElementById('redButtonSound');
    var yellowButtonSound = document.getElementById('yellowButtonSound');
    var blueButtonSound = document.getElementById('blueButtonSound');
    var wrongSound = document.getElementById('wrongSound');
    var oldDisplay, movesLength = moves.length;
    var delayModifier = movesLength < 5 ? 0 : movesLength < 9 ? 200 : movesLength < 13 ? 300 : 400;

    currentMove = 0;
    var delay = 500 - delayModifier;
    for (var i = 0; i < movesLength; i++) {
        switch(moves[i]) {
        case 0:
          timeoutIDs.push(setTimeout(function() {
          greenButtonSound.currentTime = 0;
          greenButtonSound.play();
          addClass(greenButton, 'greenButtonSelected');
          setTimeout(function() {removeClass(greenButton, 'greenButtonSelected');}, Math.min(700, 1500 - delayModifier * 3))}, delay));
          break;

        case 1:
          timeoutIDs.push(setTimeout(function() {
          redButtonSound.currentTime = 0;
          redButtonSound.play();
          addClass(redButton, 'redButtonSelected');
          setTimeout(function() {removeClass(redButton, 'redButtonSelected');}, Math.min(700, 1500 - delayModifier * 3))}, delay));
          break;

        case 2:
          timeoutIDs.push(setTimeout(function() {
          yellowButtonSound.currentTime = 0;
          yellowButtonSound.play();
          addClass(yellowButton, 'yellowButtonSelected');
          setTimeout(function() {removeClass(yellowButton, 'yellowButtonSelected');}, Math.min(700, 1500 - delayModifier * 3))}, delay));
          break;

        case 3:
          timeoutIDs.push(setTimeout(function() {
          blueButtonSound.currentTime = 0;
          blueButtonSound.play();
          addClass(blueButton, 'blueButtonSelected');
          setTimeout(function() {removeClass(blueButton, 'blueButtonSelected');}, Math.min(700, 1500 - delayModifier * 3))}, delay));
          break;
      }

      delay += 1600 - (delayModifier * 3);
    //}, 0);
    }
    timeoutIDs.push(setTimeout(function() {
      currentMove = 0;
      oldDisplay = countDisplay.textContent;
      countDisplay.textContent = 'GO';
      allowButtonClick = true
      timeoutIDs.push(setTimeout(function(){countDisplay.textContent = oldDisplay;}, 500));
      clickTimerID = setTimeout(function() {
        allowButtonClick = false;
        wrongSound.currentTime = 0;
        wrongSound.play();
        oldDisplay = countDisplay.textContent;
        countDisplay.textContent = 'NO';
        if (!strictMode) timeoutIDs.push(setTimeout(function(){countDisplay.textContent = oldDisplay; playMoves();}, 1000));
        else (timeoutIDs.push(setTimeout(self.startNewGame, 1000)));
      }, 5000);
    }, delay - 1000 + (delayModifier * 2)));
  }

  this.longest = function() {
    this.blur();
    if (allowButtonClick && longest.length > 0) {
      allowButtonClick = false;
      clearTimeout(clickTimerID);
      var greenButtonSound = document.getElementById('greenButtonSound');
      var redButtonSound = document.getElementById('redButtonSound');
      var yellowButtonSound = document.getElementById('yellowButtonSound');
      var blueButtonSound = document.getElementById('blueButtonSound');
      var oldDisplay = countDisplay.textContent, delay = 250, longestLength = longest.length;
      countDisplay.textContent = (longestLength < 10 ? '0' : '') + longestLength;

      blinkID = setInterval(function(){toggleClass(countDisplay, 'invisibleText')}, 250);

      for (var i = 0; i < longestLength; i++)
        {
       switch(longest[i]) {
        case 0:
          timeoutIDs.push(setTimeout(function() {
          greenButtonSound.currentTime = 0;
          greenButtonSound.play();
          addClass(greenButton, 'greenButtonSelected');
          setTimeout(function() {removeClass(greenButton, 'greenButtonSelected');}, 250);}, delay));
          break;

        case 1:
          timeoutIDs.push(setTimeout(function() {
          redButtonSound.currentTime = 0;
          redButtonSound.play();
          addClass(redButton, 'redButtonSelected');
          setTimeout(function() {removeClass(redButton, 'redButtonSelected');}, 250);}, delay));
          break;

        case 2:
          timeoutIDs.push(setTimeout(function() {
          yellowButtonSound.currentTime = 0;
          yellowButtonSound.play();
          addClass(yellowButton, 'yellowButtonSelected');
          setTimeout(function() {removeClass(yellowButton, 'yellowButtonSelected');}, 250);}, delay));
          break;

        case 3:
          timeoutIDs.push(setTimeout(function() {
          blueButtonSound.currentTime = 0;
          blueButtonSound.play();
          addClass(blueButton, 'blueButtonSelected');
          setTimeout(function() {removeClass(blueButton, 'blueButtonSelected');}, 250);}, delay));
          break;
      }

      delay += 1500;
        }
      timeoutIDs.push(setTimeout(function(){
      clearInterval(blinkID);
      removeClass(countDisplay, 'invisibleText')
      countDisplay.textContent = oldDisplay;
      allowButtonClick = true;
      if (moves.length > 0) clickTimerID = setTimeout(function() {
        allowButtonClick = false;
        wrongSound.currentTime = 0;
        wrongSound.play();
        oldDisplay = countDisplay.textContent;
        countDisplay.textContent = 'NO';
        if (!strictMode) setTimeout(function(){countDisplay.textContent = oldDisplay; playMoves();}, 1000);
        else (setTimeout(self.startNewGame, 1000));
      }, 5000);
      }, delay - 1500));
    }
  }

  this.buttonHandler = function() {
    this.blur();
    if (allowButtonClick) {
    clearTimeout(clickTimerID);
    var greenButtonSound = document.getElementById('greenButtonSound');
    var redButtonSound = document.getElementById('redButtonSound');
    var yellowButtonSound = document.getElementById('yellowButtonSound');
    var blueButtonSound = document.getElementById('blueButtonSound');
    var wrongSound = document.getElementById('wrongSound');
    var element, clss, sound, oldDisplay;

    var curMove = moves[currentMove];
    if ((curMove === 0 && this.id === 'greenButton') || (curMove === 1 && this.id === 'redButton') || (curMove === 2 && this.id === 'yellowButton') || (curMove === 3 && this.id === 'blueButton')) {
      switch (curMove) {
      case 0:
        element = greenButton;
        clss = 'greenButtonSelected';
        sound = greenButtonSound;
        break;

      case 1:
        element = redButton;
        clss = 'redButtonSelected';
        sound = redButtonSound;
        break;

      case 2:
        element = yellowButton;
        clss = 'yellowButtonSelected';
        sound = yellowButtonSound;
        break;

      case 3:
        element = blueButton;
        clss = 'blueButtonSelected';
        sound = blueButtonSound;
        break;
        }

        sound.currentTime = 0;
        sound.play();
        addClass(element, clss);
        setTimeout(function(){removeClass(element, clss)}, 400);

        if (currentMove < moves.length - 1) {
          currentMove += 1;
        clickTimerID = setTimeout(function() {
        allowButtonClick = false;
        wrongSound.currentTime = 0;
        wrongSound.play();
        oldDisplay = countDisplay.textContent;
        countDisplay.textContent = 'NO';
        if (!strictMode) setTimeout(function(){countDisplay.textContent = oldDisplay; playMoves();}, 1000);
        else setTimeout(self.startNewGame, 1000);
      }, 5000);
        }
        else {
          allowButtonClick = false;
          countDisplay.textContent = 'OK';
          if (moves.length > longest.length) longest = moves.slice(0);
          if (moves.length < 20) setTimeout(newMove, 1000);
          else victoryID = setTimeout(victory, 1000);
        }
      }
      else {
          if (moves.length > 0) {
          allowButtonClick = false;
          wrongSound.currentTime = 0;
          wrongSound.play();
          oldDisplay = countDisplay.textContent;
          countDisplay.textContent = 'NO';
          if (!strictMode) setTimeout(function(){countDisplay.textContent = oldDisplay; playMoves();}, 1000);
          else (setTimeout(self.startNewGame, 1000));
          }
        else {
          switch(this.id) {
            case 'greenButton':
              element = greenButton;
              clss= 'greenButtonSelected';
              sound = greenButtonSound;
              break;

            case 'redButton':
              element = redButton;
              clss='redButtonSelected';
              sound = redButtonSound;
              break;

            case 'yellowButton':
              element = yellowButton;
              clss = 'yellowButtonSelected';
              sound = yellowButtonSound;
              break;

            case 'blueButton':
              element = blueButton;
              clss = 'blueButtonSelected';
              sound = blueButtonSound;
              break;
          }

          sound.currentTime = 0;
          sound.play();
          addClass(element, clss);
          setTimeout(function(){removeClass(element, clss)}, 1000);
        }
      }
    }
  }

  var victory = function() {
    allowButtonClick = false;
    var greenButton = document.getElementById('greenButton');
    var redButton = document.getElementById('redButton');
    var yellowButton = document.getElementById('yellowButton');
    var blueButton = document.getElementById('blueButton');
    var victorySound = document.getElementById('victorySound');

    victorySound.currentTime  = 0;
    victorySound.play();
    blinkID = setInterval(function(){toggleClass(countDisplay, 'invisibleText')}, 320);
    victoryID = setInterval(function(){
      if (hasClass(greenButton, 'greenButtonSelected')) {
        removeClass(greenButton, 'greenButtonSelected');
        addClass(redButton, 'redButtonSelected');
      }
      else if (hasClass(redButton, 'redButtonSelected')) {
        removeClass(redButton, 'redButtonSelected');
        addClass(yellowButton, 'yellowButtonSelected');
      }
      else if (hasClass(yellowButton, 'yellowButtonSelected')) {
        removeClass(yellowButton, 'yellowButtonSelected');
        addClass(blueButton, 'blueButtonSelected');
      }
      else {
        removeClass(blueButton, 'blueButtonSelected');
        addClass(greenButton, 'greenButtonSelected');
        }
    }, 320);
    victoryDone = setTimeout(self.startNewGame, 65000);
  }

  this.startNewGame = function() {
    var victorySound = document.getElementById('victorySound'), invisibleID;

    victorySound.pause();
    if ('tagName' in this && this.tagName.toLowerCase() === 'button') this.blur();
    for (var i = 0, timeoutLength = timeoutIDs.length; i < timeoutLength; i++) clearTimeout(timeoutIDs[i]);
    timeoutIDs = [];
    clearTimeout(clickTimerID);
    clearTimeout(victoryDone);
    clearInterval(blinkID);
    clearInterval(victoryID);
    removeClass(countDisplay, 'invisibleText;');
    removeClass(greenButton, 'greenButtonSelected');
    removeClass(redButton, 'redButtonSelected');
    removeClass(yellowButton, 'yellowButtonSelected');
    removeClass(blueButton, 'blueButtonSelected');
    moves = [];
    countDisplay.innerHTML = '&mdash;&mdash;';

    startGameSound.currentTime = 0;
    startGameSound.play();

    invisibleID = setInterval(function() {toggleClass(countDisplay, 'invisibleText');}, 500);
    setTimeout(function(){clearInterval(invisibleID); removeClass(countDisplay, 'invisibleText')}, 2000);
    setTimeout(newMove, 3000);
  };
}
