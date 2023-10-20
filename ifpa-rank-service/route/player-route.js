'use strict';

const Router = require('express').Router;
const debug = require('debug')('ifpa-rank-service:player-route');
const request = require('superagent');
const createError = require('http-errors');

const router = module.exports = new Router();

const stem = 'https://api.ifpapinball.com/v1/player';
const apiKey = process.env.IFPA_API_KEY;

router.get('/player/search', function(req, res, next) {
  debug('GET /player/search', req.query);

  if(!req.query || !req.query.q) return next(createError(400, 'q required'));

  const url = `${stem}/search?api_key=${apiKey}&q=${encodeURIComponent(req.query.q)}`;
  debug('URL:', url);
  request.get(url)
  // .set({ Accept: 'application/json' }) //This did not help. They appear to be sending text/html as the content type.
  .then( resp => {
    // debug('resp:', resp);
    res.json(JSON.parse(resp.text));
  })
  .catch(next);

  // res.send('under construction');
});

router.get('/player/:id/rank', function(req, res, next) {
  debug('GET /player/:id/rank', req.params.id);

  // TODO: Add a caching layer. Can it can be middleware applied to this route?

  const url = `${stem}/${req.params.id}?api_key=${apiKey}&q=${encodeURIComponent(req.query.q)}`;
  debug('URL:', url);
  request.get(url)
  // .set({ Accept: 'application/json' }) //This did not help. They appear to be sending text/html as the content type.
  .then( resp => {
    const data = JSON.parse(resp.text);
    debug('resp:', data);
    res.json({ rank: Number(data.player_stats.current_wppr_rank) });
  })
  .catch(next);
});
