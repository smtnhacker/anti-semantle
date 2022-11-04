const axios = require('axios')

class GameControl {

    constructor(api) {
        this.api = api;
    }

    getRelevantWords(usedWords, numPlayers) {
        const numRelevant = Math.min(usedWords.length, Math.ceil(numPlayers * 1.5));
        return usedWords.slice(-numRelevant).map(({ word }) => word);
    }

    async getDistances(word, wordList) {
        const l = wordList.length;
        try {
            if (l === 0) {
                return [];
            }
            const response = await axios.post(`${this.api}/get_distances=${word}`, {
                words: wordList
            });
            return response.data.distances;
        } catch(err) {
            console.log(err);
            return Array(l).fill(0);
        }
    }

    async isValid(word) {
        try {
            const response = await axios.get(`${this.api}/exists=${word}`);
            return response.data.result;
        } catch(err) {
            console.log(err);
            return false;
        }
    }

    getScore(distances, opt = {}) {
        return Math.floor(150 * Array.from(distances).reduce((total, cur) => Math.min(total, cur), 2)) * 10;
    }

    async attemptSubmit(wordRaw, constraints) {
        const word = wordRaw.trim().toLowerCase();
        
        // ensure that the word is unused
        const { usedWords } = constraints;
        if (usedWords.filter(({ word: w }) => w.toLowerCase() === word ).length) {
            throw new Error("Word already used");
        }

        // ensure that the word is valid
        const isValid = await this.isValid(word);
        if (!isValid) {
            throw new Error("Invalid word");
        }

        /* === CONSTRAINT CHECKING === */
        
        // if the word passes the constraints, get the distances
        const { numPlayers } = constraints;
        const wordList = this.getRelevantWords(usedWords, numPlayers);
        const distances = await this.getDistances(word, wordList);

        const score = this.getScore(distances, {});

        return score;

    }
}

module.exports = {
    GameControl: GameControl
}