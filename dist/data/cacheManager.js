"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const memoryCache = require("memory-cache");
const db_1 = require("../data/db");
const mergeData_1 = require("../crawler/mergeData");
const moment = require("moment");
const atmovieInTheaterCrawler_1 = require("../crawler/atmovieInTheaterCrawler");
const util_1 = require("../helper/util");
const atmoviesTask_1 = require("../task/atmoviesTask");
class cacheManager {
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            const yahooMoviesPromise = db_1.db.getCollection("yahooMovies", { yahooId: -1 });
            const pttArticlesPromise = db_1.db.getCollection("pttArticles");
            console.time('get yahooMovies and pttArticles');
            const [yahooMovies, pttArticles] = yield Promise.all([yahooMoviesPromise, pttArticlesPromise]);
            console.timeEnd('get yahooMovies and pttArticles');
            cacheManager.setAllMoviesNamesCache(yahooMovies);
            cacheManager.setAllMoviesCache(yahooMovies, pttArticles);
            cacheManager.setTheatersCache();
            yield cacheManager.setInTheaterMoviesCache();
        });
    }
    static setAllMoviesNamesCache(yahooMovies) {
        let allMoviesName = [];
        console.time('setAllMoviesNamesCache');
        yahooMovies.forEach(({ chineseTitle, englishTitle, yahooId }) => {
            if (chineseTitle) {
                allMoviesName.push({ value: yahooId, text: chineseTitle });
            }
            if (englishTitle && englishTitle !== chineseTitle) {
                allMoviesName.push({ value: yahooId, text: englishTitle });
            }
        });
        cacheManager.set(cacheManager.All_MOVIES_NAMES, allMoviesName);
        console.timeEnd('setAllMoviesNamesCache');
    }
    static setAllMoviesCache(yahooMovies, pttArticles) {
        console.time('mergeData');
        let mergedDatas = mergeData_1.mergeData(yahooMovies, pttArticles);
        console.timeEnd('mergeData');
        cacheManager.set(cacheManager.All_MOVIES, mergedDatas);
    }
    static setTheatersCache() {
        return __awaiter(this, void 0, void 0, function* () {
            console.time('setTheatersCache');
            const theaterListWithLocation = yield db_1.db.getCollection("theaters", { "regionIndex": 1 });
            console.timeEnd('setTheatersCache');
            cacheManager.set(cacheManager.THEATERS, theaterListWithLocation);
        });
    }
    static setInTheaterMoviesCache() {
        return __awaiter(this, void 0, void 0, function* () {
            const movieNames = yield atmovieInTheaterCrawler_1.getInTheaterMovieNames();
            if (movieNames.length > 0) {
                yield cacheManager.setRecentMoviesCache(movieNames);
            }
            yield cacheManager.setMoviesSchedulesCache();
        });
    }
    static setMoviesSchedulesCache() {
        return __awaiter(this, void 0, void 0, function* () {
            console.time('setMoviesSchedulesCache');
            try {
                const scheduleUrls = yield db_1.db.dbConnection.collection("theaters").find({}, { scheduleUrl: 1, _id: 0 }).toArray();
                const allSchedules = yield atmoviesTask_1.getMoviesSchedules(scheduleUrls.map(s => s.scheduleUrl));
                const recentMovieChineseTitles = cacheManager.get(cacheManager.RECENT_MOVIES).map(movie => movie.chineseTitle);
                const filterdSchedules = allSchedules.filter(schedule => recentMovieChineseTitles.indexOf(schedule.movieName) !== -1);
                cacheManager.set(cacheManager.MOVIES_SCHEDULES, filterdSchedules);
            }
            catch (ex) {
                console.error(ex);
            }
            console.timeEnd('setMoviesSchedulesCache');
        });
    }
    static setRecentMoviesCache(movieNames) {
        return __awaiter(this, void 0, void 0, function* () {
            console.time('setRecentMoviesCache');
            let today = moment();
            let sixtyDaysBefore = moment().subtract(60, 'days');
            let recentMovies = cacheManager.get(cacheManager.All_MOVIES)
                .filter(({ chineseTitle, releaseDate }) => movieNames.indexOf(chineseTitle) !== -1 && today.diff(moment(releaseDate), 'days') <= 90);
            // .filter(({ yahooId, releaseDate }: Movie) => moment(releaseDate).isBetween(sixtyDaysBefore, today, 'day', '[]'))
            cacheManager.set(cacheManager.RECENT_MOVIES, recentMovies);
            console.timeEnd('setRecentMoviesCache');
        });
    }
    static get(key) {
        let data = memoryCache.get(key);
        return data;
    }
    static set(key, value) {
        memoryCache.put(key, value);
        console.log(`${key} size:${util_1.roughSizeOfObject(value)}`);
    }
}
cacheManager.All_MOVIES = 'allMovies';
cacheManager.All_MOVIES_NAMES = 'allMoviesNames';
cacheManager.RECENT_MOVIES = 'recentMovies';
cacheManager.MOVIES_SCHEDULES = 'MoviesSchedules';
cacheManager.THEATERS = 'theaters';
exports.default = cacheManager;
//# sourceMappingURL=cacheManager.js.map