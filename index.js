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
  // 538 includes playin as rd1 so we need an offset of 2 to start at 0!
  const team1BaseOdds = parseFloat(team1[roundColumn(round + 2)]);
  const team2BaseOdds = parseFloat(team2[roundColumn(round + 2)]);

  team1.cumulativeOdds =
    parseFloat(team1.cumulativeOdds || 0) + parseFloat(team1BaseOdds);
  team2.cumulativeOdds =
    parseFloat(team2.cumulativeOdds || 0) + parseFloat(team2BaseOdds);
  team1.underdog = team1.underdog || 0;
  team2.underdog = team2.underdog || 0;

  // screwed this up the first time since lower is better
  if (parseInt(team1[SEED_COLUMN]) < parseInt(team2[SEED_COLUMN]) - 1) {
    team2.underdog += 1;
  } else if (parseInt(team2[SEED_COLUMN]) < parseInt(team1[SEED_COLUMN]) - 1) {
    team1.underdog += 1;
  }

  // make assumption based on underdog
  let winner = undefined;
  const oddsRatio = team1.cumulativeOdds / team2.cumulativeOdds;

  // this is just a mess
  if (team1.underdog >= team2.underdog || oddsRatio < 0.5) {
    const coinflip = Math.min(
      MAX_ODDS,
      Math.max(0.1, team1.cumulativeOdds - team2.cumulativeOdds) +
        team1.underdog * round * 0.03
    );
    console.log(
      `coinflip for ${team1.team_name} with underdog bonus: ${coinflip}`
    );
    winner = coinflip >= Math.random() ? team1 : team2;
  } else {
    const coinflip = Math.min(
      MAX_ODDS,
      Math.max(0.1, team2.cumulativeOdds - team1.cumulativeOdds) +
        team2.underdog * round * 0.03
    );
    console.log(
      `coinflip for ${team2.team_name} with underdog bonus: ${coinflip}`
    );
    winner = coinflip >= Math.random() ? team2 : team1;
  }

  return winner;
};

const doRound = (round, teams) => {
  let winners = [];
  for (let i = 0; i < teams.length; i += 2) {
    const winner = getWinner(round, teams[i], teams[i + 1]);
    winners.push(winner);
  }

  const printRow = `Winners for round ${round}: ${winners
    .map((x) => x.team_name)
    .join(", ")}`;
  console.log(printRow);
  return winners;
};

const doTourny = (data, rounds) => {
  let currentRound = undefined;
  for (let i = 0; i < rounds; i++) {
    const currentData = currentRound || data;
    currentRound = doRound(i, currentData);
  }
};

(async () => {
  const jsonArray = await csv().fromFile(CSV_FILE_PATH);

  jsonArray.sort((a, b) => sortData(a, b));
  doTourny(jsonArray, 6);
})();
