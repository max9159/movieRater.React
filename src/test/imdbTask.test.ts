import * as moment from 'moment';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { db } from "../data/db";
import { updateImdbInfo } from '../task/imdbTask';
import * as imdbCrawler from '../crawler/imdbCrawler';
import Movie from "../models/movie";

const should = chai.should();
chai.use(sinonChai);

describe('imdbTask', () => {
  let sandbox: sinon.SinonSandbox, stubUpdateDocument: sinon.SinonStub, stubGetCollection: sinon.SinonStub;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    stubUpdateDocument = sandbox.stub(db, 'updateDocument');
    stubGetCollection = sandbox.stub(db, 'getCollection');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('updateImdbInfo', () => {
    const yahooMovie: Movie = {
      yahooId: 6777,
      englishTitle: 'Dangal',
      releaseDate: moment().format(),
      imdbLastCrawlTime: moment().subtract(2, 'days').format()
    };


    it("One yahooMovie should called GetIMDBMovieInfo Once", async function () {
      stubGetCollection.returns([yahooMovie]);
      const stubGetIMDBMovieInfo = sandbox.stub(imdbCrawler, 'getIMDBMovieInfo').returns({ imdbID: "", imdbRating: "" });
      await updateImdbInfo();
      sandbox.assert.calledOnce(stubGetIMDBMovieInfo);
    });

    it("should update db without info when it's empty", async function () {
      stubGetCollection.returns([yahooMovie]);
      const stubGetIMDBMovieInfo = sandbox.stub(imdbCrawler, 'getIMDBMovieInfo').returns({ imdbID: "", imdbRating: "" });
      await updateImdbInfo();
      sandbox.assert.calledWith(stubUpdateDocument,
        { yahooId: yahooMovie.yahooId },
        { imdbLastCrawlTime: moment().format('YYYY-MM-DDTHH') });
    });
  });
});