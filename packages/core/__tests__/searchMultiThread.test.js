"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const searchMultiThread_1 = require("/searchMultiThread");
const searchInFs_1 = require("/searchInFs");
const astUtils_1 = require("/astUtils");
const path_1 = __importDefault(require("path"));
const getFilesList_1 = require("/getFilesList");
jest.mock('worker_threads', () => {
    const actual = jest.requireActual('worker_threads');
    function Worker(_, params) {
        const mockedPath = path_1.default.resolve(process.cwd(), 'dist-ts/searchWorker.js');
        return new actual.Worker(mockedPath, params);
    }
    return Object.assign(Object.assign({}, actual), { Worker });
});
it('should search using multiple threads and give the same matches count as single thread search', () => __awaiter(void 0, void 0, void 0, function* () {
    const filesList = yield (0, getFilesList_1.getFilesList)(path_1.default.resolve(__dirname, 'search', '__fixtures__'));
    const query = `
    () => $$$
  `;
    const { matches: resultsSingle } = (0, searchInFs_1.searchInFileSystem)({
        mode: 'exact',
        filePaths: filesList,
        queryCodes: [query]
    });
    const { matches: resultsMulti } = yield (0, searchMultiThread_1.searchMultiThread)({
        mode: 'exact',
        filePaths: filesList,
        queryCodes: [query]
    });
    expect(resultsMulti.length).toBe(204);
    expect(resultsMulti.length).toBe(resultsSingle.length);
    const codeSingle = resultsSingle.map(({ code }) => code);
    const codeMulti = resultsMulti.map(({ code }) => code);
    const compareResults = codeSingle
        .map((code, idx) => (0, astUtils_1.compareCode)(code, codeMulti[idx]))
        .reduce((acc, result) => result && acc, true);
    expect(compareResults).toBeTruthy();
}));
