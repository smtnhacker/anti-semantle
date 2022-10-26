import os
from flask import Flask, send_from_directory
import gensim.downloader as api

model = api.load('glove-wiki-gigaword-50')
app = Flask(__name__)

@app.get("/")
def index():
    return send_from_directory("static", "index.html")

@app.get("/env.js")
def env():
    if os.environ['ENV'] == 'production':
        return send_from_directory("static", "env.production.js")
    return send_from_directory("static", "env.development.js")

@app.route("/api/health_check")
def health_check():
    return "<h1>Anti-Semantle is running!</h1>"

@app.route("/api/get_distance=<word1>,<word2>")
def get_distance(word1, word2):
    return { "distance": str(model.similarity(word1, word2)) }

@app.get("/<path:path>")
def file(path):
    return send_from_directory("static", path)