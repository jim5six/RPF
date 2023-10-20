# ifpa-rank-service
Proxy to IFPA API to get rank by player name

This service is intended to be run as a micro service, and is mostly a proxy to
the IFPA API. (TODO add link for IFPA)

You need to setup a .env file in the project root, which should contain:
```
PORT=<whatever port you want to use>
IFPA_API_KEY=<your key from signing up to use the IFPA api>
```

To install, make sure to run:
```
npm install
```

To start the service:
```
npm run start
```

# Routes
## GET /player/search?q=<url encoded name to lookup>

## GET /player/:id/rank
Allows us to focus on the primary field of concern.

# TODOs
* Perhaps add a caching layer on fetches to the API with an expiration of at least a day.
* Separate out an IFPA API Client that appends the api_key query param and makes the request.
* Anything else? This is supposed to be a very simple service that we plug into other systems.
