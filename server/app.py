import os
import json
from flask import Flask, send_from_directory, Response
from flask_cors import CORS
import gensim.downloader as api

model = api.load('glove-wiki-gigaword-50')
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
    return Response(json.dumps({ "distance": str(model.similarity(word1, word2)) }), mimetype='application/json')

@app.get("/<path:path>")
def file(path):
    return send_from_directory("static", path)