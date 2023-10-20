'use strict';

/**
  @param season Assumed to be the season format.
  @param matches key-match object
*/
module.exports = function(season, matches) {
  // TODO: Add season model validation/assertion.

  const teams = Object.keys(season.teams)
    .map(tk => {
      const team = season.teams[tk];
      return {
        key: team.key,
        name: team.name,
        wins: [],
        losses: [],
        points: 0,
        division: team.division
      };
    })
    .reduce((map, team) => {
      map[team.key] = team;
      return map;
    }, {});

  season.weeks
    .filter(week => !week.isSpecial && !week.isPlayoffs)
    .reduce((list, week) => {
      week.matches.forEach(m => list.push(m.match_key));
      return list;
    }, [])
    // We have an array of all the matches in the schedule here.
    .map(key => matches.get(key))
    .filter(m => !!m) // Only matches that exist (because scheduled matches might not)
    .filter(m => m.isDone())
    .forEach(match => {
      const { home, away } = match;
      const hk = home.key;
      const ak = away.key;
      const hr = teams[hk];
      const ar = teams[ak];
      const p = match.getPoints();
      if(p.home > p.away) {
        hr.wins.push(ak);
        ar.losses.push(hk);
      }
      if(p.away > p.home) {
        ar.wins.push(hk);
        hr.losses.push(ak);
      }
      hr.points += p.home;
      ar.points += p.away;
    });

  const divs = Object.keys(teams)
    .map(tk => teams[tk])
    .reduce((divs, team) => {
      divs[team.division].push(team);
      return divs;
    }, { 1: [], 2: []});

  [divs[1], divs[2]].forEach(div => {
    div.sort((a, b) => {
      if(a.wins.length > b.wins.length) { return -1; }
      if(b.wins.length > a.wins.length) { return  1; }
      //else need points tie-breaker.
      if(a.points > b.points) { return -1; }
      if(b.points > a.points) { return  1; }
      //else need head's up tie-breaker
      if(a.wins.indexOf(b.key) != -1) { return -1; }
      if(b.wins.indexOf(a.key) != -1) { return  1; }
      //else Teams did not play each other.
      //TODO: Record vs common opponents
      //TODO: else Points vs common
      return [a.name, b.name].sort()[0] === a.name ? -1 : 1;
    });
    div.forEach((team, i) => {
      team.n = i + 1;
    });
  });

  return divs;
}
