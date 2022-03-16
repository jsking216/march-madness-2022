const csv = require("csvtojson/v2");

const CSV_FILE_PATH = "./fivethirtyeight_ncaa_forecasts.csv";

const BRACKET_ORDER_COLUMN = "team_slot";
const SEED_COLUMN = "team_seed";
const MAX_ODDS = 1;

// sorts CSV into the tournament order
const sortData = (row, otherRow) => {
  const first = row[BRACKET_ORDER_COLUMN];
  const second = otherRow[BRACKET_ORDER_COLUMN];
  return parseInt(first) - parseInt(second);
};

const roundColumn = (round) => `rd${round}_win`;

// use 538 probability + randomness + some bonus for underdog
const getWinner = (round, team1, team2) => {
  const team1BaseOdds = team1[roundColumn(round)];
  const team2BaseOdds = team2[roundColumn(round)];

  team1.underdog = team1.underdog || 0;
  team2.underdog = team2.underdog || 0;

  if (team1[SEED_COLUMN] > team2[SEED_COLUMN] + 1) {
    team2.underdog += 1;
  } else if (team2[SEED_COLUMN] > team1[SEED_COLUMN] + 1) {
    team1.underdog += 1;
  }

  // make assumption based on underdog
  let winner = undefined;
  if (team1.underdog >= team2.underdog) {
    winner =
      Math.min(1, team1BaseOdds + team1.underdog * round * 0.05) >=
      Math.random()
        ? team1
        : team2;
  } else {
    winner =
      Math.min(1, team2BaseOdds + team2.underdog * round * 0.05) >=
      Math.random()
        ? team2
        : team1;
  }

  return winner;
};

const doRound = (round, teams) => {
  let winners = [];
  for (let i = 0; i < teams.length; i += 2) {
    const winner = getWinner(round, teams[i], teams[i + 1]);
    winners.push(winner);
  }
  console.log(`Winners for round ${round}`, JSON.stringify(winners));
  return winners;
};

const doTourny = (data, rounds) => {
  let currentRound = undefined;
  for (let i = 0; i < rounds; i++) {
    const currentData = currentRound || data;
    currentRound = doRound(round, currentData);
  }
};

(async () => {
  const jsonArray = await csv().fromFile(CSV_FILE_PATH);

  jsonArray.sort((a, b) => sortData(a, b));
  doTourny(7);
})();
