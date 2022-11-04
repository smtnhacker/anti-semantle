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

    async getRank(distWord, srcWord) {
        try {
            const response = await axios.get(`${this.api}/get_rank=${srcWord},${distWord}`);
            return response.data.rank;
        } catch (err) {
            console.log(err);
            return 0;
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

    async generateConstraints(opts = {}) {
        const res = {};

        const getRandomLetter = () => {
            const letters = "abcdefghijklmnoprstuvwy";
            const index = Math.floor(Math.random() * letters.length);
            return letters[index];
        }

        // needed letters

        // I think I'll remove these for now
        // since it constraints to players to
        // think around the letters, not beyond
        // them, which is the essence of the game

        // if (opts.useLetters) {
        //     const useLetters = [];
        //     const numLetters = Math.ceil(Math.random() * 3);
        //     Array(numLetters).fill(0).forEach(() => {
        //         while (true) {
        //             const randLetter = getRandomLetter();
        //             if (!useLetters.includes(randLetter)) {
        //                 useLetters.push(randLetter);
        //                 break;
        //             }
        //         }
        //     });
        //     res.useLetters = useLetters;
        // }

        // illegal letters
        if (opts.avoidLetters) {
            const avoidLetters = [];
            const numLetters = Math.ceil(Math.random() * 7);
            Array(numLetters).fill(0).forEach(() => {
                while (true) {
                    const randLetter = getRandomLetter();
                    if (!avoidLetters.includes(randLetter) && !res.useLetters?.includes(randLetter)) {
                        avoidLetters.push(randLetter);
                        break;
                    }
                }
            });
            res.avoidLetters = avoidLetters;
        }

        // dangerous words
        if (opts.avoidWords) {
            const avoidWords = [];
            const numWords = Math.ceil(Math.random() * 5);
            for(let i=0; i<numWords; i++) {
                const randWordRes = await axios.get(`${this.api}/get_random_word`);
                const randWord = randWordRes.data.result;
                avoidWords.push(randWord);
            }
            res.avoidWords = avoidWords;
        }

        return res;

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

        // check that the word contains the needed letters
        const useLetters = constraints.useLetters || [];
        for(const letter of useLetters) {
            if (!word.includes(letter)) {
                throw new Error(`Must include letter ${letter}`);
            }
        }

        // check that the word avoids the illegal letters
        const avoidLetters = constraints.avoidLetters || [];
        for(const letter of avoidLetters) {
            if (word.includes(letter)) {
                throw new Error(`Must not include letter ${letter}`);
            }
        }

        // check that the word avoids the dangerous words
        const avoidWords = constraints.avoidWords || [];
        for(const badWord of avoidWords) {
            console.log(badWord);
            const rank = await this.getRank(badWord, word);
            if (rank <= 1000) {
                throw new Error(`Word did not avoid dangerous word "${badWord}" enough`);
            }
        }
        
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