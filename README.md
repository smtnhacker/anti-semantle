# Anti-Semantle

_Anti-Semantics in production_

A docker + deployment workflow practice. A game that uses pre-trained ML models to determine how semantically-separated words are.

## Demo

![Demo](https://github.com/smtnhacker/anti-semantle/blob/main/docs/sample_usage.gif)

## Introduction

This is a mental challenge I've been doing since high-school. I decided to implement and turn it into a web-app when I discovered Word2Vec models, specifically Gensim, a Python library. 

### How I worked on the project

I decided to split the project into 3 parts:

- A Flask server that serves as the API endpoint to access the ML model. When deployed to production, the app is served using Gunicorn, and ideally is behind an NGINX reverse-proxy server.

- An ExpressJS web server that primarily serves as the backend for the app.

- A static client that users receives. Currently, it is written in vanilla HTML, CSS, and JavaScript since I wanted to practice the fundamentals.

In order to make the game as smooth as possible, the client and the web server communicates through Socket.io. Furthermore, I decided to dockerize the app since the Flask server needs a replicable and scalable environment. Since I decided to dockerize the Flask server, I decided to dockerize the entire thing. By doing this, I can set-up a functioning development environment just by running `docker compose`. 

### Possible Improvements

In order to improve performance and maintain persistency, the web server should also be connected to a Redis server. In order to facilitate scaling, the NGINX server should also be configured to handle load balancing, and other related functions. Also, in the future, the client should be remade using a better framework. Adding features and handling routes in game is kind-of difficult when only using vanilla HTML, CSS, and JavaScript. But for now, it suffices.

## Installation and Setup

**Docker**

If you have docker, you can start a fully-functioning ecosystem by simply running the following commands:

```bash
docker compose build
docker compose up
```

If you don't have docker or you want to isolate each component, you can install and run each components individually.

**Client**

Ensure you have at least Python 3.8 in your system. Older versions might work, but have not been tested. 

To build the files, just run the following command:

```python
python build.py
```

Alternatively, you can just rename `endpoints.development.js` to `endpoints.js`. The results will be the same.

To run the server, you can setup any simple backend server. For development, I use [Serve](https://www.npmjs.com/package/serve). You can install it globally by running:

```bash
npm install --location=global serve
```

To serve the files using `serve`, go to the `client` directory and run the following:

```bash
serve public
```

**Note: Ensure that the client server is running on port 3000.** You can change the port, of course. Just ensure to setup the right environment variables for the webserver. You may refer to the docker compose file to see what these environment variables are.

**API Server**

In order to run the API Server properly, you need at least Python 3.10. It may be possible to run it in older version, but changes to the dependencies might be needed. Do your own research.

To install the prerequisites, run the following command:

```bash
pip install -r requirements.txt
```

To start the server, just run the following:

```bash
flask run
```

It is expected to run in port 5000. If this is not the case, modify client's `endpoints.js` and web server's environment accordingly.

First-time launch of the API server might take a few minutes as it downloads the word2vec model first. If you don't want this behaviour, you may modify the environment to use the existing files in `server\data\gensim`. You may consult the [documentation](https://radimrehurek.com/gensim/downloader.html) for instructions on how to do this.

**Web Server**

You need to have at least Node 16 installed. To build the files, just run:

```bash
node install
```

To start the server, just run:

```bash
node index.js
```

It is expected to run in port 8080. If this is not the case, modify client's `endpoints.js`.

_Note: I did not specify how to run NGINX since I use a Windows machine. You may consult official documentation if you want to use NGINX, but it is NOT necessary to set-up a development environment._