#include <LiquidCrystal.h>

#include <Key.h>
#include <Keypad.h>

const int PIN_CHANNEL = A0;
const int PIN_MOD = A1;
const int PIN_VOLUME = A2;

const byte KEYBOARD_ROWS = 8;
const byte KEYBOARD_COLS = 12;

const char F1 = 1;
const char F2 = 2;
const char F3 = 3;
const char F4 = 4;
const char FMT= 5;
const char REP= 6;
const char RAD= 7;
const char KVI= 8;
const char SKR= 9;
const char DDA=10;
const char SND=11;
const char EKV=12;
const char MOT=13;
const char AVS=14;
const char ISK=15;
const char OPM=16;
const char EFF=17;
const char AND=18;
const char BEL=19;
const char SLT=20;
const char ENT=21;
const char DEL=22;
const char SFT=23;
const char LFT=24;
const char RGT=25;
const char UP=26;
const char DWN=27;
const char PUP=28;
const char PDN=29;

char keyboard_keys[KEYBOARD_ROWS][KEYBOARD_COLS] = {
 //  1   2   3   4   5   6   7   8   9  10  11  12   COLS
  {  0,  0,  0,  0,  0,  0,  0,  0,  0,'1','2','3'}, // 1
  { F1, F2, F3, F4,FMT,  0,  0,  0,  0,'4','5','6'}, // 2
  {REP,RAD,KVI,SKR,DDA,OPM,EFF,AND,  0,'7','8','9'}, // 3
  {SND,EKV,MOT,AVS,ISK,BEL,SLT,ENT,  0,'*','0','#'}, // 4
  {'Q','W','E','R','T','Y','U','I','O','P','+',DEL}, // 5
  {'A','S','D','F','G','H','J','K','L','o','?',  0}, // 6
  {SFT,'Z','X','C','V','B','N','M',',','.','-',ENT}, // 7
  {  0,LFT,RGT, UP,DWN,' ',' ',' ',' ',PUP,PDN,  0}, // 8
};

byte keyboard_rowPins[KEYBOARD_ROWS] = { 53, 51, 49, 47, 45, 43, 41, 39 };
byte keyboard_colPins[KEYBOARD_COLS] = { 32, 34, 36, 40, 38, 42, 44, 46, 48, 50, 52, 30 }; 

Keypad kpd = Keypad( makeKeymap(keyboard_keys), keyboard_rowPins, keyboard_colPins, KEYBOARD_ROWS, KEYBOARD_COLS );

LiquidCrystal largeDisplay(21, 20, 18, 17, 16, 15);
LiquidCrystal smallDisplay( 6,  7,  9, 10, 11, 12);

byte aring[8] = {
  B00100,
  B00000,
  B01110,
  B10001,
  B11111,
  B10001,
  B10001
};

byte auml[8] = {
  B01010,
  B00000,
  B01110,
  B10001,
  B11111,
  B10001,
  B10001
};

byte ouml[8] = {
  B01010,
  B00000,
  B01110,
  B10001,
  B10001,
  B10001,
  B01110
};

int currentMod = 0;
int currentChannel = 0;
int currentVolume = 0;
String rxBuffer = "";

String largeDisplayText = "";
String smallDisplayText = "";
int largeDisplayCursor = -1;
int smallDisplayCursor = -1;
int largeDisplayBlinking = -1;
int smallDisplayBlinking = -1;
unsigned long blinkTime;
unsigned long pingTime;
bool blink = false;
int blinkDuration = 250;

void setup()
{
  Serial.begin(9600);
  Serial.println("ready");

  largeDisplay.begin(8,2);
  smallDisplay.begin(8,2);

  createChar(0, aring);
  createChar(1, auml);
  createChar(2, ouml);

  blinkTime = millis();
  pingTime = millis();
/*
  printLargeDisplay("164939*FR:CR");
  printSmallDisplay("FRI*TEXT");

  largeDisplayCursor = 0;
  smallDisplayCursor = 0;
  largeDisplayBlinking = 0;
  smallDisplayBlinking = 0;
  */
}

void loop()
{
  sendKeyboardInput();
  sendVredPositions();
  readIncomingMessages();
  loopDisplayEffects();

  unsigned long now = millis();
  if ((now - pingTime) > 10000) {
    printSmallDisplay("E_PING");
  }
}

void loopDisplayEffects() {
  unsigned long now = millis();
  if ((now - blinkTime) > blinkDuration) {
    
    if (largeDisplayBlinking >= 0) {
      String s1 = String(largeDisplayText);
      if (blink) {
        s1.setCharAt(largeDisplayBlinking, ' ');
      }
      printDisplay(largeDisplay, 16, s1);
    }
    if (smallDisplayBlinking >= 0) {
      String s2 = String(smallDisplayText);
      if (blink) {
        s2.setCharAt(smallDisplayBlinking, ' ');
      }
      printDisplay(smallDisplay, 8, s2);
    }

    setCursor(largeDisplay, largeDisplayCursor);
    setCursor(smallDisplay, smallDisplayCursor);

    if (largeDisplayCursor >= 0 && blink) {
      largeDisplay.cursor();
    } else {
      largeDisplay.noCursor();
    }

    if (smallDisplayCursor >= 0 && blink) {
      smallDisplay.cursor();
    } else {
      smallDisplay.noCursor();
    }

    blink = !blink;
    
    blinkTime = now;
  }  
  else {
    setCursor(largeDisplay, largeDisplayCursor);
    setCursor(smallDisplay, smallDisplayCursor);
  }
}

void setCursor(LiquidCrystal lcd, int index) {
  if (index < 0) {
    return;
  }
  int row = index >= 8 ? 1 : 0;
  int col = index >= 8 ? index - 8 : index;
  lcd.setCursor(col, row);
}

void readIncomingMessages() {
  while (Serial.available()) {
    char rx = Serial.read();
    if (rx == '}' || rx == '\n') {
      onReceivedMessage(rxBuffer);
      rxBuffer = "";
    }
    else if ((int)rx == -61) {
      // ignore
    }
    else {
      rxBuffer.concat(rx);
    }
  }  
}

void onReceivedMessage(String message) {
  int space = message.indexOf(' ');
  
  String command;
  String argument;
  if (space > 0) {
    command = message.substring(0, space);
    argument = message.length() > space + 1
      ? message.substring(space + 1)
      : "";
  }
  else {
    command = message;
    argument = "";
  }

  onReceivedCommand(command, argument);
}

void onReceivedCommand(String command, String argument) {
  if (command == "largeDisplay.setText") {
    printLargeDisplay(argument);
  }
  else if (command == "largeDisplay.setCursor") {
    largeDisplayCursor = argument.toInt();
  }
  else if (command == "largeDisplay.setBlinking") {
    largeDisplayBlinking = argument.toInt();
  }
  else if (command == "largeDisplay.clear") {
    largeDisplayBlinking = -1;
    largeDisplayCursor = -1;
    printLargeDisplay("");
  }
  else if (command == "smallDisplay.setText") {
      printSmallDisplay(argument);
  }
  else if (command == "smallDisplay.setCursor") {
    smallDisplayCursor = argument.toInt();
  }
  else if (command == "smallDisplay.setBlinking") {
    smallDisplayBlinking = argument.toInt();
  }
  else if (command == "smallDisplay.clear") {
    smallDisplayBlinking = -1;
    smallDisplayCursor = -1;
    printSmallDisplay("");
  }
  else if (command == "setBlinkDuration") {
    blinkDuration = argument.toInt();
  }
  else if (command = "ping") {
    pingTime = millis();
    Serial.println("pong");
  }
  else if (command = "reset") {
    largeDisplayBlinking = -1;
    largeDisplayCursor = -1;
    printLargeDisplay("");
    smallDisplayBlinking = -1;
    smallDisplayCursor = -1;
    printSmallDisplay("");
    blinkDuration = 250;
    rxBuffer = "";
    currentMod = 0;
    currentChannel = 0;
    currentVolume = 0;
    blinkTime = millis();
    pingTime = millis();
  }
}

void sendVredPositions() {
  int val = getVredPosition(PIN_CHANNEL);
  if (val != 0 && val != currentChannel) {
    currentChannel = val;
    Serial.println("channel.set " + String(val));
  }

  val = getVredPosition(PIN_MOD);
  if (val != 0 && val != currentMod) {
    currentMod = val;
    Serial.println("mod.set " + String(val));
  }

  val = getVredPosition(PIN_VOLUME);
  if (val != 0 && val != currentVolume) {
    currentVolume = val;
    Serial.println("volume.set " + String(val));
  }  
}

void sendKeyboardInput()
{
  if (kpd.getKeys()) {
    for (int i=0; i < LIST_MAX; i++) {
      if (!kpd.key[i].stateChanged) {
        continue;
      }

      String event;
      switch (kpd.key[i].kstate) {
        case PRESSED: event = "pressed"; break;
        case HOLD: event = "hold"; break;
        case RELEASED: event = "released"; break;
        case IDLE: event = "idle"; break;
        default: continue;
      }

      String msg = "keyboard." +event+ " " + getKey(kpd.key[i].kchar);
      Serial.println(msg);
    }
  }
}

int getVredPosition(int analogPin) {
  int val = analogRead(analogPin);
  if (val >= 1015) {
    return 1;
  }
  else if (val >= 975) {
    return 2;
  }
  else if (val >= 930) {
    return 3;
  }
  else if (val >= 875) {
    return 4;
  }
  else if (val >= 860) {
    return 5;
  }
  else if (val >= 825) {
    return 6;
  }
  else if (val >= 795) {
    return 7;
  }
  else if (val >= 765) {
    return 8;
  }

  return 0;
}

String getKey(char key) {
  switch (key) {
      case F1: return "F1";
      case F2: return "F2";
      case F3: return "F3";
      case F4: return "F4";
      case FMT: return "FMT";
      
      case REP: return "REP";
      case RAD: return "RAD";
      case KVI: return "KVI";
      case SKR: return "SKR";
      case DDA: return "DDA";
      
      case SND: return "SND";
      case EKV: return "EKV";
      case MOT: return "MOT";
      case AVS: return "AVS";
      case ISK: return "ISK";
      
      case OPM: return "OPM";
      case EFF: return "EFF";
      case AND: return "AND";
      case BEL: return "BEL";
      case SLT: return "SLT";
      case ENT: return "ENT";
      case DEL: return "DEL";
      case SFT: return "SHIFT";
      case LFT: return "LEFT";
      case RGT: return "RIGHT";
      case UP: return "UP";
      case DWN: return "DOWN";
      case PUP: return "PAGE-UP";
      case PDN: return "PAGE-DOWN";
      default:   return String(key);
    }
}


String padRight(String value, int width, String pad) {
  while (value.length() < width) {
    value = String(value + pad);
  }
  return value;
}

void createChar(int num, byte data[]) {
  largeDisplay.createChar(num, data);
  smallDisplay.createChar(num, data);
}

void printSmallDisplay(String text) {
  smallDisplayText = trimOrPadRight(text, 8);
  printDisplay(smallDisplay, 8, smallDisplayText);
}

void printLargeDisplay(String text) {
  largeDisplayText = trimOrPadRight(text, 16);
  printDisplay(largeDisplay, 16, largeDisplayText);
}
String trimOrPadRight(String text, int length) {
  if (text.length() > length) {
    return text.substring(0, length);
  }
  else if (text.length() < length) {
    return padRight(text, length, " ");
  }
  else {
    return text;
  }
}

void printDisplay(LiquidCrystal lcd, int size, String text) {
  text = trimOrPadRight(text, size);

  lcd.noCursor();
  lcd.setCursor(0, 0);
  for (int i=0; i < text.length(); i++) {
    if (i == 8) {
      lcd.setCursor(0, 1);
    }
    char character = text.charAt(i);
    if ((int)character == -123) {
      lcd.write(byte(0)); // Å
    }
    else if ((int)character == -124) {
      lcd.write(byte(1)); // Ä
    }
    else if ((int)character == -106) {
      lcd.write(byte(2)); // Ö
    }
    else {
      lcd.print(character);
    }
  }
}
