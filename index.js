const JSON_ADDRESS = "127.0.0.1";
const JSON_PORT = 7190;
const POLLING_RATE = 333;

const JSON_ENDPOINT = `http://${JSON_ADDRESS}:${JSON_PORT}/`;

var json;

const CurrentTime = () => {
	return Date.now();
}

var mapData = { current: "None", previous: "None" };
var endGame = false;
var timer = { start: null, end: null }
var paused = { start: null };
var ballast = 0;

const timerStarted = () => {
	return Boolean(timer.start);
}

const timerEnded = () => {
	return Boolean(timer.end);
}

var time = 0;

//|| data.GameState == 256 || data.GameState == 512
const IsLoadingOrPaused = data => {
	console.log("GameState: ", data.GameState);
	return data.GameState == 4 || data.GameState == 8 || data.GameState == 262400 || data.GameState == 262144;
}

const IsGameplay = data => {
	//console.log("Game Initiallized: ", Boolean(data.GameInit));
	return data.GameInit != 0 && data.GameplayState != 0;
}

window.onload = function () {
	getData();
	setInterval(getData, POLLING_RATE);
};

function getData() {
	fetch(JSON_ENDPOINT)
		.then(function (response) {
			return response.json();
		})
		.then(function (data) {
			appendData(data);
		})
		.catch(function (err) {
			console.log("Error: " + err);
		});
}

const pad = i => i.toString().padStart(2, '0');

const timeDiff = (start, end) => {
  let timestamp = end - start;
  const milliseconds = Math.floor(timestamp % 1000);
  timestamp = Math.floor(timestamp / 1000);
  const hours = Math.floor(timestamp / 60 / 60);
  const minutes = Math.floor(timestamp / 60) - hours * 60;
  const seconds = Math.floor(timestamp % 60);

  return {
    hours,
    minutes,
    seconds,
    formatted: `${pad(hours)}:${pad(minutes)}'${pad(seconds)}"${milliseconds.toString().padStart(3, '0')}`,
    formattedMin: `${pad(minutes)}:${pad(seconds)}`,
  };
};

const timeDiffIGT = (start, end) => {
  let timestamp = end - (start + ballast);
  if (paused.start) {
    timestamp -= CurrentTime() - paused.start;
  }
  const milliseconds = Math.floor(timestamp % 1000);
  timestamp = Math.floor(timestamp / 1000);
  const hours = Math.floor(timestamp / 60 / 60);
  const minutes = Math.floor(timestamp / 60) - hours * 60;
  const seconds = Math.floor(timestamp % 60);

  return {
    hours,
    minutes,
    seconds,
    formatted: `${pad(hours)}:${pad(minutes)}'${pad(seconds)}"${milliseconds.toString().padStart(3, '0')}`,
    formattedMin: `${pad(minutes)}"${pad(seconds)}`,
  };
};

function IsRunStarted() 
{
	//MAIN
	if (mapData.previous == "None" && mapData.current.includes("Ship3FInfirmaryPast"))
	{
		timer.start = CurrentTime();
		timer.end = null;
		ballast = 0;
		mapData.previous = mapData.current;
		console.log("New Run Started Resetting Timer...");
	}
	//NGH
	else if (mapData.previous == "None" && mapData.current.includes("MainHouse1FWash") && data.PlayerInventory[0].ItemName == "Knife")
	{
		timer.start = CurrentTime();
		timer.end = null;
		ballast = 0;
		mapData.previous = mapData.current;
		console.log("No Guest House Run Started Resetting Timer...");
	}
	//NAH
	else if (mapData.previous == "None" && mapData.current.includes("c04_CavePassage01") && data.PlayerInventory[0].ItemName == "CKnife" || mapData.previous == "None" && mapData.current.includes("Ship3FInfirmaryPast"))
	{
		timer.start = CurrentTime();
		timer.end = null;
		ballast = 0;
		mapData.previous = mapData.current;
		console.log("No Guest House Run Started Resetting Timer...");
	}
	//EOZ
	else if (mapData.previous == "None" && mapData.current.includes("sm0878_Carpet08A") || mapData.previous == "None" && mapData.current.includes("Ship3FInfirmaryPast"))
	{
		timer.start = CurrentTime();
		timer.end = null;
		ballast = 0;
		mapData.previous = mapData.current;
		console.log("No Guest House Run Started Resetting Timer...");
	}
}

function IsRunEnded(data) 
{
	if (timerStarted() && !endGame) 
	{
		if (data.PlayerInventory[0] != null)
		{
			endGame = (data.PlayerInventory[0].ItemName == "Handgun_Albert" || data.PlayerInventory[0].ItemName == "NumaItem031" || mapData.current.includes("c08_BossRoom01") && data.PlayerInventory[0].ItemName != null);
		}
	}
	if (!endGame) { return; }
	if (mapData.previous.includes("c01Outside01") && endGame && data.PlayerInventory[0].ItemName == null && !timerEnded())
	{
		timer.end = CurrentTime();
		console.log("Main Campaign Run Finished...", time.formatted);
	}
	if (mapData.previous.includes("c08_BossRoom01") && endGame && data.PlayerInventory[0].ItemName == null && !timerEnded())
	{
		timer.end = CurrentTime();
		console.log("NAH Run Finished...", time.formatted);
	}
	if (mapData.previous.includes("c03_MainHouseHall") && endGame && data.PlayerInventory[0].ItemName == null && !timerEnded())
	{
		timer.end = CurrentTime();
		console.log("EOZ Run Finished...", time.formatted);
	}
}

function UpdateTimer(data) {
	var rta = document.getElementById("rta");
	var igt = document.getElementById("igt");
	IsRunStarted();
	if (timerStarted() && !timerEnded())
	{
		rta.innerHTML = `<font size="4" color="#0AA">${timeDiff(timer.start, CurrentTime()).formatted}</font>`;
		igt.innerHTML = `<font size="4" color="#0AA">${timeDiffIGT(timer.start, CurrentTime()).formatted}</font>`;
	}
	else if (timerEnded())
	{
		rta.innerHTML = `<font size="4" color="#00AA00">${timeDiff(timer.start, timer.end).formatted}</font>`;
		igt.innerHTML = `<font size="4" color="#00AA00">${timeDiffIGT(timer.start, timer.end).formatted}</font>`;
	}
	else
	{
		rta.innerHTML = `<font size="4" color="#EEE">00:00'00"000</font>`;
		igt.innerHTML = `<font size="4" color="#EEE">00:00'00"000</font>`;
	}
	IsRunEnded(data);
}

function PauseTimer(data) {
	var pauseCheck = IsLoadingOrPaused(data);
	
	//GAME PAUSED OR LOADING
	if (timerStarted() && pauseCheck)
	{
		if (paused.start == null) 
		{ 
			paused.start = CurrentTime(); 
		}
	}
	//GAME NOT PAUSED OR LOADING
	else if (timerStarted() && !pauseCheck)
	{
		if (paused.start != null) 
		{
			ballast = (CurrentTime() - paused.start) + ballast;
			paused.start = null;
		}
	}
}

function ResetRunData() {
	timer.start = null;
	timer.end = null;
	ballast = 0;
	paused.start = null;
	console.log("Menu Detected... Resetting Run Data");
}

function appendData(data) {
	if (timerStarted() && !IsGameplay(data))
	{
		ResetRunData();
	}
	
	if (data.MapName != mapData.current)
	{
		mapData.previous = mapData.current;
		mapData.current = data.MapName;
		console.log(`Map Changed... Prev: ${mapData.previous} Curr: ${mapData.current}`);
	}
	UpdateTimer(data);
	PauseTimer(data);
}