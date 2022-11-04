import os
import random
import json
from flask import Flask, request, send_from_directory, Response
from flask_cors import CORS
import gensim.downloader as api

model = api.load('glove-wiki-gigaword-50')
vocab = model.index_to_key[50:7000]
print("loaded model", model.similarity("spain", "france"))
app = Flask(__name__)
CORS(app)

@app.get("/")
def index():
    return "<p>Anti-Semantle API server is up!</p>"

@app.route("/api/health_check")
def health_check():
    return "<h1>Anti-Semantle is running!</h1>"

@app.route("/api/get_distance=<word1>,<word2>")
def get_distance(word1, word2):
    return Response(json.dumps({ "distance": model.distance(word1, word2) }), mimetype='application/json')

@app.post("/api/get_distances=<word>")
def get_distances(word):
    wordList = request.json.get('words')
    return Response(json.dumps({ "distances": model.distances(word, wordList).tolist() }), mimetype='application/json')

@app.route("/api/exists=<word>")
def check_exists(word):
    return Response(json.dumps({ "result": model.has_index_for(word) }), mimetype='application/json')

@app.route("/api/get_rank=<word1>,<word2>")
def get_rank(word1, word2):
    return Response(json.dumps({ "rank": model.rank(word1, word2) }), mimetype='application/json')

@app.route("/api/get_random_word")
def get_random_word():
    return Response(json.dumps({ "result": random.choice(vocab) }))

@app.get("/<path:path>")
def file(path):
    return send_from_directory("static", path)