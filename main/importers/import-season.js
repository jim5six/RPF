const fs = require('fs');
var venues = require('../model/venues');
var csv = require('../lib/csv');

var num = process.argv[2] || '13';

var stem = 'data/season-' +num+ '/';

//FIRST, Load up the team data
var rows = csv.load(stem + 'teams.csv');

var teams = {};
for(let i in rows) {
  var row = rows[i];
  var tk = row[0];
  teams[tk] = {
    key: tk,
    venue: row[1],
    name: row[2],
    roster: [],
    schedule: [],
    // Not sure what to default, but want to avoid uncaught error.
    division: parseInt(row[3] || 0)
  };
}

var pteams = {};
//ADDING PLAYOFF TEAMS to the map.
for(let i = 1; i < 13; i++) {
  let tk = 'S' +i;
  pteams[tk] = { key: tk, name: 'Seed #' +i };
}

for(let i = 1; i < 9; i++) {
  let tk = 'QF' +i;
  pteams[tk] = { key: tk, name: 'SF #' +i };
}

pteams['H45'] = { key: 'H45', name: 'SF 4 vs 5' };
pteams['H18'] = { key: 'H18', name: 'SF 1 vs 8' };
pteams['H36'] = { key: 'H36', name: 'SF 3 vs 6' };
pteams['H27'] = { key: 'H27', name: 'SF 2 vs 7' };

pteams['FN1'] = { key: 'FN1', name: 'Finalist #1' };
pteams['FN2'] = { key: 'FN2', name: 'Finalist #2' };
pteams['BR3'] = { key: 'BR3', name: 'Bronze #3' };
pteams['BR4'] = { key: 'BR4', name: 'Bronze #4' };

var labels = {};
var codes = {};
for(let i = 1; i < 20; i++) {
  labels[i] = 'WEEK ' + i;
  codes[i] = 'WK' + i;
}
//NOTE: These labels are for season 9.
//      Earlier seasons did not have a WC round.
//      Also, there are now 2 divisions.
labels[91] = 'Quarter Finals';
labels[92] = 'Semi Finals';
labels[93] = 'Finals & Bronze';

codes[91] = 'QF';
codes[92] = 'SF';
codes[93] = 'FNL';

codes['S'] = 'SCRM';

//SECOND, Load all the players and assign them to their teams.
rows = csv.load(stem + 'rosters.csv');

//Figure out which teams players go on, and if they are captains.
for(let i in rows) {
  let row = rows[i];
  if(row.length > 1) {
    let name = row[0];
    let tk = row[1];
    if(tk && tk.length > 0 && teams[tk]) {

      var team = teams[tk];
      if(row[2] == 'C') team.captain = name;
      if(row[2] == 'A') team.co_captain = name;
      team.roster.push({
        name: name //,
      });
    }
  }
}

//THIRD, Load all the matches to create schedules.
rows = csv.load(stem + 'matches.csv');
var weeks = {};

for(let i in rows) {
  let row = rows[i];
  let match = {
    key: 'mnp-' +num+ '-' +row[0]+ '-' +row[2]+ '-' +row[3],
    week: row[0],
    date: row[1],
    away: row[2],
    home: row[3],
    venue: row[4]
  };

  if(match.week == 'S' || match.week > 0) {
    var home = teams[match.home];
    var away = teams[match.away];

    if(match.week > 90) {
      if(!home) {
        home = pteams[match.home];
        home.venue = 'TBD';
        home.schedule = [];
        home.isPlaceholder = true;
      }
      if(!away) {
        away = pteams[match.away];
        away.venue = 'TBD';
        away.schedule = [];
        away.isPlaceholder = true;
      }
    }

    home.schedule.push({
      match_key: match.key,
      week: match.week,
      date: match.date,
      side: 'vs',
      opp: {
        key: away.key,
        name: away.name
      }
    });
    away.schedule.push({
      match_key: match.key,
      week: match.week,
      date: match.date,
      side: '@',
      opp: {
        key: home.key,
        name: home.name
      }
    });

    var week = weeks[match.date];
    if(!week) {
      week = {
        n: match.week,
        label: labels[match.week],
        code: codes[match.week],
        // n: match.week < 91 ? match.week : pweeks[match.week],
        isPlayoffs: match.week > 90,
        date: match.date,
        matches: []
      };
      weeks[match.date] = week;
    }

    var venue = venues.get(match.venue);

    if(!venue) {
      console.warn('Venue not found:', match.venue, match.key);

      venue = venues.get(home.venue) || {
        key: 'TBD',
        name: 'To Be Determined',
      };

      // If the venue is still undefined, there will be an error below,
      // which is probably ok, because the matches.csv is not correct.
      console.warn('Using:', venue.name);
    }

    //HACK: Season 6 playoff hack to move a doubled up match to
    //an alternate location.
    if(num == 6 && match.week == 91 && home.key == 'JMF') {
      venue = venues.get('OZS');
    }

    //HACK: Season 6 finals are at Shorty's.
    if(num == 6 && match.week == 94) {
      venue = venues.get('SHR');
    }

    week.matches.push({
      match_key: match.key,
      away_key: away.key,
      away_name: away.name,
      away_linked: !away.isPlaceholder,
      home_key: home.key,
      home_name: home.name,
      home_linked: !home.isPlaceholder,
      venue: { key: venue.key, name: venue.name }
    });
  }
  else {
    let week = weeks[match.date];
    //Week is a special event.
    if(!week) {
      let venue = venues.get(teams[match.away].venue);
      week = {
        date: match.date,
        isSpecial: true,
        html: match.home, //Yeah, this and the next line look weird.
        venue: { key: home.venue, name: venue.name }
      };
      weeks[match.date] = week;
    }
  }
}

var list = [];

//FOURTH, Sort the weeks - Not needed.
//      Just make sure to have a sorted input file. ;)
var keys = Object.keys(weeks);
// keys.sort();
for(let k in keys) {
  let week = weeks[keys[k]];

  var date = week.date;

  var year  = date.substring(0,4);
  var month = date.substring(4,6);
  var day   = date.substring(6,8);

  week.date = month+ '/' +day+ '/' +year;

  list.push(week);
}

var season = {
  key: 'season-' + num,
  teams: teams,
  weeks: list
};

fs.writeFileSync(`${stem}/season.json`, JSON.stringify(season,null,2));
